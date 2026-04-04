
# P0 + P1 Fix Plan

## P0 — Critical

### 1. Sitemap domain fix
- **Root cause**: sitemap.xml uses `globexconnect.com` instead of `travelagencyweb.com`
- **Fix**: Update all URLs in `public/sitemap.xml`

### 2. Invoice schema mismatch
- **Root cause**: Frontend sends `clientName`/`bookingTitle` but Prisma `Invoice` model lacks these fields
- **Fix**: Add `clientName` and `bookingTitle` as optional String fields to Invoice model in schema.prisma

### 3. Payment-request tenant isolation
- **Root cause**: `payment-requests` uses generic CRUD (`crud.js`) which correctly filters by `tenantId` on reads, but the issue is that the admin route for payment-requests doesn't scope properly, and the generic CRUD doesn't validate ownership on updates
- **Fix**: Create a dedicated `paymentRequests.js` route with strict tenant filtering, replacing the generic CRUD

### 4. Subscription/trial expiry cron
- **Root cause**: No mechanism to auto-expire trials/subscriptions after their expiry date
- **Fix**: Add a `/api/cron/process-expiry` endpoint protected by a secret key, plus provide cron setup instructions

## P1 — Important

### 5. Backend role middleware
- **Root cause**: Only `requireSuperAdmin` exists; no middleware checks tenant-level roles
- **Fix**: Add `requireRole(...roles)` and `requirePermission(module, action)` middleware functions in `auth.js`, apply to sensitive routes

### 6. Backend plan-limit enforcement
- **Root cause**: Plan limits (max clients, bookings, team members, domains) only checked on frontend
- **Fix**: Add `checkPlanLimit(tenantId, resource)` middleware, apply to POST routes for clients, bookings, team members, domains

## Files to change:
- `public/sitemap.xml` — domain fix
- `backend/prisma/schema.prisma` — add Invoice fields
- `backend/src/routes/paymentRequests.js` — NEW dedicated route
- `backend/src/index.js` — swap generic CRUD for dedicated route, add cron route
- `backend/src/middleware/auth.js` — add role/permission/plan-limit middleware
- `backend/src/routes/cron.js` — NEW expiry processing
- `backend/src/routes/clients.js` — add plan limit check
- `backend/src/routes/bookings.js` — add plan limit check
- `backend/src/routes/tenants.js` — add plan limit check on member creation

## Schema changes:
- `prisma db push` needed after adding `clientName`/`bookingTitle` to Invoice

## No breaking changes — all existing API contracts preserved.
