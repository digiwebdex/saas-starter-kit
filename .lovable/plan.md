
## Public Marketing Website Upgrade

### Current State
- **`/` (Index.tsx)** — 563-line monolithic landing page with dark theme (#0a1628), hero, 8 feature cards, plan cards, comparison table, contact section, footer, and registration dialog. Good foundation but needs more depth.
- **`/site/*`** — Tenant-facing public website (separate concern, not touched).
- **`/site/pricing`** — Tenant-facing pricing page (separate from SaaS pricing).
- No dedicated Features, Demo, FAQ, Privacy, or Terms pages exist.
- Footer links to Privacy/About are dead (`href="#"`).

### Plan

#### 1. Create shared `MarketingLayout` component
- Reusable navbar + footer for all marketing pages
- Dark theme consistent with current Index.tsx (#0a1628 background, cyan-400 accents)
- Nav links: Home, Features, Pricing, Contact, Demo, Login
- Footer: Product links, Company (About, Contact, Privacy, Terms), Support (FAQ, Demo)
- Mobile hamburger menu

#### 2. Upgrade Homepage (`/` — Index.tsx)
- Keep existing hero, improve copy
- Add **workflow section** showing inquiry → quotation → booking → invoice → trip flow
- Add **testimonials** section with realistic travel agency quotes
- Add **FAQ preview** (3-4 questions)
- Add **pricing preview** (keep existing cards)
- Link hero CTA to `/pricing` and `/demo`
- Replace hardcoded contact info with proper links
- Wrap in `MarketingLayout`

#### 3. Create `/features` page
- Grouped feature sections:
  - Leads & CRM
  - Quotations & Itineraries
  - Bookings & Operations
  - Invoices & Payments
  - Vendor Management
  - Team & Role Management
  - Reports & Analytics
  - Hajj/Umrah Module
- Each group: icon, title, description, 3-5 bullet capabilities
- CTA at bottom

#### 4. Create `/pricing` page (SaaS-level)
- Pull from PLANS config
- Monthly/yearly toggle
- Plan cards with proper feature lists
- Feature comparison table
- Locked features callout (Accounts on Pro+, Reports on Business+)
- Enterprise CTA
- Registration dialog (reuse from Index.tsx)

#### 5. Create `/demo` page (Book a Call / Request Demo)
- Form: name, email, phone, company, team size, message
- Sidebar with benefits/what to expect
- Calendar placeholder (Calendly-style text)

#### 6. Create `/contact` page (SaaS contact)
- Contact form + company info
- Support hours, email, phone

#### 7. Create `/faq` page
- Accordion-style FAQ
- Categories: General, Pricing, Features, Security, Support
- 15-20 realistic questions

#### 8. Create `/privacy` page
- Standard privacy policy with travel SaaS specifics

#### 9. Create `/terms` page
- Standard terms of service

#### 10. Update routes in App.tsx
- Add routes: `/features`, `/pricing`, `/demo`, `/contact-us`, `/faq`, `/privacy`, `/terms`

### Files Changed
- `src/components/MarketingLayout.tsx` — New shared layout
- `src/pages/Index.tsx` — Refactored to use MarketingLayout, add sections
- `src/pages/marketing/Features.tsx` — New
- `src/pages/marketing/Pricing.tsx` — New  
- `src/pages/marketing/Demo.tsx` — New
- `src/pages/marketing/ContactUs.tsx` — New
- `src/pages/marketing/FAQ.tsx` — New
- `src/pages/marketing/Privacy.tsx` — New
- `src/pages/marketing/Terms.tsx` — New
- `src/App.tsx` — New routes
- `index.html` — Update meta title/description

### Design Approach
- Reuse current dark theme: `#0a1628` bg, cyan-400 accent, gradient CTAs
- Consistent card style: `bg-white/5 border-white/10`
- Travel-specific language throughout
- Mobile-first responsive

### SEO
- Unique `<title>` per page via `useEffect`
- Semantic HTML (single H1, proper heading hierarchy)
- Descriptive meta descriptions
