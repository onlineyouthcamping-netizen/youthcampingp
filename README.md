# YouthCamping OS

Internal Operating System and Platform for YouthCamping.

## Workspace Structure

```
YouthCamping OS
│
├── frontend/      → Public Website (Next.js 16 + React 19)
├── ycadmin/       → Admin Portal ERP (Vite + React 19 + TypeScript) [git submodule]
└── backend/       → Shared API (Node.js + Express + Prisma ORM + PostgreSQL)
```

**Architecture reference:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · **Agent rules:** [`AGENTS.md`](AGENTS.md)

**Legacy / archive (do not edit for production):** `ADMIN-PANEL-old.archive/`, `youthcampingp.archive/`, `archive-travel-crm/`, root `src/` (orphan copies — use `ycadmin/`).

## Running Locally

- **Backend API**: `cd backend && npm run dev` (Port 3001)
- **Admin Portal**: `cd ycadmin && npm run dev` (Port 8080 / 5173)
- **Public Website**: `cd frontend && npm run dev` (Port 3000)