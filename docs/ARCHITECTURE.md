# YouthCamping OS — Architecture Reference

Evidence-backed architecture map for the active monorepo. Last audited: 2026-08-18.

## Active applications

| App | Path | Stack | Local port | Production |
|-----|------|-------|------------|------------|
| Public website | `frontend/` | Next.js 16, React 19, Tailwind 4 | 3000 | Vercel (root `vercel-build` copies `frontend/.next` → root `.next`) |
| Admin ERP | `ycadmin/` | Vite 7, React 18, TypeScript, shadcn | 8080 | VPS static build (`deploy_vps.sh`) + separate Vercel config |
| API server | `backend/` | Node 20+, Express, Prisma, PostgreSQL | 3001 | VPS PM2 cluster (`ecosystem.config.js`, PORT 3001) |

Root `package.json` is an **orchestrator** (Jest, Playwright, `vercel-build`, Husky). It is not a fourth runtime app.

## Live vs legacy inventory

| Path | Status | Evidence |
|------|--------|----------|
| `backend/` | **LIVE** | `backend/package.json` → `main: src/server.js`; PM2 + `deploy_vps.sh` |
| `frontend/` | **LIVE** | Root `vercel-build`; `playwright.config.ts` baseURL 3000 |
| `ycadmin/` | **LIVE** | `.gitmodules` submodule; `deploy_vps.sh` builds `ycadmin/dist` |
| `tests/` | **LIVE (tooling)** | `jest.config.js`, `playwright.config.ts` |
| `scraper/` | **TOOL / legacy data** | Standalone scraper; MongoDB scripts, not in deploy path |
| `scripts/` | **TOOLING** | Ad-hoc maintenance scripts |
| `src/` (repo root) | **ORPHAN** | Only 2 files (`AdminLayout.tsx`, `BookingDetailsView.tsx`); not in any build; `tsconfig.json` includes only `tests/**/*` |
| `ADMIN-PANEL-old.archive/` | **ARCHIVE** | Name + duplicate of old ycadmin; not referenced in deploy/build |
| `youthcampingp.archive/` | **ARCHIVE** | Old Next.js frontend snapshot; not in `vercel-build` |
| `archive-travel-crm/` | **ARCHIVE** | Legacy CRM backend snapshot |
| `areas/` | **DOCS / notes** | Markdown notes, not runtime |
| `docs/` | **DOCS** | Architecture and rollout notes |

## Data flow

```
Browser (public)     → frontend (Next.js)     → REST https://api.youthcamping.online/api
Browser (admin)      → ycadmin (Vite SPA)     → REST (VITE_API_URL / localhost:3001)
backend (Express)    → Prisma Client          → PostgreSQL (DATABASE_URL)
backend (documents)  → Supabase Storage OR local uploads (SUPABASE_URL + keys)
backend (media)      → Cloudinary (optional)
backend (email)      → Brevo / Nodemailer (BREVO_API_KEY)
```

### Ownership rules (verified)

| Layer | DB / ORM | Business logic | Integrations |
|-------|----------|----------------|--------------|
| `frontend/` | **None** (no Prisma/Mongoose/Supabase client in app code) | Display + inquiry submit only; mock fallbacks in `lib/api.ts` for empty local data | Calls backend REST |
| `ycadmin/` | **None** | UI state + forms; all mutations via `src/services/*.service.ts` → axios | Calls backend REST |
| `backend/` | **Prisma → PostgreSQL** (production path) | Controllers + services under `backend/src/` | Storage, email, PDF, cron |

## Database and ORM audit

### Active production path

- **ORM**: Prisma 5 (`backend/prisma/schema.prisma`)
- **Database**: PostgreSQL via `DATABASE_URL` + `DIRECT_URL`
- **Startup**: `backend/src/server.js` connects via `prisma.$connect()`; requires `DATABASE_URL` and `JWT_SECRET`
- **~100 Prisma models** covering bookings, trips, ops, finance, train tickets, travel desk, CMS, RBAC, etc.

