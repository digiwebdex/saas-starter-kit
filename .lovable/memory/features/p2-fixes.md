---
name: P2 Production Fixes
description: Forgot password, auto-create transactions, profitability endpoint, expanded audit logs
type: feature
---

## P2 Fixes Applied

### 1. Forgot Password Flow
- `POST /api/auth/forgot-password` — generates reset token (1hr expiry), sends email via SMTP if configured, logs to console otherwise
- `POST /api/auth/reset-password` — validates token, updates password, clears token
- Schema: Added `resetToken` and `resetTokenExpiry` to User model
- Frontend: `/forgot-password` and `/reset-password` pages, "Forgot password?" link on login
- Audit logged: password_reset

### 2. Auto-Create Transaction on Invoice Payment
- `POST /invoices/:id/payments` now auto-creates a Transaction record (type=income, category=invoice_payment)
- Links transaction to invoice, booking, payment method
- No schema change needed

### 3. Accounts Profitability Endpoint
- Enhanced `GET /accounts/profitability` — accepts `?from=&to=` date filters
- Returns per-booking profitability with expenses allocated + summary totals
- Includes netProfit, overallMargin, bookingCount

### 4. Expanded Audit Log Coverage
- Login: auth.js POST /login
- Logout: auth.js POST /logout (frontend calls on logout)
- Invoice create: invoices.js POST /
- Invoice payment: invoices.js POST /:id/payments
- Lead conversion: leads.js POST /:id/convert
- Team add/remove: already in P1 tenants.js ✓
- Subscription approval/rejection: admin.js PATCH /payment-requests/:id

## Env Vars (Optional)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — for real email sending
- `FRONTEND_URL` — for reset link URL (defaults to https://travelagencyweb.com)
- Without SMTP, reset tokens are logged to server console
