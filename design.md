# Product List Scraper - Design Document

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                    (Next.js React Frontend)                     │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐ │
│  │  Dashboard   │  URL Submit  │  List View   │ Group Manage │ │
│  └──────────────┴──────────────┴──────────────┴──────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/REST API
┌────────────────────────┴────────────────────────────────────────┐
│                     Application Server                          │
│                    (Next.js API Routes)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Layer (Controllers)                     │  │
│  │  - Product API    - List API    - Group API             │  │
│  │  - Scrape API     - Webhook API                          │  │
│  └────────┬───────────────────────────────┬─────────────────┘  │
│           │                               │                    │
│  ┌────────┴─────────┐          ┌──────────┴────────────┐      │
│  │ Business Logic   │          │   Scraping Engine     │      │
│  │ - Data Management│          │  - Platform Detector  │      │
│  │ - Validation     │          │  - Amazon Scraper     │      │
│  │ - Authorization  │          │  - Shopify Scraper    │      │
│  └────────┬─────────┘          │  - WooCommerce Scraper│      │
│           │                     │  - Retry Manager      │      │
│           │                     └──────────┬────────────┘      │
│           │                                │                    │
└───────────┼────────────────────────────────┼────────────────────┘
            │                                │
            │ Supabase Client                │ Playwright/Puppeteer
            │                                │
┌───────────┴────────────────────────────────┴────────────────────┐
│                         Data Layer                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Supabase                              │  │
│  │  ┌────────────┬─────────────┬─────────────┬──────────┐  │  │
│  │  │ PostgreSQL │ Auth        │ Storage     │ Realtime │  │  │
│  │  │ Database   │ (Users)     │ (Images)    │ (Events) │  │  │
│  │  └────────────┴─────────────┴─────────────┴──────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Direct DB Connection / API
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                         N8N Workflows                           │
│  - Product Analysis        - Price Monitoring                   │
│  - Data Export            - Alert Generation                    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Description

#### Frontend Layer
- **Next.js React Application**: Modern, server-side rendered web application
- **Responsive UI**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: WebSocket/polling for scraping status updates

#### Application Layer
- **Next.js API Routes**: Serverless API endpoints for handling requests
- **Business Logic**: Data validation, transformation, and orchestration
- **Scraping Engine**: Modular scraper with platform-specific implementations

#### Data Layer
- **Supabase PostgreSQL**: Primary data store for all entities
- **Supabase Auth**: User authentication and session management
- **Supabase Storage**: Optional storage for cached product images
- **Supabase Realtime**: Real-time subscriptions for live updates

#### External Integration
- **N8N**: Consumes data via Supabase API for automated workflows

## 2. Technology Stack

### 2.1 Recommended Stack

#### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: React 18+
- **Styling**: Tailwind CSS
- **Component Library**: shadcn/ui or Radix UI
- **State Management**: React Context / Zustand (for complex state)
- **Form Handling**: React Hook Form + Zod validation
- **HTTP Client**: Native fetch API with Next.js

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Next.js API Routes (full-stack)
- **Language**: TypeScript
- **Web Scraping**:
  - **Playwright** (recommended) - Better for modern SPAs
  - **Cheerio** - Lightweight HTML parsing for static content
- **Validation**: Zod (runtime type validation)
- **Job Queue**: BullMQ or Inngest (for background scraping jobs)

#### Database & Backend Services
- **Database**: Supabase (PostgreSQL 15+)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **ORM/Query Builder**: Supabase JavaScript Client
- **Real-time**: Supabase Realtime

#### DevOps & Infrastructure
- **Hosting**: Vercel (Next.js optimized)
- **Environment Management**: .env files with validation
- **CI/CD**: GitHub Actions or Vercel automatic deployments
- **Monitoring**: Sentry (error tracking), Vercel Analytics
- **Logging**: Pino or Winston

#### Development Tools
- **Package Manager**: pnpm or npm
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode
- **Testing**: Jest + React Testing Library, Playwright (E2E)

### 2.2 Technology Justification

- **Next.js**: Full-stack framework reduces complexity, excellent DX, API routes for backend
- **TypeScript**: Type safety prevents runtime errors, better IDE support
- **Playwright**: Handles JavaScript-heavy sites, anti-bot detection, multiple browser support
- **Supabase**: PostgreSQL with built-in auth, real-time, and REST API (perfect for N8N)
- **Tailwind CSS**: Rapid UI development, consistent design system