### Legacy / specialized access (classified)

| Usage | Location | Classification |
|-------|----------|----------------|
| Mongoose models (`backend/src/models/*.js`) | 17+ schema files | **LEGACY — not imported by active controllers** (grep: no `require('../models/')` in `backend/src`) |
| `backend/src/config/db.js` | MongoDB connect helper | **LEGACY — not called from `server.js`** |
| Mongoose in `backend/scripts/*` | Seed/migrate scripts | **LEGACY tooling** — requires `MONGODB_URI` |
| `scraper/` | MongoDB for scraped trips | **TOOL / legacy pipeline** |
| Supabase JS | `backend/src/utils/supabaseStorage.js` | **ACTIVE specialized** — document storage (not primary DB) |
| `backend/utils/database.js` | Re-exports `src/lib/prisma` | **ACTIVE wrapper** for legacy route files |

### Non-backend DB access

- **frontend**: No direct DB clients found.
- **ycadmin**: No direct DB clients found.

## API surface (backend)

Routes are mounted in `backend/src/app.js`. Primary handlers live in `backend/src/routes/` + `backend/src/controllers/`.

### Route registration (Phase 2 — 2026-08-18)

**Canonical `/api/ops`:** single mount of `backend/src/routes/opsRoutes.js`, which internally `router.use()`s `departureOperationsRoutes.js` **before** `authenticate` (hotel-bookings + departure dashboard stay unauthenticated).

**Public read routes migrated to `backend/src/routes/`:**

| Mount | Canonical file | Legacy file (deprecated, not mounted) |
|-------|----------------|----------------------------------------|
| `/api/destinations` | `destinationsRoutes.js` | `backend/routes/destinations.js` |
| `/api/stories` | `storiesRoutes.js` | `backend/routes/stories.js` |
| `/api/reviews` | `reviewsRoutes.js` | `backend/routes/reviews.js` |
| `/api/trips` (faqs/reviews) | `tripFaqsRoutes.js` | `backend/routes/faqs.js` |

**Health:** `GET /health` and `GET /api/health` registered once each at app startup (before rate limiting). Duplicate `/api/health` mount after rate limiting was removed.

**Still in `backend/routes/` (intentional):**

| File | Status |
|------|--------|
| `health.js` | **ACTIVE** — mounted at `/health` and `/api/health` |
| `trips.js`, `tripKnowledge.js`, `tripDocuments.js`, `tripSOPs.js`, `tripVendors.js` | **NOT MOUNTED** — superseded by `backend/src/routes/` equivalents |

### Overlapping API prefixes (documented, not merged in Phase 2)

| Issue | Notes |
|-------|-------|
| `/api/ops/payments` | Intentional alias mount of `paymentRoutes` for ops UI callers |
| `/api/trips-knowledge` vs `/api/knowledge` | Separate domains — **REQUIRES SEPARATE MIGRATION** |
| `/api/trips-sops` vs `/api/ops/sops` | Separate SOP systems — **REQUIRES SEPARATE MIGRATION** |

## Domain ownership map

