import { chromium } from "playwright";
import { BaseScraper } from "./base-scraper";
import { Platform, ScrapedProduct, ScraperError } from "@/types/scraper";

export class WooCommerceScraper extends BaseScraper {
  canHandle(platform: Platform): boolean {
    return platform === Platform.WOOCOMMERCE;
  }

  async scrape(url: string): Promise<ScrapedProduct> {
    const browser = await chromium.launch({
      headless: true,
    });

    try {
      const page = await browser.newPage();

      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      );

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: this.timeout,
      });

      // Wait for WooCommerce product content
      await page.waitForSelector(".product", { timeout: 10000 });

      const productData = await page.evaluate(() => {
        const getText = (selector: string): string | null => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() || null;
        };

        const getAttr = (selector: string, attr: string): string | null => {
          const element = document.querySelector(selector);
          return element?.getAttribute(attr) || null;
        };

        // Product name
        const name =
          getText(".product_title") ||
          getText("h1.entry-title") ||
          getText(".woocommerce-loop-product__title") ||
          "";

        // Prices
        const priceNow =
          getText(".price ins .amount") ||
          getText(".price .amount") ||
          getText(".woocommerce-Price-amount");

        const priceOriginal = getText(".price del .amount");

        // Description
        const description =
          getText(".woocommerce-product-details__short-description") ||
          getText(".product .entry-summary");

        // Stock status
        const stockElement = document.querySelector(".stock");
        let stockStatus: "in_stock" | "out_of_stock" | "limited" | "unknown" = "unknown";
        if (stockElement) {
          const stockText = stockElement.textContent?.toLowerCase() || "";
          if (stockText.includes("in stock")) {
            stockStatus = "in_stock";
          } else if (stockText.includes("out of stock")) {
            stockStatus = "out_of_stock";
          }
        }

        // Images
        const primaryImage =
          getAttr(".woocommerce-product-gallery__image img", "src") ||
          getAttr(".product .images img", "src");

        const imageElements = document.querySelectorAll(
          ".woocommerce-product-gallery__image img"
        );
        const images: string[] = [];
        imageElements.forEach((img) => {
          const src = img.getAttribute("src");
          if (src) images.push(src);
        });

        // Categories
        const categories: string[] = [];
        const categoryLinks = document.querySelectorAll(".posted_in a");
        categoryLinks.forEach((link) => {
          const text = link.textContent?.trim();
          if (text) categories.push(text);
        });

        // SKU
        const sku = getText(".sku");

        // Attributes/Specifications
        const specifications: Record<string, any> = {};
        const attrRows = document.querySelectorAll(".woocommerce-product-attributes-item");
        attrRows.forEach((row) => {
          const key = row.querySelector(".woocommerce-product-attributes-item__label")?.textContent?.trim();
          const value = row.querySelector(".woocommerce-product-attributes-item__value")?.textContent?.trim();
          if (key && value) {
            specifications[key] = value;
          }
        });

        return {
          name,
          priceNow,
          priceOriginal,
          description,
          stockStatus,
          primaryImage,
          images,
          categories,
          sku,
          specifications,
        };
      });

      const scrapedProduct: ScrapedProduct = {
        name: this.cleanText(productData.name),
        url,
        platform: Platform.WOOCOMMERCE,
        priceNow: this.extractPrice(productData.priceNow || ""),
        priceOriginal: this.extractPrice(productData.priceOriginal || ""),
        currency: "USD", // TODO: Detect currency
        description: this.cleanText(productData.description),
        sku: productData.sku || undefined,
        primaryImageUrl: productData.primaryImage || undefined,
        images: productData.images,
        stockStatus: productData.stockStatus,
        categories: productData.categories,
        specifications: productData.specifications,
      };

      return scrapedProduct;
    } catch (error: any) {
      throw new ScraperError(
        `Failed to scrape WooCommerce product: ${error.message}`,
        "WOOCOMMERCE_SCRAPE_ERROR"
      );
    } finally {
      await browser.close();
    }
  }
}
