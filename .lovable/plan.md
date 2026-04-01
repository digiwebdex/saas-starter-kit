
## Quotation & Itinerary Builder — Implementation Plan

### 1. Data Model (`src/lib/api.ts`)
Add types and API endpoints:
- `Quotation` — id, clientId, leadId, title, destination, travelDates, status (draft/sent/approved/rejected/expired), version, totals, notes, validUntil, createdBy
- `QuotationItem` — type (hotel/flight/visa/transport/tour/activity/insurance/service_fee/discount/tax), day, description, costPrice, markup, sellingPrice, quantity, nights, supplier, notes
- `ItineraryDay` — dayNumber, date, title, description, meals, accommodation, activities
- `QuotationVersion` — versionNumber, snapshot, changedBy, changedAt, changeNote
- API: `quotationApi` with list, get, create, update, delete, updateStatus, getVersions, duplicate, convertToBooking

### 2. New Pages (4 files)
- `/quotations` — List page with status tabs, filters, search, quick actions
- `/quotations/new` — Builder page (also handles edit via `/quotations/:id/edit`)
- `/quotations/:id` — Detail view with version history, status actions
- `/quotations/:id/print` — Clean printable/shareable layout (no sidebar)

### 3. Quotation Builder Features
- **Header**: Client/lead picker, destination, travel dates, validity date, title
- **Itinerary tab**: Day-by-day builder with drag reorder, add/remove days, descriptions, meals, accommodation notes
- **Pricing tab**: Line items grouped by day or category, cost/markup/selling price columns, auto-calculated profit, subtotal/tax/discount/grand total
- **Preview tab**: Live preview of the shareable layout
- **Notes tab**: Internal notes, terms & conditions

### 4. Line Item Types
hotel, flight, visa, transport, tour, activity, insurance, service_fee, discount, tax — each with icon, cost price, markup %, selling price, quantity

### 5. Status Workflow
Draft → Sent → Approved/Rejected/Expired
- Approved → "Convert to Booking" button
- Any status → "Revise" creates new version

### 6. Version History
- Each save creates a version snapshot
- Version list shows who changed what and when
- Can view/compare older versions

### 7. Print/Share View
- Standalone route without dashboard chrome
- Professional layout with agency branding placeholder
- Day-wise itinerary + pricing table
- Terms and conditions section
- CSS print styles

### 8. Route & Nav Changes
- `App.tsx`: Add 4 new routes
- `AppSidebar.tsx`: Add "Quotations" under CRM section
- `permissions.ts`: Add `quotations` module to permission matrix

### Files to create:
1. `src/pages/Quotations.tsx` — List page
2. `src/pages/QuotationBuilder.tsx` — Create/edit builder
3. `src/pages/QuotationDetails.tsx` — View + version history
4. `src/pages/QuotationPrint.tsx` — Printable layout

### Files to modify:
1. `src/lib/api.ts` — Types + quotationApi
2. `src/lib/permissions.ts` — Add quotations module
3. `src/components/AppSidebar.tsx` — Add nav item
4. `src/App.tsx` — Add routes
