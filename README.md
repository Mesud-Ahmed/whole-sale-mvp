# Wholesale Business Management MVP

A simple demand-validation web application for Ethiopian wholesale businesses.

## Implemented

- Supabase Auth login, signup, logout, and protected application routes
- Dashboard with today's sales, sales count, total customer debt, and low-stock products
- Product management with search, category filter, edit, deactivate, and stock adjustment
- Customer management with details, sales history, payment history, and calculated outstanding balance
- New sale workflow with stock validation, automatic totals, payment status, and inventory updates
- Sales history and sale detail pages
- Payments page showing customers with debt and recording payments
- PostgreSQL schema, RLS policies, indexes, views, and RPC functions for atomic stock/sales/payment operations

## Database Tables Created

- `products`
- `customers`
- `sales`
- `sale_items`
- `payments`
- `payment_allocations`
- `inventory_movements`

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional for maintenance scripts only:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## How To Run

1. Install dependencies:

```bash
pnpm install
```

2. Create a hosted Supabase project.
3. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor or with the Supabase CLI.
4. Copy `.env.example` to `.env.local` and fill in Supabase values.
5. Start the app:

```bash
pnpm dev
```

6. Open `http://localhost:3000`.

## Remaining Issues

- Email verification behavior depends on your Supabase Auth project settings.
- There is no role/permission management yet; each authenticated user is treated as one business owner.
- Advanced ERP features such as suppliers, purchasing, VAT, profit reporting, receipt printing, and integrations are intentionally excluded.

## Recommended Next Steps For Real Wholesaler Testing

- Enter 20-50 real products and validate whether product setup is fast enough.
- Record several same-day cash, partial, and credit sales with a wholesaler watching.
- Ask owners whether customer debt and low-stock views match how they already think about the business.
- Test the app on the phones used in the shop, especially the New Sale and Record Payment flows.
- After 1-2 weeks, review the missing features users ask for most often before expanding the product.
