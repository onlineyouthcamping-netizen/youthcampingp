| Route | Duplicate | ycadmin callers | frontend callers | Canonical | Safe to remove |
|-------|-----------|-----------------|------------------|-----------|----------------|
| `/health` | Same `../routes/health` router also mounted at `/api/health` | None in `ycadmin/src/services` (folder absent); no admin app hits found | 0 direct callers found | `/api/health` | REQUIRES VERIFICATION |
| `/api/trips` | Prefix reused by both `tripRoutes` and `tripFaqsRoutes` | No `ycadmin/src/services` folder; admin app calls trip endpoints in `DepartureHubPage.tsx` (`/trips/:id`) | Active callers in `frontend/src/lib/api.ts` and `frontend/src/app/book/page.tsx` (`/trips`, `/trips/public/*`) | KEEP CURRENT PREFIX | KEEP BOTH |
| `/api/departure-engine` | Same `departureEngineRoutes` router also mounted at `/api/departures` | No `ycadmin/src/services` folder; admin app calls `/departure-engine/:tripId/:date/passenger-stats` in `DepartureHubPage.tsx` | 0 callers found | `/api/departure-engine` | KEEP BOTH |
| `/api/departures` | Same `departureEngineRoutes` router also mounted at `/api/departure-engine` | No `ycadmin/src/services` folder; admin app calls `/departures/resolve` and `/departures/status` in `DepartureHubPage.tsx` | 0 callers found | `/api/departures` | KEEP BOTH |
| `/api/website` | Same `websiteRoutes` router also mounted at `/api/pages` | None in `ycadmin/src/services`; no admin app hits found | Active callers in `frontend/src/lib/api.ts` (`/website/pages`, `/website/pages/:slug`) | `/api/website` | KEEP BOTH |
| `/api/pages` | Same `websiteRoutes` router also mounted at `/api/website` | None in `ycadmin/src/services`; no admin app hits found | 0 callers found | `/api/website` | SAFE TO REMOVE |
| `/api/payments` | Same `paymentRoutes` router also mounted at `/api/ops/payments` | No `ycadmin/src/services` folder; no direct admin service hits found | 0 callers found | `/api/payments` | REQUIRES VERIFICATION |
| `/api/ops/payments` | Same `paymentRoutes` router also mounted at `/api/payments` | No `ycadmin/src/services` folder; admin app calls `/ops/payments/vendor/:tripId` in `DepartureHubPage.tsx` | 0 callers found | `/api/ops/payments` | KEEP BOTH |

Notes:
- `ycadmin/src/services` does not exist in the current submodule checkout, so `ycadmin` caller counts were verified from actual in-app API usage under `ycadmin/src/`.
- `/health` is not referenced by the current web apps, but `backend/src/middleware/requestTimeout.js` and tests explicitly recognize both `/health` and `/api/health`, so removing it should be validated against uptime probes or external monitors first.
