import { BaseScraper } from "./base-scraper";
import { Platform, ScrapedProduct, ScraperError } from "@/types/scraper";

export class ShopifyScraper extends BaseScraper {
  canHandle(platform: Platform): boolean {
    return platform === Platform.SHOPIFY;
  }

  async scrape(url: string): Promise<ScrapedProduct> {
    try {
      // Shopify has a convenient JSON endpoint
      const productHandle = this.extractProductHandle(url);
      const jsonUrl = this.buildJsonUrl(url, productHandle);

      const response = await fetch(jsonUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const product = data.product;

      if (!product) {
        throw new Error("Product not found in JSON response");
      }

      // Extract variants
      const variants = product.variants?.map((v: any) => ({
        type: "variant",
        value: v.title,
        available: v.available,
        price: parseFloat(v.price) / 100, // Shopify stores prices in cents
      })) || [];

      // Extract images
      const images = product.images?.map((img: any) => img.src) || [];
      const primaryImage = images[0];

      // Determine stock status
      let stockStatus: "in_stock" | "out_of_stock" | "limited" | "unknown" = "unknown";
      if (product.available === false) {
        stockStatus = "out_of_stock";
      } else if (product.available === true) {
        stockStatus = "in_stock";
      }

      // Build scraped product
      const scrapedProduct: ScrapedProduct = {
        name: product.title,
        url,
        platform: Platform.SHOPIFY,
        priceNow: product.variants?.[0]?.price
          ? parseFloat(product.variants[0].price) / 100
          : null,
        priceOriginal: product.variants?.[0]?.compare_at_price
          ? parseFloat(product.variants[0].compare_at_price) / 100
          : null,
        currency: "USD", // TODO: Detect from store
        brand: product.vendor || undefined,
        description: this.stripHtml(product.body_html || ""),
        sku: product.variants?.[0]?.sku || undefined,
        primaryImageUrl: primaryImage,
        images,
        stockStatus,
        variants,
        categories: product.product_type ? [product.product_type] : [],
        metadata: {
          shopifyId: product.id,
          handle: product.handle,
          tags: product.tags,
        },
      };

      return scrapedProduct;
    } catch (error: any) {
      throw new ScraperError(
        `Failed to scrape Shopify product: ${error.message}`,
        "SHOPIFY_SCRAPE_ERROR"
      );
    }
  }

  private extractProductHandle(url: string): string {
    // Extract product handle from URL
    // URLs typically look like: https://store.com/products/product-handle
    const match = url.match(/\/products\/([^/?#]+)/);
    return match ? match[1] : "";
  }

  private buildJsonUrl(url: string, handle: string): string {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}/products/${handle}.json`;
  }

  private stripHtml(html: string): string {
    // Simple HTML stripping (in production, use a proper HTML parser)
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
}
