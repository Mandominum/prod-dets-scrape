# 🚀 Database Setup Instructions

## Quick Start - Run Migration in Supabase Dashboard

Since we're using your existing Supabase project, follow these steps to run the migration:

### Step 1: Open Supabase SQL Editor

1. Go to: **https://supabase.com/dashboard/project/rmawyquwdkrqjqovibve**
2. Click **SQL Editor** in the left sidebar
3. Click **New Query** button

### Step 2: Copy the Migration SQL

Open the migration file:
```
supabase/migrations/20250128000000_initial_schema.sql
```

Or view it here in your IDE - it contains all the SQL to create:
- 7 tables (products, lists, groups, etc.)
- All indexes for performance
- Row Level Security policies
- Automatic triggers

### Step 3: Run the Migration

1. **Copy** the entire contents of `20250128000000_initial_schema.sql`
2. **Paste** into the Supabase SQL Editor
3. Click **Run** (or press `Cmd/Ctrl + Enter`)
4. Wait for the success message

### Step 4: Verify Setup

After running the migration:

1. Click **Table Editor** in the left sidebar
2. You should see these tables:
   - ✅ products
   - ✅ lists
   - ✅ groups
   - ✅ product_lists
   - ✅ list_groups
   - ✅ scraping_jobs
   - ✅ price_history

3. Click on any table to see its structure

### Step 5: Test the Database (Optional)

Run this test query in SQL Editor to verify everything works:

```sql
-- Test: Insert a sample product
INSERT INTO products (url, platform, name, price_current, currency, stock_status)
VALUES (
  'https://example.com/test-product',
  'amazon',
  'Test Product',
  99.99,
  'USD',
  'in_stock'
)
RETURNING *;

-- Test: View all products
SELECT * FROM products;

-- Test: Clean up (delete test product)
DELETE FROM products WHERE url = 'https://example.com/test-product';
```

## Alternative: Install Supabase CLI (Advanced)

If you want to use the CLI for future migrations:

```bash
# macOS
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase

# Then link your project
supabase link --project-ref rmawyquwdkrqjqovibve
```

## ✅ After Migration is Complete

Once you've run the migration successfully:

1. Confirm your `.env.local` file exists with these values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://rmawyquwdkrqjqovibve.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_fHTDWyshKzULLUAjI9qY3Q_sgJbRDIu
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_TmGjwwKC3R6MT1Ez2ImhLw_K57G1hdk
   ```

2. Your database is now ready for the application!

## 🆘 Troubleshooting

### "Permission denied" or "Access denied"
- Make sure you're logged into the correct Supabase account
- Verify you have owner/admin access to the project

### "Table already exists"
- Some tables might already exist
- You can either:
  - Drop existing tables first (if safe to do so)
  - Or modify the migration to skip existing tables

### Migration fails partway through
- Check the error message in the SQL Editor output
- Fix the issue and re-run from that point
- Or drop all tables and re-run the entire migration

## 📝 What Gets Created

### Tables
- **products**: All scraped product data (25+ fields)
- **lists**: User product collections
- **groups**: Collections of lists
- **product_lists**: Links products to lists
- **list_groups**: Links lists to groups
- **scraping_jobs**: Tracks scraping operations
- **price_history**: Automatic price tracking

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own lists/groups
- Products are publicly readable
- 20+ security policies configured

### Performance
- 15 indexes for fast queries
- Automatic updated_at timestamps
- Automatic price history tracking

## 🎯 Next Steps After Migration

Once your database is set up, we can:
1. Build the authentication pages
2. Create the dashboard UI
3. Implement the scraping engine
4. Test everything end-to-end

---

**Need help?** Check `supabase/README.md` for more detailed documentation.
