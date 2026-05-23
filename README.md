# Gibens — Service Marketplace Platform

A complete 3-app service marketplace built with React + Supabase.

| App | URL | Brand |
|-----|-----|-------|
| Customer | gibens.com | Orange `#E8520A` |
| Vendor | pro.gibens.com | Navy `#0F4C8A` |
| Admin | admin.gibens.com | Purple `#534AB7` |

---

## Quick start

### 1. Supabase setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Enable PostGIS: **Database → Extensions → postgis**
3. Run the migration:
   ```
   supabase db push   # or paste supabase/migrations/001_initial_schema.sql in the SQL editor
   ```
4. Create storage buckets:
   - `job-photos` (public)
   - `avatars` (public)
   - `vendor-docs` (private)
5. Deploy edge functions:
   ```
   supabase functions deploy charge-fee
   supabase functions deploy fee-preview
   supabase functions deploy notify-vendors
   ```
6. Set edge function secrets:
   ```
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   ```

### 2. Environment variables

Copy `.env.example` to `.env` in each app and fill in:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GOOGLE_MAPS_KEY=your_maps_key
```

### 3. Install & run

```bash
npm install
npm run dev:customer   # localhost:5173
npm run dev:pro        # localhost:5174
npm run dev:admin      # localhost:5175
```

### 4. Create an admin user

After registering, run this in the Supabase SQL editor:
```sql
UPDATE users SET role = 'admin' WHERE id = 'YOUR_USER_ID';
```

---

## Architecture

```
gibens/
├── apps/
│   ├── customer/        → gibens.com
│   ├── pro/             → pro.gibens.com
│   └── admin/           → admin.gibens.com
├── packages/
│   ├── supabase/        → shared DB client, types, query helpers
│   └── ui/              → shared utilities (categories, formatters, colors)
└── supabase/
    ├── migrations/      → schema SQL (run once)
    └── functions/       → edge functions (charge-fee, fee-preview, notify-vendors)
```

## Lead booking fee logic

| Bid amount | Fee charged to vendor |
|------------|----------------------|
| Under $100 | $5 |
| $100–$199 | $10 |
| $200+ | $20 |

Fee is charged **only when the customer accepts a bid**, via the `charge-fee` edge function which calls Stripe. Customers pay nothing extra.

## Key Supabase features used

- **Row Level Security** — vendors only see jobs in their category + within their travel radius
- **PostGIS** — `ST_DWithin` for geo-filtering vendors and jobs
- **Realtime** — live chat and notifications via Supabase channels
- **Storage** — job photos and vendor verification docs
- **Edge Functions** — Stripe fee charging, vendor matching

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy each app
cd apps/customer && vercel --prod
cd apps/pro && vercel --prod
cd apps/admin && vercel --prod
```

Set environment variables in each Vercel project dashboard.

---

## Monthly costs (early stage)

| Service | Cost |
|---------|------|
| Supabase Pro | $25/mo |
| Vercel Pro | $20/mo |
| Resend | $20/mo |
| Google Maps | ~$10/mo |
| **Total** | **~$75/mo** |

Break-even: ~8–10 accepted bids/month.
