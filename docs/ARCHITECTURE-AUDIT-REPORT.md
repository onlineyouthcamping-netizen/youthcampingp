# Architecture Audit Status Report

**Date:** 2026-08-18  
**Scope:** `backend/`, `frontend/`, `ycadmin/` (+ legacy path classification)

## Executive summary

YouthCamping OS is a **3-tier monorepo** with a single active API (`backend/`), public site (`frontend/`), and admin SPA (`ycadmin/` submodule). Production data path is **Prisma + PostgreSQL**. Legacy **Mongoose/MongoDB** artifacts remain in the repo but are **not wired into runtime startup**.

Documentation and agent guardrails were added without changing production behavior.

## Deliverables completed

| Deliverable | Location |
|-------------|----------|
| Full architecture map | `docs/ARCHITECTURE.md` |
| Agent guardrails | `AGENTS.md` |
| Orphan `src/` notice | `src/README.md` |
| README / ARCHITECTURE pointers | `README.md`, `ARCHITECTURE.md` |

## Phase 2 route hygiene (2026-08-18)

| Change | Detail |
|--------|--------|
| `/api/ops` | **RESOLVED** — single `opsRoutes.js` mount; `departureOperationsRoutes` merged via `router.use()` before auth |
| Public legacy routes | Migrated to `src/routes/` (destinations, stories, reviews, trip faqs) |
| `/api/health` | Removed duplicate post-rate-limit mount; early mounts retained |
| `backend/routes/health.js` | Still canonical for health checks |

### Routes requiring future migration (category C)

- `backend/routes/trips.js` — not mounted; modern `tripRoutes.js` is canonical
- `backend/routes/tripKnowledge.js`, `tripDocuments.js`, `tripSOPs.js`, `tripVendors.js` — not mounted
- `/api/trips-knowledge` vs `/api/knowledge` — overlapping names, different handlers
- `/api/trips-sops` vs `/api/ops/sops` — overlapping names, different handlers
- `opsRoutes.js` — ~~`getRoomInventory` imported but `/ops/rooms/*` routes never registered~~ **Resolved** — routes registered; POST accepts `rooms` batch (matches ycadmin caller)

## Risk register

| ID | Severity | Finding | Recommended next step |
|----|----------|---------|----------------------|
| R1 | **Critical** | JWT fallback secret in `backend/src/lib/env.js` if `JWT_SECRET` unset/weak | Require strong `JWT_SECRET` in all prod envs; remove fallback in a dedicated security PR |
| R2 | **High** | ~~`/api/ops` double-mounted~~ | **Resolved in Phase 2** — merged into single `opsRoutes.js` |
| R3 | **High** | ~~Legacy `backend/routes/` public reads~~ | **Partially resolved** — destinations/stories/reviews/faqs migrated; health remains in `backend/routes/` |
| R4 | **High** | 17+ Mongoose models unused at runtime | Mark deprecated; delete after confirming no scripts depend on them |
| R5 | **Medium** | Duplicate Prisma models (`TripSOP`/`TripSop`, etc.) | Schema consolidation plan with migration |
| R6 | **Medium** | Root `src/` orphan admin copies | Delete folder after team confirms (currently documented only) |
| R7 | **Medium** | Frontend mock trip/blog fallbacks hide API errors | Gate mocks to `NODE_ENV=development` only |
| R8 | **Low** | `server.js` default PORT 5000 vs local standard 3001 | Document `PORT=3001` in `backend/.env.example` |
| R9 | **Low** | Scraper docs reference MongoDB | Update scraper docs to PostgreSQL/Prisma import path |

## Verification results

| Check | Result | Notes |
|-------|--------|-------|
| `backend` `npx prisma validate` | **PASS** | Schema valid |
| `ycadmin` `npm run build` | **PASS** | Vite production build succeeded (~9s) |
| `frontend` `npm run build` | **PASS** | Next.js 16.2.4 build succeeded |
| `frontend` `npm run lint` | **FAIL (pre-existing)** | Hundreds of warnings/errors in app + `frontend/scripts/` — not introduced by this audit |

## Recommended phased remediation (not applied in this audit)

### Phase 1 — Documentation & safety (done)

- Architecture map, agent rules, orphan notices.

### Phase 2 — Route hygiene (low risk, needs regression tests)

- Resolve `/api/ops` duplicate mount.
- Consolidate `backend/routes/` into `backend/src/routes/`.
- Remove duplicate health mounts.

### Phase 3 — Legacy ORM cleanup (medium risk)

- Archive `backend/src/models/` and `config/db.js`.
- Update or retire Mongo seed scripts.
- Align scraper output with Prisma import.

### Phase 4 — Schema consolidation (high risk — needs migration plan)

- Merge duplicate Prisma model pairs.
- RBAC and finance regression test suite before deploy.

## Verification commands

```bash
cd backend && npx prisma validate
cd frontend && npm run lint
cd ycadmin && npm run build
```

---

*This report is generated from repository evidence. Do not edit the audit plan file in `.cursor/plans/`.*