## 3. Database Design

### 3.1 Schema Diagram

```
┌─────────────────────────┐
│        users            │
│─────────────────────────│
│ id (uuid) PK            │
│ email (text)            │
│ created_at (timestamp)  │
└──────────┬──────────────┘
           │
           │ 1:N
           │
┌──────────┴──────────────┐         ┌─────────────────────────┐
│      groups             │    N:M  │    list_groups          │
│─────────────────────────│◄────────┤─────────────────────────│
│ id (uuid) PK            │         │ list_id (uuid) FK       │
│ user_id (uuid) FK       │         │ group_id (uuid) FK      │
│ name (text)             │         │ created_at (timestamp)  │
│ description (text)      │         └───────────┬─────────────┘
│ created_at (timestamp)  │                     │
│ updated_at (timestamp)  │                     │ N:M
└─────────────────────────┘                     │
                                    ┌───────────┴─────────────┐
┌─────────────────────────┐         │       lists             │
│   product_lists         │    N:M  │─────────────────────────│
│─────────────────────────│◄────────┤ id (uuid) PK            │
│ product_id (uuid) FK    │         │ user_id (uuid) FK       │
│ list_id (uuid) FK       │         │ name (text)             │
│ added_at (timestamp)    │         │ description (text)      │
│ custom_notes (text)     │         │ created_at (timestamp)  │
└────────┬────────────────┘         │ updated_at (timestamp)  │
         │                          └─────────────────────────┘
         │ N:M
         │
┌────────┴────────────────────────────────────────┐
│                 products                        │
│─────────────────────────────────────────────────│
│ id (uuid) PK                                    │
│ url (text) UNIQUE                               │
│ platform (text) - amazon, shopify, woocommerce  │
│ name (text)                                     │
│ price_current (numeric)                         │
│ price_original (numeric)                        │
│ currency (text)                                 │
│ sku (text)                                      │
│ brand (text)                                    │
│ description (text)                              │
│ specifications (jsonb)                          │
│ features (jsonb)                                │
│ rating_average (numeric)                        │
│ rating_count (integer)                          │
│ primary_image_url (text)                        │
│ images (jsonb) - array of image URLs            │
│ videos (jsonb) - array of video URLs            │
│ stock_status (text) - in_stock, out_of_stock    │
│ shipping_info (jsonb)                           │
│ variants (jsonb) - sizes, colors, etc.          │
│ categories (jsonb)                              │
│ metadata (jsonb) - extensible field             │
│ created_at (timestamp)                          │
│ updated_at (timestamp)                          │
│ last_scraped_at (timestamp)                     │
└────────┬────────────────────────────────────────┘
         │ 1:N
         │
┌────────┴────────────────┐
│   scraping_jobs         │
│─────────────────────────│
│ id (uuid) PK            │
│ product_id (uuid) FK    │
│ user_id (uuid) FK       │
│ url (text)              │
│ platform (text)         │
│ status (text)           │
│   - pending             │
│   - processing          │
│   - completed           │
│   - failed              │
│ error_message (text)    │
│ retry_count (integer)   │
│ started_at (timestamp)  │
│ completed_at (timestamp)│
│ created_at (timestamp)  │
└─────────────────────────┘

┌─────────────────────────┐
│   price_history         │
│─────────────────────────│
│ id (uuid) PK            │
│ product_id (uuid) FK    │
│ price (numeric)         │
│ currency (text)         │
│ stock_status (text)     │
│ recorded_at (timestamp) │
└─────────────────────────┘
```

### 3.2 Table Definitions

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### products
```sql
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

CREATE INDEX idx_products_url ON products(url);
CREATE INDEX idx_products_platform ON products(platform);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
```

#### lists
```sql
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lists_user_id ON lists(user_id);
```

#### groups
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_groups_user_id ON groups(user_id);
```

#### product_lists (junction table)
```sql
CREATE TABLE product_lists (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  custom_notes TEXT,
  PRIMARY KEY (product_id, list_id)
);

CREATE INDEX idx_product_lists_list_id ON product_lists(list_id);
CREATE INDEX idx_product_lists_product_id ON product_lists(product_id);
```

#### list_groups (junction table)
```sql
CREATE TABLE list_groups (
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (list_id, group_id)
);

