# Supabase Database Setup

This directory contains the database schema and migrations for the Product List Scraper application.

## Quick Setup

### 1. Run the Migration in Supabase

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `migrations/20250128000000_initial_schema.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Cmd/Ctrl + Enter`

### 2. Verify the Setup

After running the migration, verify that all tables were created:

1. Go to **Table Editor** in Supabase dashboard
2. You should see the following tables:
   - `products`
   - `lists`
   - `groups`
   - `product_lists`
   - `list_groups`
   - `scraping_jobs`
   - `price_history`

### 3. Configure Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these values in:
- Supabase Dashboard → Settings → API

## Database Schema Overview

### Core Tables

#### `products`
Stores all scraped product data with comprehensive fields:
- Basic info: name, price, SKU, brand
- Rich details: description, specifications, features, ratings
- Media: images, videos
- Availability: stock status, shipping, variants
- Metadata: platform, categories, custom fields

#### `lists`
User-created collections of products. Each list belongs to a user.

#### `groups`
Collections of lists for better organization. Each group belongs to a user.

#### `product_lists` (Junction Table)
Links products to lists (many-to-many relationship).

#### `list_groups` (Junction Table)
Links lists to groups (many-to-many relationship).

#### `scraping_jobs`
Tracks scraping operations with status, errors, and retry information.

#### `price_history`
Automatically records price changes for products over time.

### Security (Row Level Security)

All tables have RLS enabled with policies:
- Users can only access their own lists and groups
- Products are publicly readable, authenticated users can create/update
- Scraping jobs are private to each user
- Price history is publicly readable

### Automatic Features

1. **Updated At Timestamps**: Automatically maintained on `products`, `lists`, and `groups`
2. **Price History Tracking**: Automatically records price changes when products are updated
3. **Cascade Deletes**: Deleting a list/group automatically removes associated relationships

## Testing the Schema

You can test the schema with some sample data:

```sql
-- After running the migration, insert a test product
INSERT INTO products (url, platform, name, price_current, currency, stock_status)
VALUES (
  'https://example.com/product/123',
  'amazon',
  'Test Product',
  29.99,
  'USD',
  'in_stock'
);

-- Verify it was created
SELECT * FROM products;
```

## Troubleshooting

### Migration Fails
- Make sure you're running it in the **SQL Editor**, not Table Editor
- Check for any error messages in the output panel
- Ensure your Supabase project is active

### RLS Policies Not Working
- Make sure you're authenticated when testing
- Check the policies in **Authentication → Policies**
- Verify `auth.uid()` returns a valid user ID

### Tables Not Showing
- Refresh the Table Editor page
- Check the **Database** → **Tables** section
- Verify the migration ran successfully (no errors)

## Next Steps

After setting up the database:
1. ✅ Database schema created
2. ⏳ Set up authentication (sign up/sign in)
3. ⏳ Build the UI components
4. ⏳ Implement scraping logic
5. ⏳ Connect everything together

## Schema Diagram

```
users (Supabase Auth)
  ↓
  ├─→ lists ←─→ product_lists ←─→ products
  │      ↓
  │   list_groups
  │      ↓
  └─→ groups

  └─→ scraping_jobs → products

products → price_history
```

## Useful Queries

### Get all lists with product count
```sql
SELECT
  l.id,
  l.name,
  COUNT(pl.product_id) as product_count
FROM lists l
LEFT JOIN product_lists pl ON l.id = pl.list_id
GROUP BY l.id, l.name;
```

### Get price history for a product
```sql
SELECT * FROM price_history
WHERE product_id = 'your-product-id'
ORDER BY recorded_at DESC;
```

### Get all products in a list
```sql
SELECT p.*, pl.added_at, pl.custom_notes
FROM products p
JOIN product_lists pl ON p.id = pl.product_id
WHERE pl.list_id = 'your-list-id'
ORDER BY pl.added_at DESC;
```
