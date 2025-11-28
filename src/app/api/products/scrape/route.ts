import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ScrapingService } from "@/lib/scraping-service";
import { ScraperError } from "@/types/scraper";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { url, listId } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Create scraping service and scrape product
    const scrapingService = new ScrapingService();
    const result = await scrapingService.scrapeProduct(url, user.id, listId);

    return NextResponse.json({
      success: true,
      data: {
        productId: result.productId,
        jobId: result.jobId,
        product: result.product,
      },
    });
  } catch (error: any) {
    console.error("Scraping error:", error);

    if (error instanceof ScraperError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to scrape product",
          code: "UNKNOWN_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
