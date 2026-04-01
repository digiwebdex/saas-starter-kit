## Accounts Module — Implementation Plan

### Current State
- `accountApi` + `transactionApi` CRUD already in `api.ts`
- `Account` / `Transaction` types exist but are minimal
- Current `Accounts.tsx` uses **local state only** — no API calls
- Sidebar shows Accounts locked for free plan (`minPlan: "basic"`)
- RBAC already configured: owner/accountant = full, manager = limited, sales/ops = none

### Changes

#### 1. Extend API types (`src/lib/api.ts`)
- Add `Expense` interface (category, amount, date, method, reference, note, attachmentUrl, vendorId?)
- Add `expenseApi` CRUD
- Add `accountsApi.getSummary()` for aggregate stats
- Add `accountsApi.getLedger()` for unified transaction ledger with filters
- Expand `Transaction` type to include: clientId, clientName, bookingId, bookingTitle, vendorId, vendorName, invoiceId, status, paymentMethod

#### 2. Rewrite `src/pages/Accounts.tsx`
Complete rewrite into 7-tab operational finance page:

**Tab 1 — Overview**: 6 summary cards (total receivable, received, payable, overdue receivable, overdue payable, cash/bank balance) + quick charts

**Tab 2 — Receivables**: Linked from invoices — shows all unpaid/partial invoices with client, booking, amounts, due dates. Filterable.

**Tab 3 — Payments Received**: All payments from invoices with client, booking, method, date, reference. Searchable.

**Tab 4 — Vendor Payables**: All vendor bills with status, vendor, booking link, due dates. Links to vendor details.

**Tab 5 — Expenses**: Manual expense entry form (category, amount, date, method, reference, note, attachment). Table of expenses with filters.

**Tab 6 — Cash/Bank Accounts**: Manage cash and bank accounts. Show balances. Create/edit accounts dialog.

**Tab 7 — Ledger**: Unified searchable transaction log across all types. Filters: date range, client, booking, vendor, type, status, method. Export button.

#### 3. Sidebar fix (`src/components/AppSidebar.tsx`)
- Change `requiredFeature` to something more appropriate (or remove it since `minPlan` already gates)

#### 4. Locked state
- When plan is "free", show a proper locked screen via FeatureGate with travel-specific messaging and upgrade CTA

#### 5. Role gating
- Wrap create/edit/export actions in `<PermissionGate module="accounts" action="create|edit|export">`
- Already configured in RBAC matrix

### Files Changed
- `src/lib/api.ts` — extended types + new API methods
- `src/pages/Accounts.tsx` — complete rewrite (split into sub-components)
- `src/components/accounts/` — new folder for tab components
- `src/components/AppSidebar.tsx` — minor sidebar fix

### No schema migrations needed (frontend-only, API calls go to backend)
