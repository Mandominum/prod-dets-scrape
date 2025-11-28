import { chromium } from "playwright";
import { BaseScraper } from "./base-scraper";
import { Platform, ScrapedProduct, ScraperError } from "@/types/scraper";

export class AmazonScraper extends BaseScraper {
  canHandle(platform: Platform): boolean {
    return platform === Platform.AMAZON;
  }

  async scrape(url: string): Promise<ScrapedProduct> {
    const browser = await chromium.launch({
      headless: true,
    });

    try {
      const page = await browser.newPage();

      // Set user agent to avoid bot detection
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: this.timeout,
      });

      // Wait for main content to load
      await page.waitForSelector("#productTitle", { timeout: 10000 });

      // Extract product data
      const productData = await page.evaluate(() => {
        // Helper function
        const getText = (selector: string): string | null => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() || null;
        };

        const getAttr = (selector: string, attr: string): string | null => {
          const element = document.querySelector(selector);
          return element?.getAttribute(attr) || null;
        };

        // Product name
        const name = getText("#productTitle") || "";

        // Prices
        const priceWhole = getText(".a-price-whole");
        const priceFraction = getText(".a-price-fraction");
        const priceSymbol = getText(".a-price-symbol");

        let priceNow = null;
        if (priceWhole) {
          priceNow = `${priceSymbol || "$"}${priceWhole}${priceFraction || ""}`;
        }

        // Original price (if on sale)
        const priceOriginal = getText(".a-price.a-text-price .a-offscreen");

        // Brand
        const brand = getText("#bylineInfo") || getText("a#brand");

        // Description
        const description = getText("#feature-bullets") || getText("#productDescription");

        // Rating
        const rating = getText(".a-icon-star .a-icon-alt");
        const ratingCount = getText("#acrCustomerReviewText");

        // Images
        const primaryImage = getAttr("#landingImage", "src") || getAttr("#imgBlkFront", "src");

        const imageElements = document.querySelectorAll(".imageThumbnail img");
        const images: string[] = [];
        imageElements.forEach((img) => {
          const src = img.getAttribute("src");
          if (src) images.push(src.replace(/_AC_.*\.jpg/, "_AC_SL1500_.jpg"));
        });

        // Stock status
        let stockStatus: "in_stock" | "out_of_stock" | "limited" | "unknown" = "unknown";
        const availability = getText("#availability span");
        if (availability) {
          if (availability.toLowerCase().includes("in stock")) {
            stockStatus = "in_stock";
          } else if (availability.toLowerCase().includes("out of stock")) {
            stockStatus = "out_of_stock";
          } else if (availability.toLowerCase().includes("only") && availability.toLowerCase().includes("left")) {
            stockStatus = "limited";
          }
        }

        // Features
        const featureElements = document.querySelectorAll("#feature-bullets li");
        const features: string[] = [];
        featureElements.forEach((li) => {
          const text = li.textContent?.trim();
          if (text) features.push(text);
        });

        // Specifications
        const specifications: Record<string, any> = {};
        const specRows = document.querySelectorAll("#productDetails_techSpec_section_1 tr");
        specRows.forEach((row) => {
          const key = row.querySelector("th")?.textContent?.trim();
          const value = row.querySelector("td")?.textContent?.trim();
          if (key && value) {
            specifications[key] = value;
          }
        });

        // Categories
        const categories: string[] = [];
        const breadcrumbs = document.querySelectorAll("#wayfinding-breadcrumbs_feature_div li");
        breadcrumbs.forEach((crumb) => {
          const text = crumb.textContent?.trim();
          if (text && !text.includes("›")) {
            categories.push(text);
          }
        });

        return {
          name,
          priceNow,
          priceOriginal,
          brand,
          description,
          rating,
          ratingCount,
          primaryImage,
          images,
          stockStatus,
          features,
          specifications,
          categories,
        };
      });

      // Process extracted data
      const scrapedProduct: ScrapedProduct = {
        name: this.cleanText(productData.name),
        url,
        platform: Platform.AMAZON,
        priceNow: this.extractPrice(productData.priceNow || ""),
        priceOriginal: this.extractPrice(productData.priceOriginal || ""),
        currency: "USD", // TODO: Detect from price symbol
        brand: this.cleanText(productData.brand),
        description: this.cleanText(productData.description),
        specifications: productData.specifications,
        features: productData.features,
        ratingAverage: this.extractRating(productData.rating || ""),
        ratingCount: this.extractRatingCount(productData.ratingCount || ""),
        primaryImageUrl: productData.primaryImage || undefined,
        images: productData.images,
        stockStatus: productData.stockStatus,
        categories: productData.categories,
      };

      return scrapedProduct;
    } catch (error: any) {
      throw new ScraperError(
        `Failed to scrape Amazon product: ${error.message}`,
        "AMAZON_SCRAPE_ERROR"
      );
    } finally {
      await browser.close();
    }
  }

  private extractRatingCount(text: string): number | null {
    if (!text) return null;
    const match = text.match(/(\d+(?:,\d+)*)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ""));
    }
    return null;
  }
}
