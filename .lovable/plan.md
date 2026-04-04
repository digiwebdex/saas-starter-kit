
# 🔍 Full Project Audit — Skyline Travel Agency SaaS

---

## ✅ What Works (Backend is Real, Frontend is Mixed)

### Backend (Node.js + Express + Prisma) — **Solid Foundation**
- Auth: JWT login/register/me with tenant isolation ✅
- Tenant CRUD with members management ✅
- Bookings: full CRUD + segments, travelers, checklist, timeline, documents ✅
- Invoices: CRUD + payments (auto-updates paid/due amounts), refunds, audit trail ✅
- Quotations, Leads, Clients, Vendors, Expenses, Accounts — all have backend routes ✅
- Hajj/Umrah module with packages/groups/pilgrims ✅
- Admin: tenant list, stats, payment request approve/reject ✅
- Dashboard stats endpoint with real computed KPIs ✅
- Multi-origin CORS support ✅
- File upload support (multer) ✅

### Frontend — **Good UI, Real API Integration**
- Dashboard fetches real data from `/api/dashboard/stats` with smart fallback ✅
- Booking, Invoice, Client, Lead, Vendor pages use real API calls ✅
- Accounts page with 8 tabs (receivables, payables, expenses, ledger, profitability) ✅
- Reports page with 6 tabs (sales, leads, payments, vendors, staff, profitability) ✅
- Permission system (RBAC with 6 roles, module-level actions) ✅
- Plan/feature gating (FeatureGate, SubscriptionGate, plan-locked sidebar items) ✅
- Website customizer with 3 templates, color/content/section editing ✅
- Marketing pages (landing, features, pricing, demo, contact, FAQ, privacy, terms) ✅
- Onboarding flow (4-step wizard) ✅

---

## 🔴 What is Broken

### 1. **Super Admin Dashboard — 100% Mock Data**
- `AdminDashboard.tsx` — ALL data is hardcoded (revenue charts, tenant counts, pie charts, activity feed). Backend `/api/admin/stats` endpoint exists but is NOT called.
- **Impact**: Super admin sees fake numbers, not real platform metrics.

### 2. **Admin Tenants — Mock Data, Not Connected**
- `AdminTenants.tsx` uses `mockTenants` array instead of calling `/api/admin/tenants`.
- Suspend/reactivate only toggles local state.
- **Impact**: Can't see or manage real tenants.

### 3. **Admin Payments — Mock Data, Not Connected**
- `AdminPayments.tsx` uses `mockRequests` array. Approve/reject only updates local state, doesn't call `/api/admin/payment-requests/:id`.
- **Impact**: Real payment requests from tenants are invisible to super admin.

### 4. **Admin Domains — Fully Mock**
- `AdminDomains.tsx` — mock tenants, mock domains, DNS verification uses client-side simulation.
- No backend routes for domain management at all.
- **Impact**: Domain management is UI-only, no persistence.

### 5. **Admin Subscriptions — Mock Data**
- `AdminSubscriptions.tsx` uses `mockSubscriptions` — not connected to backend.

### 6. **Admin Plans — Mock Data**
- `AdminPlans.tsx` manages plans in local state only.

### 7. **Admin Roles — Mock Data**
- `AdminRoles.tsx` — permission editing is UI-only, no persistence.

### 8. **Team Page — Not Connected**
- `Team.tsx` shows "Connect your backend to see team members". Backend route `/api/tenants/me/members` exists and works, but Team page doesn't call it.

### 9. **Subscription Page — Local State Only**
- `Subscriptions.tsx` — plan selection, payment requests, approval ALL use local state (`useState`). Not connected to `/api/payment-requests` or `/api/subscriptions`.
- **Impact**: Tenants can't actually subscribe or upgrade.

### 10. **Role Management — Mock Members**
- `RoleManagement.tsx` uses `mockMembers` instead of calling tenant members API.

### 11. **Website Customizer — No Backend Route**
- `websiteApi` saves/loads config but there's no `/api/website` route in `backend/src/index.js`.
- Config likely goes nowhere or uses localStorage.

### 12. **Tenant Patch — No Authorization Check**
- `PATCH /api/tenants/me` accepts any `req.body` — a tenant user could set `subscriptionPlan: "enterprise"` or `subscriptionStatus: "active"`.
- **SECURITY RISK**: No field whitelist on tenant update.

