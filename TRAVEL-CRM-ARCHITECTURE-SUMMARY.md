# Travel CRM Project Architecture Summary

## 1. Project Overview

### Projects Structure
- **Backend**: `travel-crm/backend` - Express.js + Prisma + PostgreSQL
- **Frontend (Main)**: `FT/` - Vite React app (monorepo with pnpm)
- **Admin Panel**: `ADMIN-PANEL/` - Vite React app
- **Unused**: `travel-crm/frontend` - Next.js (appears unused)

---

## 2. Backend Structure

### File Organization
```
travel-crm/backend/
├── src/
│   ├── app.ts              # Express app setup
│   ├── server.ts           # Server entry point
│   ├── routes/
│   │   ├── authRoutes.ts   # Auth endpoints
│   │   ├── tripRoutes.ts   # Trip endpoints
│   │   ├── inquiryRoutes.ts
│   │   └── bookingRoutes.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── tripController.ts
│   │   ├── inquiryController.ts
│   │   └── bookingController.ts
│   ├── middleware/
│   │   └── authMiddleware.ts  # JWT verification & admin checks
│   └── types/
├── prisma/
│   └── schema.prisma       # Database models
├── .env                    # Config (PORT=5005, DB_URL, JWT_SECRET)
└── package.json            # Dependencies: Express, Prisma, bcryptjs, jsonwebtoken
```

### API Endpoints Defined

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/auth/login` | Public | Login for Admin/Agent/Traveler (type param) |
| POST | `/api/auth/register` | Public | Traveler registration |
| GET | `/api/trips` | Public | Get all trips |
| GET | `/api/trips/:slug` | Public | Get trip by slug |
| POST | `/api/trips` | Protected* | Create trip |
| GET | `/api/inquiries` | Protected | Get all inquiries (labeled "admin only" in comments) |
| GET | `/api/inquiries/me` | Protected | Get user's own inquiries |
| POST | `/api/inquiries` | Public | Submit new inquiry |
| PATCH | `/api/inquiries/:id` | Protected | Update inquiry status/notes |
| GET | `/api/bookings` | Protected | Get all bookings |
| GET | `/api/bookings/me` | Protected | Get user's own bookings |
| POST | `/api/bookings` | Protected | Create booking from inquiry |

*Note: POST /api/trips has `protect` middleware but not `adminOnly` - comment suggests it could/should be admin-only

---

## 3. Frontend Structures

### FT/ (Main Frontend)
**Type**: Vite React monorepo (pnpm workspaces)

```
FT/
├── src/
│   ├── pages/
│   │   ├── home.tsx
│   │   ├── tour-listings.tsx
│   │   ├── tour-detail.tsx
│   │   ├── my-trips.tsx
│   │   └── blog-detail.tsx
│   ├── components/
│   ├── lib/
│   │   └── auth-context.tsx  # Auth state management
│   └── hooks/
├── lib/api-client-react/    # Shared API client (monorepo package)
│   └── src/custom-fetch.ts  # Base URL: setBaseUrl()
└── .env.local
    VITE_API_URL=http://localhost:8888  (NO /api suffix!)
```

**API Calls Made**:
- Hits: `GET ${apiUrl}/trips`, `GET ${apiUrl}/trips/{id}`
- **❌ BROKEN**: `GET ${apiUrl}/users/bookings` - endpoint doesn't exist
- **❌ BROKEN**: `GET ${apiUrl}/users/me` - endpoint doesn't exist
- **❌ BROKEN**: `GET ${apiUrl}/page-builder/home` - from external FT backend
- **❌ BROKEN**: `GET ${apiUrl}/blogs/{id}` - from external FT backend

### ADMIN-PANEL
**Type**: Vite React app

```
ADMIN-PANEL/
├── src/
│   ├── pages/admin/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── TripsPage.tsx
│   │   ├── BookingsPage.tsx
│   │   ├── InquiriesPage.tsx
│   │   └── ... (14 more pages)
│   ├── services/
│   │   ├── api.ts          # Axios instance with interceptors
│   │   ├── auth.service.ts
│   │   ├── trips.service.ts
│   │   ├── bookings.service.ts
│   │   ├── inquiries.service.ts
│   │   └── ... (8 more services)
│   ├── store/
│   │   └── auth.store.ts
│   └── components/
├── .env
    VITE_API_URL=http://localhost:8888/api
```

**API Service Calls**:
- Auth: `POST /admin/login` (↓ **DOESN'T EXIST**)
- Auth: `GET /admin/me` (↓ **DOESN'T EXIST**)
- Dashboard: `GET /admin/stats` (↓ **DOESN'T EXIST**)
- Trips: `GET|POST|PUT|DELETE /trips`
- Bookings: `GET|POST|PUT|PATCH|DELETE /bookings`
- Inquiries: `GET|PATCH /inquiries`

---

## 4. Database Schema (Prisma)

### Models

```typescript
// Admin/Agent users
User {
  id: String @id
  name: String
  email: String @unique
  password: String
  role: Role (ADMIN | AGENT)
  inquiries: Inquiry[] (AssignedAdmin)
  createdAt, updatedAt
}

