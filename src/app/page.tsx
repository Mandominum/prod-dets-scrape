"use client";

import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center max-w-3xl">
        <div className="flex justify-center mb-6">
          <Package className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Product List Scraper
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Scrape and manage product lists from e-commerce platforms like Amazon, Shopify, and WooCommerce
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/sign-up">
            <Button size="lg">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="font-bold mb-2">Multi-Platform Support</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Scrape products from Amazon, Shopify, WooCommerce and more
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="font-bold mb-2">Organize & Track</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create lists and groups to organize your products efficiently
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="font-bold mb-2">N8N Integration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect with N8N for automated workflows and analysis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