| Domain | API prefix (primary) | Backend controller / route | Prisma models (sample) | ycadmin service | frontend |
|--------|----------------------|----------------------------|------------------------|-----------------|----------|
| Auth / session | `/api/admin/login`, `/api/users` | `authController`, `adminRoutes` | `Admin`, `User` | `auth.service.ts` | — |
| RBAC | `/api/admin/rbac` | `rbacController` | `Role`, `Permission`, `RolePermission` | `rbac.service.ts` | — |
| Trips / catalog | `/api/trips` | `tripController`, `tripRoutes` | `Trip`, `TripDetail`, `Departure` | `trips.service.ts` | `lib/api.ts` |
| Departures / engine | `/api/departures`, `/api/departure-engine` | `departureEngineRoutes` | `Departure`, `Ops*` models | `ops.service.ts` | — |
| Bookings | `/api/bookings` | `bookingController` | `Booking`, `Passenger*`, `BookingTask` | `bookings.service.ts` | inquiry flows |
| Booking links | `/api/booking-links` | `bookingLinkController` | `BookingLink` | `bookingLinks.service.ts` | — |
| Passengers / docs | `/api/bookings`, `/api/attachments` | `attachmentController` | `BookingDocument`, `BookingAttachment` | `attachments.service.ts` | — |
| Verification | `/api/booking-verifications` | `bookingVerificationController` | `BookingVerification` | `bookingVerification.service.ts` | — |
| Train tickets | `/api/train-tickets` | `trainTicketController` | `TrainTicket`, `TrainTicketGroup` | `trainTicket.service.ts` | — |
| Quotations | `/api/quotations` | `quotationRoutes` | `Quotation`, `PackageDraft` | `quotations.service.ts` | `db-smart.ts` (read) |
| Finance / payments | `/api/payments`, `/api/finance` | `paymentController`, `financeController` | `Payment`, `AccountingEntry` | `payments.service.ts`, `financeController.service.ts` | — |
| Accounting | `/api/accounting` | `accountingController` | `AccountingEntry`, `AccountingEntryLog` | `accounting.service.ts` | — |
| Station payments | `/api/station-payments` | `stationPaymentController` | `StationPaymentCollection` | `stationPayment.service.ts` | — |
| Vendors (directory) | `/api/vendors`, ERP routes | `vendorController`, `directoryVendorController` | `DirectoryVendor`, `Vendor` | `vendors.service.ts`, `tripVendorDirectory.service.ts` | — |
| Operations | `/api/ops` | `opsController`, `opsSopController` | `OpsTrip*`, `OpsSopLibrary` | `ops.service.ts`, `sops.service.ts` | — |
| Travel desk | `/api/travel-desk` | `travelDeskController` | `TravelDesk*` models | `travelDesk.service.ts` | — |
| Knowledge | `/api/knowledge`, `/api/trips-knowledge` | `knowledgeController`, `tripKnowledge` routes | `TripKnowledge`, `KnowledgeItem` | `knowledge.service.ts` | — |
| Hotels / rates | `/api/hotel-rates`, `/api/hotel-calculator` | `hotelRatesController`, `hotelCalculatorController` | `OpsVendorHotelRate`, etc. | UI in departure/hotels | — |
| CMS — blogs | `/api/blogs` | `blogController` | `Blog` | `blogs.service.ts` | `lib/api.ts` |
| CMS — reviews | `/api/reviews` | legacy + `reviewController` | `Review` | `reviews.service.ts` | `lib/api.ts` |
| CMS — attractions | `/api/attractions` | `attractionController` | `Attraction` | `attractions.service.ts` | `lib/api.ts` |
| Page builder | `/api/page-builder` | `pageBuilderController` | `PageBuilder` | `page-builder.service.ts` | `fetchPageBySlug` |
| Website pages | `/api/website`, `/api/pages` | `websiteController` | `WebsitePage`, `WebsiteSetting` | `website.service.ts`, `pages.service.ts` | `lib/api.ts` |
| Settings / theme | `/api/settings`, `/api/theme`, `/api/design` | `settingsController`, `themeController`, `designController` | `Setting`, `Theme`, `DesignConfig` | `settings.service.ts`, `theme.service.ts` | `lib/api.ts` |
| Marketing | `/api/marketing` | `marketingController` | — | `marketing.service.ts` | — |
| Email | `/api/emails` | `emailController`, `emailComposerController` | `EmailLog`, `EmailTemplate` | `emails.service.ts` | — |
| Inquiries | `/api/inquiries` | `inquiryController` | `Inquiry` | `inquiries.service.ts` | `submitInquiry` |
| SEO | `/api/seo` | `seoController` | — | `seo.service.ts` | — |
| ERP / guides | `/api/erp`, guide admin routes | `erpController`, `guideAdminRoutes` | mixed | `erp.service.ts`, `guide.service.ts` | — |
| Dashboard | `/api/admin` analytics | `dashboardController` | — | `dashboard.service.ts` | — |