// End customer/travelers
Traveler {
  id: String @id
  name: String
  email: String @unique
  phone: String?
  password: String
  bookings: Booking[]
  createdAt, updatedAt
}

// Tour packages
Trip {
  id: String @id
  title: String
  slug: String @unique
  description: String
  price: Float
  duration: String
  location: String
  images: String[]          // Cloudinary URLs
  inclusions: String[]
  exclusions: String[]
  itinerary: Json           // Array of day objects
  inquiries: Inquiry[]
  createdAt, updatedAt
}

// Customer inquiry for tour
Inquiry {
  id: String @id
  tripId: String (FK)
  trip: Trip
  name: String
  phone: String
  email: String
  travelDate: DateTime
  pax: Int
  status: InquiryStatus (NEW | CONTACTED | NEGOTIATING | BOOKED | CANCELLED)
  assignedTo: String?       // User ID
  admin: User? (AssignedAdmin)
  notes: Json?              // Array of {author, text, date} objects
  source: String (default: "website")
  booking: Booking?
  createdAt, updatedAt
}

// Conversion: Inquiry → Booking
Booking {
  id: String @id
  inquiryId: String @unique (FK)
  inquiry: Inquiry
  travelerId: String?       // FK (optional)
  traveler: Traveler?
  totalAmount: Float
  paymentStatus: PaymentStatus (PENDING | PARTIAL | PAID)
  travelers: Json           // Array of traveler details
  createdAt, updatedAt
}
```

---

## 5. Authentication & JWT

### Implementation Location
**File**: [src/middleware/authMiddleware.ts](travel-crm/backend/src/middleware/authMiddleware.ts)

### JWT Config
- **Secret**: `process.env.JWT_SECRET` 
- **Expiry**: 30 days
- **Payload**: `{ id }` (works for User or Traveler)
- **Token Creation**: [authController.ts](travel-crm/backend/src/controllers/authController.ts#L8)

### Middleware Functions
```typescript
protect()      // Verifies Bearer token, sets req.user
adminOnly()    // Checks req.user.role === 'ADMIN'
```

### Implementation in Frontends

**ADMIN-PANEL** (`src/services/api.ts`):
```typescript
// Axios interceptor adds Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 response redirects to /admin/login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("admin_token");
      window.location.href = "/admin/login";
    }
  }
);
```

**FT** (`lib/auth-context.tsx`):
- Stores token in `localStorage`
- Basic fetch with Authorization header

---

## 6. Environment Configuration

### Backend
**File**: `travel-crm/backend/.env`
```
PORT=5005                               # Default: 5000 in server.ts
DATABASE_URL=postgresql://user:pass@localhost:5432/travel_crm
JWT_SECRET=supersecret123
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend (FT)
**File**: `FT/.env.local`
```
VITE_API_URL=http://localhost:8888          (no /api suffix)
NEXT_PUBLIC_API_URL=http://localhost:8888   (legacy Next.js)
```

### Admin Panel
**File**: `ADMIN-PANEL/.env`
```
VITE_API_URL=http://localhost:8888/api      (with /api suffix)
NEXT_PUBLIC_API_URL=http://localhost:8888/api
```

---

## 7. Critical Issues & Bugs Found

### 🔴 CRITICAL - BREAKING ISSUES

#### 1. Admin Login Endpoint Mismatch
- **Backend has**: `POST /api/auth/login` with body `{ email, password, type: 'admin'|'traveler' }`
- **ADMIN-PANEL calls**: `POST /api/admin/login` ❌ **DOESN'T EXIST**
- **Impact**: Admin login completely broken

#### 2. Missing User/Traveler Endpoints
- **FT calls**: `GET /users/bookings`, `GET /users/me`
- **Backend has**: No `/users/` routes at all
- **Impact**: FT can't fetch user bookings or profile
- **Current workaround attempt**: Services exist but endpoints missing

#### 3. Port Configuration Mismatch
- **Backend**: Runs on port 5000/5005
- **Frontends expect**: `http://localhost:8888`
- **Impact**: All API calls fail with CORS/connection error
- **Note**: Port 8888 appears to be external API gateway (not configured)

### 🟠 MEDIUM - API Endpoint Issues

#### 4. Missing Delete/Update Endpoints
- **Services call**: `PUT /bookings/{id}`, `DELETE /bookings/{id}`, `PUT /trips/{id}`, `DELETE /trips/{id}`
- **Backend has**: No PUT, DELETE routes for these
- **Impact**: Edit/delete operations silently fail or error

#### 5. Missing Dashboard Endpoint
- **ADMIN-PANEL calls**: `GET /admin/stats`
- **Backend has**: No stats endpoint
- **Impact**: Dashboard fails to load

#### 6. Trip ID vs Slug Inconsistency
- **ADMIN-PANEL calls**: `GET /trips/{id}` (by ID)
- **Backend has**: `GET /trips/:slug` (by slug only), `POST /trips` creates with slug
- **Missing**: `GET /trips/{id}` by UUID

