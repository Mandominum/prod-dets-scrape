export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          url: string;
          platform: string;
          name: string;
          price_current: number | null;
          price_original: number | null;
          currency: string | null;
          sku: string | null;
          brand: string | null;
          description: string | null;
          specifications: Json;
          features: Json;
          rating_average: number | null;
          rating_count: number | null;
          primary_image_url: string | null;
          images: Json;
          videos: Json;
          stock_status: string | null;
          shipping_info: Json;
          variants: Json;
          categories: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
          last_scraped_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          platform: string;
          name: string;
          price_current?: number | null;
          price_original?: number | null;
          currency?: string | null;
          sku?: string | null;
          brand?: string | null;
          description?: string | null;
          specifications?: Json;
          features?: Json;
          rating_average?: number | null;
          rating_count?: number | null;
          primary_image_url?: string | null;
          images?: Json;
          videos?: Json;
          stock_status?: string | null;
          shipping_info?: Json;
          variants?: Json;
          categories?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_scraped_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          platform?: string;
          name?: string;
          price_current?: number | null;
          price_original?: number | null;
          currency?: string | null;
          sku?: string | null;
          brand?: string | null;
          description?: string | null;
          specifications?: Json;
          features?: Json;
          rating_average?: number | null;
          rating_count?: number | null;
          primary_image_url?: string | null;
          images?: Json;
          videos?: Json;
          stock_status?: string | null;
          shipping_info?: Json;
          variants?: Json;
          categories?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_scraped_at?: string;
        };
      };
      lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      scraping_jobs: {
        Row: {
          id: string;
          product_id: string | null;
          user_id: string;
          url: string;
          platform: string | null;
          status: string;
          error_message: string | null;
          retry_count: number;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          user_id: string;
          url: string;
          platform?: string | null;
          status?: string;
          error_message?: string | null;
          retry_count?: number;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          user_id?: string;
          url?: string;
          platform?: string | null;
          status?: string;
          error_message?: string | null;
          retry_count?: number;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
