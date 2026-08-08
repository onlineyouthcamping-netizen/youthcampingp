# 🚀 Quick Start Guide - YouthCamping OS

## Workspace Architecture

```
YouthCamping OS
│
├── frontend/      → Public Website (Next.js 16 + React 19)
├── ycadmin/       → Admin Portal ERP (Vite + React 19 + TypeScript)
└── backend/       → Shared API Server (Node.js + Express + Prisma ORM)
```

---

## 🎯 RUNNING THE PROJECT LOCALLY

### 1. Start Backend API Server
```bash
cd backend
npm run dev
```
Backend API runs on **http://localhost:3001**

### 2. Start Admin Portal (ERP)
```bash
cd ycadmin
npm run dev
```
Admin Portal runs on **http://localhost:8080**

### 3. Start Public Website
```bash
cd frontend
npm run dev
```
Public Website runs on **http://localhost:3000**

---

## 🔑 ADMIN LOGIN
- Route: `/admin/login` (http://localhost:8080/admin/login)
- Email: `hemal.patel@youthcamping.online`
