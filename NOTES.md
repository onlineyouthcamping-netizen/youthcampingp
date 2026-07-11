# Setup & Diagnostic Reference

## URL & Port Mapping
* **ycadmin Admin Panel:** `http://localhost:8080` (Standard bind, falls back to `8081` or `8082` if occupied).
* **Main Frontend Client Portal:** `http://localhost:3000`
* **Backend Database API Server:** `http://localhost:3001`

---

## Startup Commands
### Start Admin Panel (Vite Dev Server)
```bash
cd D:\os\ADMIN-PANEL
npm run dev
```

### Start Backend API Server
```bash
cd D:\os\backend
node src/server.js
```

### Start Frontend Portal (Next.js)
```bash
cd D:\os\youthcampingp
npm run dev
```

---

## Design System Tokens
* **Sidebar Background:** `#0B1220`
* **Page Background:** `#F7F8FA`
* **Card Surface:** `#FFFFFF`
* **Card Border:** `#ECEEF1`
* **Card Radius:** `12px`
* **Accent Color (Active Only):** `#F97316`
* **Text on Dark Sidebar (Default):** `#AEB4C2`
* **Text on Dark Sidebar (Active/Hover):** `#FFFFFF`
* **Card Shadow Default:** `0 1px 2px rgba(16,24,40,0.04)`
* **Card Shadow Hover:** `0 8px 20px rgba(16,24,40,0.08)`, translateY(-2px), transition 180ms
* **Spacing Scale:** Multiples of 4px (primarily 8px, 12px, 16px, 24px)
* **Icons:** Tabler outline icon set, inline size 16px, decorative max 24px