#### 7. Unprotected Route: Trip Creation
- **Route**: `POST /api/trips` has `protect` middleware only (not `adminOnly`)
- **Comment says**: "could be adminOnly"
- **Impact**: Any authenticated user (including travelers) can create tours

#### 8. Endpoint Route Inconsistencies
- **Comment**: Routes labeled `GET /api/admin/inquiries` but actual route is `GET /api/inquiries`
- **Pattern**: No actual `/api/admin/` prefixed routes exist
- **Impact**: Confusion about which routes are admin-only

### 🟡 LOW - Error Handling Issues

#### 9. Generic Error Messages
- Controllers return `res.status(500).json({ error })` - exposes full error objects to client
- Should sanitize error messages for security

#### 10. No Validation on Request Bodies
- Controllers don't validate incoming data before Prisma operations
- Can cause unexpected database errors

---

## 8. API Endpoint Sync Status

| Feature | Backend | ADMIN-PANEL | FT Frontend | Status |
|---------|---------|------------|------------|--------|
| Trips (List) | ✅ GET /trips | ✅ calls /trips | ✅ calls /trips | **Synced** |
| Trips (Create) | ✅ POST /trips | ✅ calls /trips | ❌ Not callable | **Partial** |
| Trips (Get by ID) | ❌ Missing | ✅ calls /trips/{id} | ❌ calls by ID | **Mismatch** |
| Trips (Edit) | ❌ Missing | ✅ calls PUT /trips/{id} | ❌ | **Missing** |
| Trips (Delete) | ❌ Missing | ✅ calls DELETE /trips/{id} | ❌ | **Missing** |
| Inquiries (List) | ✅ GET /inquiries | ✅ calls /inquiries | ❌ | **Partial** |
| Inquiries (Submit) | ✅ POST /inquiries | ❌ | ❌ Form view only | **Partial** |
| Inquiries (Update) | ✅ PATCH /inquiries/{id} | ✅ calls /inquiries | ❌ | **Partial** |
| Bookings (List) | ✅ GET /bookings | ✅ calls /bookings | ❌ /users/bookings | **Mismatch** |
| Bookings (Create) | ✅ POST /bookings | ✅ calls /bookings | ❌ | **Partial** |
| Bookings (Update) | ❌ Missing | ✅ calls PUT /bookings/{id} | ❌ | **Missing** |
| User Auth | ⚠️ /auth/login | ❌ /admin/login | ✅ /auth/login | **Mismatch** |
| User Profile | ❌ No /users/me | ❌ /admin/me | ❌ /users/me | **Missing** |
| Dashboard Stats | ❌ Missing | ❌ /admin/stats | N/A | **Missing** |

---

## 9. File Paths Reference

### Backend Key Files
- API startup: [src/app.ts](travel-crm/backend/src/app.ts)
- Database schema: [prisma/schema.prisma](travel-crm/backend/prisma/schema.prisma)
- JWT middleware: [src/middleware/authMiddleware.ts](travel-crm/backend/src/middleware/authMiddleware.ts)
- Auth endpoints: [src/routes/authRoutes.ts](travel-crm/backend/src/routes/authRoutes.ts)
- Auth logic: [src/controllers/authController.ts](travel-crm/backend/src/controllers/authController.ts)
- Trip logic: [src/controllers/tripController.ts](travel-crm/backend/src/controllers/tripController.ts)
- Inquiry logic: [src/controllers/inquiryController.ts](travel-crm/backend/src/controllers/inquiryController.ts)
- Booking logic: [src/controllers/bookingController.ts](travel-crm/backend/src/controllers/bookingController.ts)

### ADMIN-PANEL Key Files
- API client: [src/services/api.ts](ADMIN-PANEL/src/services/api.ts)
- Auth service: [src/services/auth.service.ts](ADMIN-PANEL/src/services/auth.service.ts)
- Auth store: [src/store/auth.store.ts](ADMIN-PANEL/src/store/auth.store.ts)
- Login page: [src/pages/admin/LoginPage.tsx](ADMIN-PANEL/src/pages/admin/LoginPage.tsx)
- Service layer: [src/services/](ADMIN-PANEL/src/services/)

### FT Key Files
- Auth context: [src/lib/auth-context.tsx](FT/src/lib/auth-context.tsx)
- Home page: [src/pages/home.tsx](FT/src/pages/home.tsx)
- Tour listings: [src/pages/tour-listings.tsx](FT/src/pages/tour-listings.tsx)
- API client: [lib/api-client-react/src/custom-fetch.ts](FT/lib/api-client-react/src/custom-fetch.ts)

---

## Summary

**Architecture**: Microservice-style with Express API + two Vite React frontends
**Database**: PostgreSQL with Prisma ORM
**Auth**: JWT tokens (30-day expiry), dual user models (Admin/Traveler)
**Status**: **BROKEN IN PRODUCTION** - Critical endpoint mismatches prevent login and data fetching
**Recommended Actions**: 
1. Fix endpoint paths (admin login, user profile)
2. Configure correct port (8888 or 5000?)
3. Add missing CRUD operations
4. Implement admin protection on restricted routes
