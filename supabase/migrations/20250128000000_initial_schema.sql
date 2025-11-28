-- Product List Scraper - Initial Database Schema
-- This migration creates all tables, indexes, RLS policies, and triggers

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Products table: Store all scraped product data
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL,

  -- Basic Information
  name TEXT NOT NULL,
  price_current NUMERIC(10, 2),
  price_original NUMERIC(10, 2),
  currency TEXT DEFAULT 'USD',
  sku TEXT,
  brand TEXT,

  -- Rich Details
  description TEXT,
  specifications JSONB DEFAULT '{}',
  features JSONB DEFAULT '[]',
  rating_average NUMERIC(3, 2),
  rating_count INTEGER,

  -- Media
  primary_image_url TEXT,
  images JSONB DEFAULT '[]',
  videos JSONB DEFAULT '[]',

  -- Availability
  stock_status TEXT CHECK (stock_status IN ('in_stock', 'out_of_stock', 'limited', 'unknown')),
  shipping_info JSONB DEFAULT '{}',
  variants JSONB DEFAULT '[]',

  -- Organization
  categories JSONB DEFAULT '[]',

  -- Extensibility
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lists table: User-created collections of products
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table: Collections of lists
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Lists junction table: Many-to-many relationship
CREATE TABLE product_lists (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  custom_notes TEXT,
  PRIMARY KEY (product_id, list_id)
);

-- List Groups junction table: Many-to-many relationship
CREATE TABLE list_groups (
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (list_id, group_id)
);

-- Scraping Jobs table: Track scraping operations
CREATE TABLE scraping_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  platform TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price History table: Track price changes over time
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stock_status TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Products indexes
CREATE INDEX idx_products_url ON products(url);
CREATE INDEX idx_products_platform ON products(platform);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_last_scraped_at ON products(last_scraped_at DESC);

-- Lists indexes
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_lists_created_at ON lists(created_at DESC);

-- Groups indexes
CREATE INDEX idx_groups_user_id ON groups(user_id);
CREATE INDEX idx_groups_created_at ON groups(created_at DESC);

-- Product Lists indexes
CREATE INDEX idx_product_lists_list_id ON product_lists(list_id);
CREATE INDEX idx_product_lists_product_id ON product_lists(product_id);
CREATE INDEX idx_product_lists_added_at ON product_lists(added_at DESC);

-- List Groups indexes
CREATE INDEX idx_list_groups_group_id ON list_groups(group_id);
CREATE INDEX idx_list_groups_list_id ON list_groups(list_id);

-- Scraping Jobs indexes
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX idx_scraping_jobs_user_id ON scraping_jobs(user_id);
CREATE INDEX idx_scraping_jobs_created_at ON scraping_jobs(created_at DESC);
CREATE INDEX idx_scraping_jobs_product_id ON scraping_jobs(product_id);

-- Price History indexes
CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all user-owned tables
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Lists policies: Users can only access their own lists
CREATE POLICY "Users can view their own lists"
  ON lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lists"
  ON lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
  ON lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
  ON lists FOR DELETE
  USING (auth.uid() = user_id);

-- Groups policies: Users can only access their own groups
CREATE POLICY "Users can view their own groups"
  ON groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups"
  ON groups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups"
  ON groups FOR DELETE
  USING (auth.uid() = user_id);

-- Product Lists policies: Users can manage products in their own lists
CREATE POLICY "Users can view products in their lists"
  ON product_lists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = product_lists.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add products to their lists"
  ON product_lists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = product_lists.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove products from their lists"
  ON product_lists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = product_lists.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update product notes in their lists"
  ON product_lists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = product_lists.list_id
      AND lists.user_id = auth.uid()
    )
  );

-- List Groups policies: Users can manage lists in their own groups
CREATE POLICY "Users can view lists in their groups"
  ON list_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = list_groups.group_id
      AND groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add lists to their groups"
  ON list_groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = list_groups.group_id
      AND groups.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_groups.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove lists from their groups"
  ON list_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = list_groups.group_id
      AND groups.user_id = auth.uid()
    )
  );

-- Products policies: Public read, authenticated users can create/update
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create products"
  ON products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Scraping Jobs policies: Users can only access their own jobs
CREATE POLICY "Users can view their own scraping jobs"
  ON scraping_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scraping jobs"
  ON scraping_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scraping jobs"
  ON scraping_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Price History policies: Anyone can view, authenticated users can create
CREATE POLICY "Anyone can view price history"
  ON price_history FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create price history"
  ON price_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to automatically record price history when product price changes
CREATE OR REPLACE FUNCTION record_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record if price actually changed
  IF (OLD.price_current IS DISTINCT FROM NEW.price_current) OR
     (OLD.stock_status IS DISTINCT FROM NEW.stock_status) THEN
    INSERT INTO price_history (product_id, price, currency, stock_status)
    VALUES (NEW.id, NEW.price_current, NEW.currency, NEW.stock_status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply price history trigger
CREATE TRIGGER track_price_changes
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION record_price_change();

-- =====================================================
-- INITIAL DATA / SEED (Optional)
-- =====================================================

-- No seed data needed for production
-- Users will create their own lists and groups

COMMENT ON TABLE products IS 'Stores all scraped product data from various e-commerce platforms';
COMMENT ON TABLE lists IS 'User-created collections of products';
COMMENT ON TABLE groups IS 'User-created collections of lists';
COMMENT ON TABLE product_lists IS 'Junction table for many-to-many relationship between products and lists';
COMMENT ON TABLE list_groups IS 'Junction table for many-to-many relationship between lists and groups';
COMMENT ON TABLE scraping_jobs IS 'Tracks the status and history of scraping operations';
COMMENT ON TABLE price_history IS 'Historical record of product price changes';
