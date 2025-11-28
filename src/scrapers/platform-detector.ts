import { Platform } from "@/types/scraper";

/**
 * Detects the e-commerce platform from a given URL
 */
export function detectPlatform(url: string): Platform {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Amazon detection
    if (
      hostname.includes("amazon.") ||
      hostname.includes("amzn.") ||
      hostname === "a.co"
    ) {
      return Platform.AMAZON;
    }

    // Shopify detection - direct shopify domains
    if (hostname.includes("myshopify.com")) {
      return Platform.SHOPIFY;
    }

    // Note: For custom Shopify domains, we'll need to check meta tags
    // This will be handled in the scraper itself

    // WooCommerce is harder to detect from URL alone
    // Will need to check page content for WooCommerce indicators

    return Platform.UNKNOWN;
  } catch (error) {
    return Platform.UNKNOWN;
  }
}

/**
 * Validates if a URL is properly formed
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalizes a URL by ensuring it has a protocol
 */
export function normalizeUrl(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}
