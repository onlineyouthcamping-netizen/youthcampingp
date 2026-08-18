# YouthCamping OS — Agent Guardrails

Rules for AI agents and developers working in this monorepo. Full evidence-backed map: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Active code (edit here)

| Path | Role |
|------|------|
| `backend/` | Express API, Prisma, PostgreSQL, integrations |
| `frontend/` | Public Next.js website |
| `ycadmin/` | Admin ERP (git submodule) |

## Do not use for new work

| Path | Why |
|------|-----|
| `src/` (repo root) | Orphan copies — use `ycadmin/src/` |
| `ADMIN-PANEL-old.archive/` | Archived admin |
| `youthcampingp.archive/` | Archived frontend |
| `archive-travel-crm/` | Archived CRM |
| `backend/src/models/` (Mongoose) | Legacy — runtime uses Prisma |
| `backend/routes/` | Legacy route layer — prefer `backend/src/routes/` |

## Architecture boundaries

1. **Database access only in `backend/`** via Prisma (`backend/src/lib/prisma.js`).
2. **frontend** and **ycadmin** call REST only — no `@prisma/client`, Mongoose, or Supabase DB clients.
3. **Business logic** (pricing, RBAC, booking state, payments) lives in backend controllers/services.
4. **Document storage** may use Supabase Storage from backend (`utils/supabaseStorage.js`) — not from UI apps.

## Local development

```bash
# All three (Windows)
./run_all.ps1

# Or individually
cd backend && npm run dev    # http://localhost:3001 — set PORT=3001 in .env
cd frontend && npm run dev   # http://localhost:3000
cd ycadmin && npm run dev    # http://localhost:8080
```

API URLs:

- frontend: `NEXT_PUBLIC_API_URL` → defaults to `http://localhost:3001/api` in dev
- ycadmin: `VITE_API_URL` → defaults to `http://localhost:3001` in dev

## Git submodule (ycadmin)

`ycadmin` is a submodule (`https://github.com/onlineyouthcamping-netizen/ycadmin.git`).

1. Commit inside `ycadmin/` first.
2. Push submodule remote.
3. Update parent repo submodule pointer and push parent.

VPS deploy (`deploy_vps.sh`) runs `git submodule update --remote` and builds `ycadmin/dist`.

## Deployment surfaces

| App | Deploy target |
|-----|---------------|
| `frontend/` | Vercel (root `vercel-build` script) |
| `backend/` | VPS PM2 (`backend/ecosystem.config.js`) |
| `ycadmin/` | VPS static build + optional Vercel (`ycadmin/vercel.json`) |

## Safe operations

- `npx prisma validate` / `prisma generate` in backend
- `npm run build` in frontend and ycadmin
- Root Jest/Playwright with proper `TEST_API_URL` and isolated DB for mutating tests

## Forbidden without explicit approval

- `prisma db push --force-reset` or destructive migrations on production data
- Deleting archive folders or Mongoose models without migration completion plan
- Adding duplicate API route mounts on existing prefixes
- Hardcoding production secrets in source (use env vars)
- Changing production UI tokens globally without design sign-off

## Product context

Admin product principles live in `ycadmin/.agents/AGENTS.md` (booking-centric ERP, audit trail, module order).

Next.js version in `frontend/` may differ from training data — read `node_modules/next/dist/docs/` and `frontend/AGENTS.md` before App Router changes.
