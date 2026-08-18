# Project Architecture: YouthCamping OS

This document is the **short summary**. The evidence-backed audit (live vs legacy inventory, domain map, violations, deploy matrix) lives in **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**. Agent rules: **[`AGENTS.md`](AGENTS.md)**.

## 1. Unified 3-Tier Architecture Overview

```
YouthCamping OS
│
├── frontend/      → Public Website (Next.js 16 + React 19 + Tailwind CSS)
├── ycadmin/       → Admin Portal ERP (Vite + React 19 + TypeScript + Tailwind CSS)
└── backend/       → Shared Node.js / Express + Prisma ORM + PostgreSQL API
```

### A. Public Website
- **Location**: `/frontend`
- **Role**: Customer-facing portal for browsing trips, reading blogs/reviews, and executing inquiry/booking workflows.
- **Tech Stack**: Next.js 16 + React 19 + TypeScript + Tailwind CSS.
- **Media Delivery**: Cloudinary CDN integrations for optimized, responsive image delivery.
- **Routing**: Next.js App Router.

### B. Admin Portal ERP
- **Location**: `/ycadmin`
- **Role**: Centralized internal operating system for managing bookings, trips, departures, operations, finance, train ticketing, vendor management, and settings.
- **Tech Stack**: Vite + React 19 + TypeScript + Tailwind CSS.
- **Design Philosophy**: High information density, modern minimal SaaS aesthetic, responsive tabbed workspaces.

### C. Backend API Server
- **Location**: `/backend`
- **Role**: Centralized API server hosting business logic, RBAC security, PDF invoice generation, email notifications, and transactional workflows.
- **Tech Stack**: Node.js + Express + Prisma ORM + PostgreSQL.
- **Security**: JWT authentication, role-based access control (RBAC), and parameter sanitization.

---

## 2. Key Architectural Constraints & Rules

1. **No Direct Database Access**: Frontend and Admin Portal communicate exclusively with the Backend API via secure REST endpoints over HTTPS.
2. **Strict Environment Separation**: Each application tier maintains its own dedicated `.env` configuration files.
3. **Data Protection & Auditability**: Existing production data (trips, bookings, invoices, payments, user accounts, audit logs) is preserved. Destructive migrations (`prisma db push --force-reset`) are strictly prohibited.
4. **UI Design Lock**: Production UI styles, component layouts, and color tokens remain consistent and locked to prevent visual regression.