CREATE INDEX idx_list_groups_group_id ON list_groups(group_id);
CREATE INDEX idx_list_groups_list_id ON list_groups(list_id);
```

#### scraping_jobs
```sql
CREATE TABLE scraping_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  platform TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX idx_scraping_jobs_user_id ON scraping_jobs(user_id);
CREATE INDEX idx_scraping_jobs_created_at ON scraping_jobs(created_at DESC);
```

#### price_history
```sql
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stock_status TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at DESC);
```

### 3.3 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Lists: Users can only access their own lists
CREATE POLICY "Users can view their own lists" ON lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lists" ON lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" ON lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" ON lists
  FOR DELETE USING (auth.uid() = user_id);

-- Groups: Similar policies for groups
CREATE POLICY "Users can view their own groups" ON groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups" ON groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups" ON groups
  FOR DELETE USING (auth.uid() = user_id);

-- Products: Public read, authenticated write
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Scraping jobs: Users can only access their own jobs
CREATE POLICY "Users can view their own scraping jobs" ON scraping_jobs
  FOR SELECT USING (auth.uid() = user_id);
```

## 4. API Design

### 4.1 RESTful Endpoints

#### Product Endpoints
```
POST   /api/products/scrape          - Scrape a new product from URL
GET    /api/products                 - List all products (with pagination)
GET    /api/products/:id             - Get single product details
PUT    /api/products/:id             - Update product information
DELETE /api/products/:id             - Delete a product
GET    /api/products/:id/history     - Get price history for a product
```

#### List Endpoints
```
POST   /api/lists                    - Create a new list
GET    /api/lists                    - Get all lists for current user
GET    /api/lists/:id                - Get single list with products
PUT    /api/lists/:id                - Update list details
DELETE /api/lists/:id                - Delete a list
POST   /api/lists/:id/products       - Add products to a list
DELETE /api/lists/:id/products/:pid  - Remove product from list
```

#### Group Endpoints
```
POST   /api/groups                   - Create a new group
GET    /api/groups                   - Get all groups for current user
GET    /api/groups/:id               - Get single group with lists
PUT    /api/groups/:id               - Update group details
DELETE /api/groups/:id               - Delete a group
POST   /api/groups/:id/lists         - Add lists to a group
DELETE /api/groups/:id/lists/:lid    - Remove list from group
```

#### Scraping Job Endpoints
```
GET    /api/jobs                     - Get all scraping jobs
GET    /api/jobs/:id                 - Get job status and details
POST   /api/jobs/bulk                - Create bulk scraping jobs
DELETE /api/jobs/:id                 - Cancel a pending job
```

#### Webhook Endpoints (for N8N)
```
POST   /api/webhooks/scrape          - Trigger scrape via webhook
POST   /api/webhooks/export          - Export data in specific format
GET    /api/webhooks/health          - Health check endpoint
```

### 4.2 Request/Response Examples

#### POST /api/products/scrape
Request:
```json
{
  "url": "https://www.amazon.com/dp/B08N5WRWNW",
  "listId": "uuid-optional",
  "priority": "normal"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "pending",
    "estimatedTime": 10
  }
}
```

#### GET /api/products/:id
Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://www.amazon.com/dp/B08N5WRWNW",
    "platform": "amazon",
    "name": "Product Name",
    "priceNow": 299.99,
    "priceOriginal": 399.99,
    "currency": "USD",
    "sku": "B08N5WRWNW",
    "brand": "Brand Name",
    "description": "Full product description...",
    "specifications": {
      "weight": "2 pounds",
      "dimensions": "10 x 8 x 4 inches"
    },
    "features": ["Feature 1", "Feature 2"],
    "ratingAverage": 4.5,
    "ratingCount": 1234,
    "primaryImageUrl": "https://...",
    "images": ["url1", "url2"],
    "stockStatus": "in_stock",
    "variants": [
      {"type": "color", "value": "Black", "available": true},
      {"type": "size", "value": "Medium", "available": true}
    ],
    "categories": ["Electronics", "Computers"],
    "createdAt": "2025-01-15T10:30:00Z",
    "lastScrapedAt": "2025-01-15T10:30:00Z"
  }
}
```

## 5. Scraping Engine Design

### 5.1 Platform Detection Strategy

```typescript
interface PlatformDetector {
  detect(url: string): Platform | null;
}

