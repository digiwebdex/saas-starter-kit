---
name: P0+P1 Production Fixes
description: Sitemap domain, Invoice schema, payment-request isolation, cron expiry, RBAC middleware, plan limits
type: feature
---

## P0 Fixes Applied
1. **Sitemap/robots.txt**: Changed from globexconnect.com → travelagencyweb.com
2. **Invoice schema**: Added `clientName` and `bookingTitle` optional fields to Invoice model
3. **Payment-request isolation**: Replaced generic CRUD with dedicated `paymentRequests.js` route — strict tenant scoping, role check (tenant_owner only), audit logging
4. **Subscription expiry cron**: New `backend/src/routes/cron.js` — POST `/api/cron/process-expiry` protected by `CRON_SECRET` header, auto-expires trials/subscriptions past expiry date

## P1 Fixes Applied
5. **Backend RBAC middleware**: `requireRole(...roles)`, `requirePermission(module, action)` in auth.js — mirrors frontend permission matrix. Applied to all route files: clients, bookings, invoices, leads, quotations, tenants
6. **Plan limit enforcement**: `checkPlanLimit(resource)` middleware checks tenant plan limits before POST on clients, bookings, leads, quotations, team members. Limits mirror `src/lib/plans.ts`

## VPS Deploy Steps Required
- `cd backend && npx prisma db push` (adds clientName/bookingTitle to Invoice)
- Add `CRON_SECRET=<32-char-random>` to backend `.env`
- `pm2 restart skyline-api`
- Set up cron: `*/30 * * * * curl -s -X POST -H "x-cron-secret: <SECRET>" https://api.travelagencyweb.com/api/cron/process-expiry`