## Environment and deployment

### Local ports (verified)

| Service | Port | Source |
|---------|------|--------|
| Backend API | 3001 | `run_all.ps1`, `ecosystem.config.js`, frontend `DEFAULT_API` |
| Public site | 3000 | `playwright.config.ts`, `run_all.ps1` |
| Admin | 8080 | `ycadmin/vite.config.ts` |

Note: `backend/src/server.js` defaults `PORT` to **5000** if unset; local scripts standardize on **3001** via env.

### API base URLs

| App | Dev default | Prod default |
|-----|-------------|--------------|
| frontend | `http://localhost:3001/api` | `https://api.youthcamping.online/api` via `NEXT_PUBLIC_API_URL` |
| ycadmin | `http://localhost:3001` | `https://api.youthcamping.online` via `VITE_API_URL` (`ycadmin/.env.production`) |

### VPS deploy (`deploy_vps.sh`)

1. `git pull` + submodule update (`ycadmin`)
2. Build `ycadmin` (`npm run build`)
3. Backend `npm install` + `prisma generate`
4. `pm2 reload all`

Public site deploy is **separate** (Vercel root project → `frontend` build).

### Required backend env (startup)

- **Critical**: `DATABASE_URL`, `JWT_SECRET`
- **Optional**: `BREVO_API_KEY`, Cloudinary vars, Supabase storage vars
- **Production documents**: `SUPABASE_URL` + `SUPABASE_KEY` (or `ALLOW_LOCAL_STORAGE=true`)

## Architectural violations (by severity)

### Critical

1. **Hardcoded JWT fallback** in `backend/src/lib/env.js` when `JWT_SECRET` is missing or short — weakens auth if misconfigured in production.

### High

1. **Mongoose layer orphaned** — models and `config/db.js` remain but runtime uses Prisma only; risk of accidental reactivation.
2. **Duplicate `/api/ops` router mounting** — `departureOperationsRoutes` and `opsRoutes` on same prefix.
3. **Dual route trees** — `backend/routes/` vs `backend/src/routes/` both active for public reads.

### Medium

1. **Root `src/` orphan** — duplicate admin components not used by any build.
2. **Duplicate Prisma model names** — `TripSOP`/`TripSop`, `OpsSOPTemplate`/`OpsSopTemplate`.
3. **Frontend mock fallbacks** — `MOCK_SLUG_MAP` and demo quotation data mask API failures locally.
4. **Scraper MongoDB docs** — `scraper/DEPLOYMENT.md` still describes Mongo as primary.

### Low

1. **Triple health route registration** in `app.js`.
2. **ycadmin git submodule** — separate repo; parent pointer must stay in sync on deploy.

## Safe change rules for agents and developers

1. **Edit only** `backend/`, `frontend/`, `ycadmin/` for product changes.
2. **Never** add Prisma/Mongoose/Supabase DB clients to frontend or ycadmin.
3. **Never** run destructive Prisma commands on production (`db push --force-reset`).
4. **Do not** copy business logic into UI — extend backend controllers/services.
5. **Do not** edit `*.archive/` folders except archival reference.
6. **Prefer** `backend/src/routes/` over `backend/routes/` for new endpoints.
7. **Submodule**: commit ycadmin changes inside submodule, then update parent pointer.
8. **Ports**: local backend = 3001; set `PORT=3001` in `backend/.env` for consistency.

## Verification commands

```bash
# Backend schema
cd backend && npx prisma validate && npx prisma generate

# Public site
cd frontend && npm run lint && npm run build

# Admin
cd ycadmin && npm run build

# Root tests (require TEST_API_URL and isolated DB for mutating suites)
npm run test:unit
```

## Related documents

- Root summary: `ARCHITECTURE.md`
- Agent guardrails: `AGENTS.md`
- Quick start: `QUICK-START.md`
- Submodule admin product rules: `ycadmin/.agents/AGENTS.md`
