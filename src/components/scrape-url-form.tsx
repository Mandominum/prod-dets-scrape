"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2, Package } from "lucide-react";

interface ScrapeUrlFormProps {
  onSuccess?: (productId: string) => void;
}

export function ScrapeUrlForm({ onSuccess }: ScrapeUrlFormProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!url.trim()) {
      setError("Please enter a product URL");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/products/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to scrape product");
      }

      setSuccess(true);
      setUrl("");

      if (onSuccess && data.data?.productId) {
        onSuccess(data.data.productId);
      }

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred while scraping");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="product-url">Product URL</Label>
        <div className="mt-1 flex gap-2">
          <Input
            id="product-url"
            type="url"
            placeholder="https://www.amazon.com/dp/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                Add Product
              </>
            )}
          </Button>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Supports Amazon, Shopify, and WooCommerce stores
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-md">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>Product scraped successfully!</span>
        </div>
      )}
    </form>
  );
}
