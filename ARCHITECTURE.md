# Project Architecture: YouthCamping

This document defines the architecture, data flow, security boundaries, and strict constraints for the YouthCamping platform.

## 1. Multi-Tier System Overview

### A. Public Frontend
- **Location**: `/frontend`
- **Role**: Customer-facing portal for browsing trips, reading blogs/reviews, and executing inquiry/booking workflows.
- **Tech Stack**: Next.js 16 + React 19 + TypeScript + Tailwind CSS.
- **Media Delivery**: Cloudinary CDN integrations for optimized, responsive image delivery.
- **Routing**: Next.js App Router.

### B. Admin Panel
- **Location**: `/ADMIN-PANEL`
- **Role**: Internal operational control panel for managing trips, bookings, inquiries, quotations, and content (Page Builder).
- **Tech Stack**: Vite + React + TypeScript + Tailwind CSS.

### C. Main Backend API
- **Location**: `/backend`
- **Role**: Centralized API server hosting business logic, authentication, PDF invoice generation, and transactional workflows.
- **Tech Stack**: Node.js + Express + Prisma ORM + Supabase PostgreSQL.
- **Security**: JWT authentication.

### D. Guide System
- **Location**: `/guide`
- **Role**: Separate portal and backend for managing guide attendance, assignment logs, and operational reports.
- **Tech Stack**: Separate Express API + Drizzle ORM + Separate Guide PostgreSQL database layer.

---

## 2. Key Architectural Constraints & Rules

1. **No Direct Database Access**: Frontend and Admin Panel must never communicate directly with PostgreSQL or any database. All operations must go through the Main Backend API or Guide API via secure HTTPS REST endpoints.
2. **Strict Environment Separation**: Each tier maintains its own `.env` configuration files. Deployment credentials must never be shared across tiers.
3. **Data Boundary Isolation**:
   - **Public Access**: Public API endpoints return only published, active Page Builder sections, trips, blogs, and reviews. Draft metadata and internal configurations are excluded and cached at the edge or node level.
   - **Admin/Private Access**: Restricted behind strict JWT authorization. Sensitive, transactional, and personal endpoints return full records and enforce zero cache policies (`Cache-Control: no-store`).
4. **Absolute Data Protection Lock**: Stored production/staging data (trips, bookings, invoices, payments, settings, accounts) is locked. Direct database mutations, migration overrides (`prisma migrate`, `prisma db push`), or database seeding are strictly prohibited.
5. **UI/Design Lock**: Visual UI layouts, responsive CSS patterns, and color tokens are locked to prevent regression. Performance improvements must remain code-level and visually transparent.

---

## 3. Directory Audits & Notes

- **Untracked Directory Warning**: The directory `/ycadmin` exists in the codebase root but is duplicate/untracked. It must not be deleted or moved during current operations to preserve project integrity.
