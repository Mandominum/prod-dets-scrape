import { Platform, ProductScraper, ScrapedProduct, ScraperError } from "@/types/scraper";

/**
 * Abstract base class for all scrapers
 */
export abstract class BaseScraper implements ProductScraper {
  protected timeout: number;
  protected maxRetries: number;

  constructor() {
    this.timeout = parseInt(process.env.SCRAPING_TIMEOUT_MS || "30000");
    this.maxRetries = parseInt(process.env.SCRAPING_RETRY_COUNT || "3");
  }

  abstract scrape(url: string): Promise<ScrapedProduct>;
  abstract canHandle(platform: Platform): boolean;

  /**
   * Extract price from a string (handles various formats)
   */
  protected extractPrice(priceText: string): number | null {
    if (!priceText) return null;

    // Remove currency symbols and extract numbers
    const cleaned = priceText
      .replace(/[$£€¥,\s]/g, "")
      .replace(/[^\d.]/g, "");

    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  /**
   * Extract rating from various formats
   */
  protected extractRating(ratingText: string): number | null {
    if (!ratingText) return null;

    const match = ratingText.match(/(\d+\.?\d*)\s*out of\s*(\d+)/i);
    if (match) {
      return parseFloat(match[1]);
    }

    const simpleMatch = ratingText.match(/(\d+\.?\d*)/);
    if (simpleMatch) {
      const rating = parseFloat(simpleMatch[1]);
      return rating <= 5 ? rating : null; // Assume 5-star scale
    }

    return null;
  }

  /**
   * Clean and normalize text
   */
  protected cleanText(text: string | null | undefined): string {
    if (!text) return "";
    return text.trim().replace(/\s+/g, " ");
  }

  /**
   * Sleep utility for rate limiting
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
