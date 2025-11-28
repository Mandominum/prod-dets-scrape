import { createClient } from "@/lib/supabase/server";
import { Platform, ScrapedProduct, ScraperError } from "@/types/scraper";
import { detectPlatform, isValidUrl, normalizeUrl } from "@/scrapers/platform-detector";
import { AmazonScraper } from "@/scrapers/amazon-scraper";
import { ShopifyScraper } from "@/scrapers/shopify-scraper";
import { WooCommerceScraper } from "@/scrapers/woocommerce-scraper";

/**
 * Main scraping service that orchestrates the scraping process
 */
export class ScrapingService {
  private scrapers = new Map();

  constructor() {
    // Register all scrapers
    this.scrapers.set(Platform.AMAZON, new AmazonScraper());
    this.scrapers.set(Platform.SHOPIFY, new ShopifyScraper());
    this.scrapers.set(Platform.WOOCOMMERCE, new WooCommerceScraper());
  }

  /**
   * Scrape a product from a URL and save to database
   */
  async scrapeProduct(url: string, userId: string, listId?: string) {
    // Validate URL
    const normalizedUrl = normalizeUrl(url);
    if (!isValidUrl(normalizedUrl)) {
      throw new ScraperError("Invalid URL provided", "INVALID_URL");
    }

    const supabase = await createClient();

    // Create scraping job
    const { data: job, error: jobError } = await supabase
      .from("scraping_jobs")
      .insert({
        url: normalizedUrl,
        user_id: userId,
        status: "pending",
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error("Failed to create scraping job");
    }

    try {
      // Update job to processing
      await supabase
        .from("scraping_jobs")
        .update({
          status: "processing",
          started_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      // Detect platform
      const platform = detectPlatform(normalizedUrl);

      await supabase
        .from("scraping_jobs")
        .update({ platform })
        .eq("id", job.id);

      if (platform === Platform.UNKNOWN) {
        throw new ScraperError(
          "Unsupported platform. Currently supports Amazon, Shopify, and WooCommerce.",
          "UNSUPPORTED_PLATFORM"
        );
      }

      // Get appropriate scraper
      const scraper = this.scrapers.get(platform);
      if (!scraper) {
        throw new ScraperError(
          "No scraper available for this platform",
          "NO_SCRAPER"
        );
      }

      // Scrape the product
      const scrapedProduct = await scraper.scrape(normalizedUrl);

      // Check if product already exists
      const { data: existingProduct } = await supabase
        .from("products")
        .select("id")
        .eq("url", normalizedUrl)
        .single();

      let productId: string;

      if (existingProduct) {
        // Update existing product
        const { data: updatedProduct, error: updateError } = await supabase
          .from("products")
          .update({
            name: scrapedProduct.name,
            price_current: scrapedProduct.priceNow,
            price_original: scrapedProduct.priceOriginal,
            currency: scrapedProduct.currency,
            sku: scrapedProduct.sku,
            brand: scrapedProduct.brand,
            description: scrapedProduct.description,
            specifications: scrapedProduct.specifications || {},
            features: scrapedProduct.features || [],
            rating_average: scrapedProduct.ratingAverage,
            rating_count: scrapedProduct.ratingCount,
            primary_image_url: scrapedProduct.primaryImageUrl,
            images: scrapedProduct.images || [],
            videos: scrapedProduct.videos || [],
            stock_status: scrapedProduct.stockStatus,
            shipping_info: scrapedProduct.shippingInfo || {},
            variants: scrapedProduct.variants || [],
            categories: scrapedProduct.categories || [],
            metadata: scrapedProduct.metadata || {},
            last_scraped_at: new Date().toISOString(),
          })
          .eq("id", existingProduct.id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update product: ${updateError.message}`);
        }

        productId = existingProduct.id;
      } else {
        // Insert new product
        const { data: newProduct, error: insertError } = await supabase
          .from("products")
          .insert({
            url: normalizedUrl,
            platform: scrapedProduct.platform,
            name: scrapedProduct.name,
            price_current: scrapedProduct.priceNow,
            price_original: scrapedProduct.priceOriginal,
            currency: scrapedProduct.currency,
            sku: scrapedProduct.sku,
            brand: scrapedProduct.brand,
            description: scrapedProduct.description,
            specifications: scrapedProduct.specifications || {},
            features: scrapedProduct.features || [],
            rating_average: scrapedProduct.ratingAverage,
            rating_count: scrapedProduct.ratingCount,
            primary_image_url: scrapedProduct.primaryImageUrl,
            images: scrapedProduct.images || [],
            videos: scrapedProduct.videos || [],
            stock_status: scrapedProduct.stockStatus,
            shipping_info: scrapedProduct.shippingInfo || {},
            variants: scrapedProduct.variants || [],
            categories: scrapedProduct.categories || [],
            metadata: scrapedProduct.metadata || {},
          })
          .select()
          .single();

        if (insertError || !newProduct) {
          throw new Error(`Failed to insert product: ${insertError?.message}`);
        }

        productId = newProduct.id;
      }

      // If listId provided, add product to list
      if (listId) {
        await supabase
          .from("product_lists")
          .insert({
            product_id: productId,
            list_id: listId,
          })
          .onConflict("product_id, list_id")
          .ignoreDuplicates();
      }

      // Update job as completed
      await supabase
        .from("scraping_jobs")
        .update({
          status: "completed",
          product_id: productId,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      return {
        success: true,
        productId,
        jobId: job.id,
        product: scrapedProduct,
      };
    } catch (error: any) {
      // Update job as failed
      await supabase
        .from("scraping_jobs")
        .update({
          status: "failed",
          error_message: error.message || "Unknown error",
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      throw error;
    }
  }
}
