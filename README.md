# YouthCamping OS

Internal Operating System and Platform for YouthCamping.

## Workspace Structure

```
YouthCamping OS
│
├── frontend/      → Public Website (Next.js 16 + React 19)
├── ycadmin/       → Admin Portal ERP (Vite + React 19 + TypeScript)
└── backend/       → Shared API (Node.js + Express + Prisma ORM)
```

## Running Locally

- **Backend API**: `cd backend && npm run dev` (Port 3001)
- **Admin Portal**: `cd ycadmin && npm run dev` (Port 8080 / 5173)
- **Public Website**: `cd frontend && npm run dev` (Port 3000)