### 13. **Booking Create — Accepts Raw Body**
- `POST /api/bookings` does `prisma.booking.create({ data: { ...req.body, tenantId } })` — allows injecting any field.
- Same pattern in invoices, leads, etc.

---

## 🟡 What is Missing

### Backend Missing
1. **No `/api/website` routes** — website config has no persistence backend
2. **No subscription management API** — tenants can't create/view their own subscriptions
3. **No role/permission persistence** — RBAC is frontend-only, not enforced server-side
4. **No admin domain CRUD endpoints**
5. **No admin plan management endpoints**
6. **No admin audit log endpoints** (client-side `logAudit` writes to localStorage only)
7. **No email/SMS integration** — email/SMS APIs are client-side stubs
8. **No password change/reset flow**
9. **No field validation/sanitization** on most endpoints
10. **No pagination** on list endpoints — will break with scale
11. **No rate limiting** on auth endpoints

### Frontend Missing
1. **No real trial flow** — no trial period logic, no trial expiry enforcement
2. **No notification system backend** — notifications are client-side only
3. **No payment gateway integration** (bKash, SSLCommerz) — UI exists but no actual integration
4. **No data export backend** — CSV export is client-side only (fine for now)
5. **No multi-currency support** — hardcoded ৳ (BDT)
6. **No dark mode toggle** (has dark classes but no toggle)
7. **SitePricing not wrapped in WebsiteProvider** (line 105 in App.tsx)

---

## 🎯 Priority Roadmap

### Phase 1: Critical Fixes (Must-Have for Launch) 🔥
| # | Task | Effort |
|---|------|--------|
| 1 | **Connect Admin Dashboard to real API** — call `/api/admin/stats`, remove mock data | 2h |
| 2 | **Connect Admin Tenants to real API** — fetch from `/api/admin/tenants` | 2h |
| 3 | **Connect Admin Payments to real API** — fetch/approve/reject via `/api/admin/payment-requests` | 3h |
| 4 | **Connect Subscription page to real API** — create payment requests via API, fetch history | 3h |
| 5 | **Connect Team page to real API** — fetch/add/remove members via `/api/tenants/me/members` | 1h |
| 6 | **Fix tenant PATCH security** — whitelist allowed fields (name, logo, etc.) | 1h |
| 7 | **Add input validation** on all backend create/update routes | 3h |
| 8 | **Connect Role Management to real member data** | 2h |

### Phase 2: Important Features 🔧
| # | Task | Effort |
|---|------|--------|
| 9 | **Create `/api/website` routes** — save/load website config per tenant | 2h |
| 10 | **Add trial flow** — 14-day trial on registration, trial expiry enforcement | 3h |
| 11 | **Add password change API** + frontend UI | 2h |
| 12 | **Add pagination** to all list endpoints | 3h |
| 13 | **Server-side permission enforcement** — middleware checking role before CRUD ops | 4h |
| 14 | **Admin domain management backend** — CRUD endpoints for domains table | 3h |
| 15 | **Connect Admin Subscriptions/Plans** to backend | 3h |

### Phase 3: Growth & Polish 🚀
| # | Task | Effort |
|---|------|--------|
| 16 | **bKash/SSLCommerz payment integration** | 8h |
| 17 | **Email integration** (SendGrid/Mailgun for invoice emails, notifications) | 4h |
| 18 | **SMS integration** (Twilio/local provider) | 4h |
| 19 | **Audit log backend** — persist audit events to DB | 3h |
| 20 | **Real notification system** — backend-driven notifications | 4h |
| 21 | **Add rate limiting** on auth endpoints | 1h |
| 22 | **Dark mode toggle** | 1h |

---

## ❓ Questions for You

1. **Which phase do you want to start with?** Phase 1 (connect everything to real APIs) or pick specific items?

2. **Trial flow**: Should new tenants get a free trial period (e.g., 14 days Pro plan)? Or start on Free plan immediately?

3. **Admin panel priority**: Do you want the admin dashboard showing real data first, or subscription flow working first?

4. **Payment gateways**: Are you planning bKash/SSLCommerz integration soon, or is manual payment (bank transfer + admin approval) enough for now?

5. **Email/SMS**: Do you have an email service provider preference (SendGrid, Mailgun, local SMTP)? Any SMS provider for Bangladesh?

6. **Tenant website (`/site/*`)**: Should the website customizer config be stored in the DB per tenant? Is custom domain per tenant a priority?

7. **Audit log**: Is localStorage-based audit logging acceptable for now, or do you need server-side audit persistence immediately?
