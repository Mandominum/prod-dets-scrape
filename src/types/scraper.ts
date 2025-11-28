// Platform types
export enum Platform {
  AMAZON = "amazon",
  SHOPIFY = "shopify",
  WOOCOMMERCE = "woocommerce",
  UNKNOWN = "unknown",
}

// Product variant type
export interface ProductVariant {
  type: string;
  value: string;
  available: boolean;
  price?: number;
}

// Scraped product data structure
export interface ScrapedProduct {
  // Required fields
  name: string;
  url: string;
  platform: Platform;

  // Basic Information
  priceNow: number | null;
  priceOriginal: number | null;
  currency: string;
  sku?: string;
  brand?: string;

  // Rich Details
  description?: string;
  specifications?: Record<string, any>;
  features?: string[];
  ratingAverage?: number;
  ratingCount?: number;

  // Media
  primaryImageUrl?: string;
  images?: string[];
  videos?: string[];

  // Availability
  stockStatus: "in_stock" | "out_of_stock" | "limited" | "unknown";
  shippingInfo?: Record<string, any>;
  variants?: ProductVariant[];

  // Organization
  categories?: string[];

  // Extensibility
  metadata?: Record<string, any>;
}

// Scraper interface that all platform scrapers must implement
export interface ProductScraper {
  scrape(url: string): Promise<ScrapedProduct>;
  canHandle(platform: Platform): boolean;
}

// Scraping job status
export type JobStatus = "pending" | "processing" | "completed" | "failed";

// Error types for better error handling
export class ScraperError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "ScraperError";
  }
}