enum Platform {
  AMAZON = 'amazon',
  SHOPIFY = 'shopify',
  WOOCOMMERCE = 'woocommerce',
  UNKNOWN = 'unknown'
}

// Detection logic
function detectPlatform(url: string): Platform {
  const hostname = new URL(url).hostname;

  if (hostname.includes('amazon.')) return Platform.AMAZON;
  // Shopify detection via meta tags or known domains
  if (hostname.includes('myshopify.com')) return Platform.SHOPIFY;
  // WooCommerce detection requires page inspection

  return Platform.UNKNOWN;
}
```

### 5.2 Scraper Interface

```typescript
interface ProductScraper {
  scrape(url: string): Promise<ScrapedProduct>;
  canHandle(platform: Platform): boolean;
}

interface ScrapedProduct {
  name: string;
  priceNow: number | null;
  priceOriginal: number | null;
  currency: string;
  sku?: string;
  brand?: string;
  description?: string;
  specifications?: Record<string, any>;
  features?: string[];
  ratingAverage?: number;
  ratingCount?: number;
  primaryImageUrl?: string;
  images?: string[];
  videos?: string[];
  stockStatus: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown';
  shippingInfo?: Record<string, any>;
  variants?: ProductVariant[];
  categories?: string[];
  metadata?: Record<string, any>;
}
```

### 5.3 Scraper Implementations

#### Amazon Scraper
```typescript
class AmazonScraper implements ProductScraper {
  async scrape(url: string): Promise<ScrapedProduct> {
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle' });

      // Extract data using selectors
      const name = await page.locator('#productTitle').textContent();
      const price = await page.locator('.a-price-whole').first().textContent();
      // ... more extraction logic

      return { /* scraped data */ };
    } finally {
      await browser.close();
    }
  }

  canHandle(platform: Platform): boolean {
    return platform === Platform.AMAZON;
  }
}
```

#### Shopify Scraper
```typescript
class ShopifyScraper implements ProductScraper {
  async scrape(url: string): Promise<ScrapedProduct> {
    // Shopify has JSON endpoint: /products/{handle}.json
    const productHandle = this.extractHandle(url);
    const jsonUrl = `${baseUrl}/products/${productHandle}.json`;

    const response = await fetch(jsonUrl);
    const data = await response.json();

    return this.transformShopifyData(data);
  }

  canHandle(platform: Platform): boolean {
    return platform === Platform.SHOPIFY;
  }
}
```

### 5.4 Retry Logic

```typescript
class RetryManager {
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          await this.delay(delayMs * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 5.5 Rate Limiting

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private running: number = 0;
  private maxConcurrent: number = 5;
  private minDelay: number = 2000; // 2 seconds between requests

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const fn = this.queue.shift()!;

    await fn();
    await new Promise(resolve => setTimeout(resolve, this.minDelay));

    this.running--;
    this.processQueue();
  }
}
```

## 6. N8N Integration

### 6.1 Integration Points

#### Direct Database Access
N8N can connect directly to Supabase PostgreSQL using the Postgres node:
- **Connection**: Use Supabase connection string
- **Queries**: Run SQL queries to fetch product data
- **Use Case**: Bulk data export, scheduled reports, price analysis

#### Webhook Triggers
App provides webhooks for N8N workflows:
```
POST /api/webhooks/scrape
Body: { "url": "...", "listId": "...", "callbackUrl": "..." }

Response: { "jobId": "...", "status": "pending" }
```

N8N workflow can poll job status or receive callback when complete.

#### Supabase Realtime
N8N can subscribe to database changes:
- New products added
- Price changes detected
- Stock status updates

### 6.2 Data Format for N8N

```json
{
  "event": "product.created",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "id": "uuid",
    "url": "https://...",
    "name": "Product Name",
    "price": 299.99,
    "priceChange": -100.00,
    "stockStatus": "in_stock",
    "metadata": {
      "platform": "amazon",
      "category": "Electronics"
    }
  }
}
```

### 6.3 Example N8N Workflows

1. **Price Monitoring**: Query products, compare with history, send alerts
2. **Daily Report**: Export all products to Google Sheets
3. **Stock Alerts**: Trigger when out-of-stock items come back
4. **Bulk Scrape**: Upload CSV of URLs, trigger scraping for each

## 7. Security Design

### 7.1 Authentication Flow
```
User → Sign in with Supabase Auth (Email/OAuth)
      → Receive JWT token
      → Include token in Authorization header
      → API validates token with Supabase
      → Access granted based on RLS policies
