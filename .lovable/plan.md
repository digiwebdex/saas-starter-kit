
# Production QA & Verification Plan

## Approach
Read all critical source files, trace each flow from UI → API → DB, identify gaps between frontend expectations and backend reality. No new features — only audit and fix.

## Flows to Verify

### 1. Registration & Trial Flow
- Register page → POST /auth/register → tenant created with trial → redirect → TrialBanner shows
- Check: trial expiry logic, SubscriptionGate blocking after expiry

### 2. Login / Logout / Forgot Password
- Login → JWT → /auth/me → role routing
- Logout → clear token
- Forgot password — does endpoint exist?

### 3. Role-Based Permissions
- UI: PermissionGate, usePermissions, AdminRoute
- API: authenticate middleware, requireSuperAdmin
- Gap check: are tenant-level roles enforced server-side?

### 4. Lead → Quotation → Booking → Invoice → Payment
- Each CRUD endpoint exists? Connected in frontend?
- Conversion flows (quotation→booking, booking→invoice)

### 5. Payment Request → Admin Approve → Subscription Update
- POST /subscriptions/payment-request → admin PATCH → tenant plan update
- Frontend: Subscriptions page, AdminPayments page

### 6. Dashboard & Reports
- /dashboard/stats — does it return real data?
- Reports pages — real API or demo data?

### 7. Accounts
- /accounts/summary, /accounts/ledger — real queries?

### 8. Audit Logs
- Which actions are logged? Which are missing?

### 9. Custom Domain Flow
- Full CRUD + verification + SSL + primary

### 10. Plan/Feature Gating
- FeatureGate, SubscriptionGate — connected to real plan data?

### 11. Marketing Website
- CTAs link to /register? Forms submit? Pricing matches plans.ts?

## Deliverable
Structured QA report with pass/fail, issues, root causes, fixes, and manual infra tasks.
