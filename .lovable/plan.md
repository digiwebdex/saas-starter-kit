
# P2 Fix Plan

## 1. Forgot Password Flow
- Add `POST /api/auth/forgot-password` — generates a reset token, stores it in DB
- Add `POST /api/auth/reset-password` — validates token, updates password
- Add `resetToken` and `resetTokenExpiry` fields to User model in schema.prisma
- Add frontend `/forgot-password` and `/reset-password` pages
- **Email**: Since no SMTP is configured, the reset token/link will be returned in response for now (log to console on server). Add `SMTP_*` env vars as optional — when configured, sends real email.

## 2. Auto-Create Transaction on Invoice Payment
- In `invoices.js` POST `/:id/payments` handler, after recording payment, auto-create a Transaction record linked to the invoice/booking
- No schema change needed — Transaction model already has `invoiceId`, `bookingId`, `referenceId`, `referenceType` fields

## 3. Accounts Profitability Endpoint
- Check `backend/src/routes/accounts.js` for existing endpoints
- Add/verify `GET /api/accounts/profitability` — aggregates booking profit, expenses, net profit by period

## 4. Expanded Audit Log Coverage
- **Login**: Add audit log in `POST /api/auth/login`
- **Invoice create**: Add audit log in `POST /api/invoices`
- **Invoice payment**: Add audit log in `POST /api/invoices/:id/payments`
- **Lead conversion**: Add audit log in `POST /api/leads/:id/convert`
- **Team member add/remove**: Already added in P1 tenants.js ✓
- **Subscription approval**: Add audit log in admin `PATCH /api/admin/payment-requests/:id`

## Files to change:
- `backend/prisma/schema.prisma` — add resetToken/resetTokenExpiry to User
- `backend/src/routes/auth.js` — forgot-password + reset-password + login audit
- `backend/src/routes/invoices.js` — auto-create transaction + audit logs
- `backend/src/routes/leads.js` — lead conversion audit log
- `backend/src/routes/accounts.js` — profitability endpoint
- `backend/src/routes/admin.js` — subscription approval audit log
- `src/pages/ForgotPassword.tsx` — NEW frontend page
- `src/pages/ResetPassword.tsx` — NEW frontend page
- `src/App.tsx` — add routes
- `src/lib/api.ts` — add forgotPassword/resetPassword API calls

## No breaking changes to existing flows.