```

### 7.2 API Security
- **Rate Limiting**: 100 requests per minute per user
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection**: Prevented by Supabase parameterized queries
- **XSS Prevention**: Sanitize user input, use React (auto-escapes)
- **CORS**: Configure allowed origins

### 7.3 Scraping Security
- **URL Validation**: Whitelist allowed domains
- **Respect robots.txt**: Check before scraping
- **User-Agent**: Identify as legitimate scraper
- **Rate Limiting**: Platform-specific limits
- **Timeout**: Maximum 30 seconds per scrape

## 8. Error Handling

### 8.1 Error Categories

1. **Scraping Errors**:
   - Page not found (404)
   - Platform changes (selectors outdated)
   - Rate limited by website
   - Timeout
   - Anti-bot detection

2. **Database Errors**:
   - Connection failures
   - Constraint violations
   - RLS policy denials

3. **Validation Errors**:
   - Invalid URL format
   - Missing required fields
   - Type mismatches

### 8.2 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "SCRAPE_FAILED",
    "message": "Failed to scrape product: Page not found",
    "details": {
      "url": "https://...",
      "statusCode": 404
    },
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

### 8.3 Logging Strategy

```typescript
logger.info('Scraping started', { url, platform, userId });
logger.error('Scraping failed', { error, url, retryCount });
logger.warn('Rate limit approaching', { platform, requestCount });
```

## 9. Performance Optimization

### 9.1 Caching Strategy
- **Product Data**: Cache for 1 hour (configurable)
- **List/Group Data**: Cache for 5 minutes
- **Static Assets**: CDN caching with Next.js

### 9.2 Database Optimization
- **Indexes**: On frequently queried columns (url, user_id, status)
- **Pagination**: Cursor-based pagination for large datasets
- **JSON Fields**: Index JSONB fields where needed

### 9.3 Scraping Optimization
- **Reuse Browser Instances**: Pool of browser contexts
- **Parallel Scraping**: Process multiple URLs concurrently
- **Incremental Updates**: Only re-scrape changed fields

## 10. Monitoring and Observability

### 10.1 Metrics to Track
- Scraping success rate by platform
- Average scraping time
- API response times
- Database query performance
- Error rates by type
- Active users count

### 10.2 Logging
- Structured JSON logs
- Log levels: DEBUG, INFO, WARN, ERROR
- Include request IDs for tracing

### 10.3 Alerts
- Scraping success rate below 90%
- API errors exceed threshold
- Database connection failures
- Disk space warnings

## 11. Deployment Architecture

### 11.1 Recommended Deployment

```
┌──────────────────┐
│  Vercel Edge     │  ← Next.js Frontend & API Routes
│  Network         │     (Auto-scaling, CDN)
└────────┬─────────┘
         │
         ├─────────────────────┐
         │                     │
┌────────┴─────────┐  ┌────────┴─────────┐
│  Supabase Cloud  │  │  Background Jobs │
│  (Database +     │  │  (Railway/Render)│
│   Auth + Storage)│  │  - BullMQ        │
└──────────────────┘  │  - Scraping Queue│
                      └──────────────────┘
```

### 11.2 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Scraping
SCRAPING_MAX_CONCURRENT=10
SCRAPING_TIMEOUT_MS=30000
SCRAPING_RETRY_COUNT=3

# Optional
REDIS_URL=redis://...  # For job queue
SENTRY_DSN=https://...  # Error tracking
```

## 12. Future Enhancements

### 12.1 Technical Improvements
- **GraphQL API**: For more flexible querying
- **WebSocket Support**: Real-time scraping status
- **Machine Learning**: Auto-categorization of products
- **Image Processing**: OCR for product specs in images
- **Multi-tenancy**: Team/organization support

### 12.2 Scalability Improvements
- **Distributed Scraping**: Multiple worker instances
- **Message Queue**: RabbitMQ or SQS for job distribution
- **Caching Layer**: Redis for high-traffic scenarios
- **Read Replicas**: Database read replicas for analytics
