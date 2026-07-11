# Travel CRM - Architecture Diagram & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          TRAVEL CRM SYSTEM                              │
└─────────────────────────────────────────────────────────────────────────┘

CLIENT LAYER (Frontend)
├─────────────────────────────────────┬──────────────────────────────────┐
│  FT/ (Main Customer Frontend)        │  ADMIN-PANEL/ (Admin Dashboard)  │
│  Vite React                          │  Vite React                      │
│  Port: 3000                          │  Port: 3000                      │
│  ├─ Pages:                          │  ├─ Pages:                      │
│  │  ├─ home.tsx                     │  │  ├─ LoginPage               │
│  │  ├─ tour-listings.tsx            │  │  ├─ DashboardPage          │
│  │  ├─ tour-detail.tsx              │  │  ├─ TripsPage              │
│  │  └─ my-trips.tsx (BROKEN)        │  │  ├─ BookingsPage           │
│  │                                   │  │  ├─ InquiriesPage          │
│  ├─ Auth: localStorage               │  │  ├─ BlogsPage              │
│  └─ API Base: 8888 (NO /api)        │  │  └─ ... (14 more pages)    │
│                                       │  ├─ Auth: localStorage          │
└───────────┬───────────────────────────┼──────────────┬─────────────────┘
            │                           │              │
            │                           │              │
            ├─────────────┬─────────────┴──────────────┤
            │             │                            │
            │             └────────────┬───────────────┘
            │                          │
        HTTP calls               HTTP calls
     (broken, port 8888)      (baseURL + /api)
            │                          │
            ▼                          ▼
┌────────────────────────────────────────────────┐
│    API Gateway / Reverse Proxy (?)             │
│    Port: 8888                                  │
│    Status: CONFIGURED but unclear if running   │
│    Maps requests to backend                    │
└────────────┬───────────────────────────────────┘
             │
             │
             ▼
┌────────────────────────────────────────────────┐
│  EXPRESS API SERVER                            │
│  travel-crm/backend/                           │
│  Port: 5000 (default) or 5005 (.env)          │
│                                                │
│  Routes:                                       │
│  ├─ POST /api/auth/login (type='admin'|'traveler')
│  ├─ POST /api/auth/register                   │
│  ├─ GET  /api/trips (public)                  │
│  ├─ GET  /api/trips/:slug                     │
│  ├─ POST /api/trips (protected, not admin)    │
│  ├─ GET  /api/inquiries (protected)           │
│  ├─ POST /api/inquiries (public)              │
│  ├─ GET  /api/bookings (protected)            │
│  └─ POST /api/bookings (protected)            │
│                                                │
│  Middleware:                                   │
│  ├─ protect() - Verify JWT token              │
│  └─ adminOnly() - Check User.role='ADMIN'     │
│                                                │
│  Controllers:                                  │
│  ├─ authController.ts                         │
│  ├─ tripController.ts                         │
│  ├─ inquiryController.ts                      │
│  └─ bookingController.ts                      │
│                                                │
│  Middleware (JWT):                            │
│  └─ authMiddleware.ts                         │
│     - Extracts Bearer token                   │
│     - Verifies with JWT_SECRET                │
│     - Looks up User OR Traveler               │
│     - Attaches to req.user                    │
└────────────┬───────────────────────────────────┘
             │
             │ Prisma ORM
             │
             ▼
┌────────────────────────────────────────────────┐
│  PostgreSQL Database                           │
│  travel_crm schema                             │
│                                                │
│  Tables:                                       │
│  ├─ User (Admin/Agent)                        │
│  ├─ Traveler (Customers)                      │
│  ├─ Trip (Tour Packages)                      │
│  ├─ Inquiry (Leads)                           │
│  └─ Booking (Conversions)                     │
│                                                │
│  URL: postgresql://...@localhost:5432/...     │
└────────────────────────────────────────────────┘
```

---

## Data Flow: User Registration & Login

```
TRAVELER REGISTRATION
─────────────────────────────────────────────────

FT Frontend                 Backend                     Database
     │                         │                            │
     │  POST /auth/register    │                            │
     │  {name, email, pwd}     │                            │
     ├────────────────────────>│                            │
     │                         │  hash password (bcryptjs)  │
     │                         │  create Traveler record    │
     │                         ├───────────────────────────>│
     │                         │<───────────────────────────┤
     │  {id, name, email, JWT} │  (INSERT successful)       │
     │<────────────────────────┤                            │
     │                         │                            │
     │  save token → localStorage                           │
     │  redirect to home                                    │
     │                                                      │

ADMIN LOGIN (BROKEN)
────────────────────────────────────────────────

ADMIN-PANEL                 Backend                     Database
     │                         │                            │
     │  POST /admin/login      │                            │
     │  {email, password}      │                            │
     ├────────────────────────>│  ❌ Route doesn't exist!   │
     │<────────────────────────┤  (404 response)            │
     │  Error                  │                            │
     │                         │                            │

SHOULD ACTUALLY CALL:
     │  POST /api/auth/login                    │
     │  {email, password, type: 'admin'}        │
     ├────────────────────────>│                │
     │                         │  find User record          │
     │                         ├───────────────>│
     │                         │<───────────────┤
     │                         │  verify password (bcryptjs)│
     │                         │  sign JWT (30d expiry)     │
     │  {id, name, role, JWT}  │                │
     │<────────────────────────┤                │
     │  save token → admin_token localStorage   │
```

---

## Data Flow: Trip Inquiry to Booking

```
CUSTOMER TRIP INQUIRY
────────────────────────────────────────────────

FT Frontend                 Backend                     Database
     │                         │                            │
     │  POST /api/inquiries    │                            │
     │  {tripId, name, phone,  │                            │
     │   email, travelDate, pax}                           │
     ├────────────────────────>│                            │
     │                         │  create Inquiry record     │
     │                         ├───────────────────────────>│
     │                         │<───────────────────────────┤
     │                         │  (INSERT with status=NEW)  │
     │  {id, ...inquiry data}  │                            │
     │<────────────────────────┤                            │
     │                         │                            │
     │  show confirmation msg                              │
     │                                                      │

ADMIN CONVERTS TO BOOKING (WORKFLOW)
────────────────────────────────────────────────

ADMIN-PANEL             Backend                     Database
     │                     │                            │
     │ GET /inquiries      │                            │
     ├────────────────────>│  SELECT all Inquiry        │
     │                     ├───────────────────────────>│
     │<────────────────────┤<───────────────────────────┤
     │  [all pending leads]│                            │
     │                     │                            │
     │ PATCH /inquiries/{id}│                            │
     │ {status: BOOKED}    │                            │
     ├────────────────────>│  UPDATE Inquiry status     │
     │                     ├───────────────────────────>│
     │<────────────────────┤<───────────────────────────┤
     │                     │                            │
     │ POST /bookings      │                            │
     │ {inquiryId, amount} │                            │
     ├────────────────────>│  [TRANSACTION START]       │
     │                     │  - create Booking          │
     │                     ├───────────────────────────>│
     │                     │  - update Inquiry status   │
     │                     ├───────────────────────────>│
     │<────────────────────┤<───────────────────────────┤
     │  {booking confirmed}│  [TRANSACTION COMMIT]      │
     │                     │                            │

CUSTOMER RETRIEVES OWN BOOKINGS (BROKEN)
────────────────────────────────────────────────

FT Frontend                backend
     │                         │
     │  GET /users/bookings    │
     │  (with Bearer token)    │
     ├────────────────────────>│  
     │<────────────────────────┤
     │  ❌ 404 NOT FOUND       │
     │     Endpoint doesn't exist!
     │
SHOULD CALL:
     │  GET /api/bookings/me   │
     ├────────────────────────>│  with JWT Bearer token
     │                         │  Protected route
     │<────────────────────────┤  Returns user's bookings
```

---

## JWT Token Lifecycle

```
1. GENERATION (Login)
   ─────────────────
   Backend: authController.ts
   
   const token = jwt.sign(
     { id: user.id },                          ← Only contains user ID
     process.env.JWT_SECRET,
     { expiresIn: '30d' }
   );
   
   Returns: 
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "expiresIn": "30 days"
   }

2. STORAGE (Frontend)
   ──────────────────
   ADMIN-PANEL:
   - localStorage.setItem('admin_token', token)
   
   FT:
   - localStorage.setItem('token', token)

3. SENDING (API Request)
   ─────────────────────
   Authorization: Bearer <token>
   
   ADMIN-PANEL (api.ts interceptor):
   │
   └─> const token = localStorage.getItem('admin_token');
       if (token) 
         config.headers.Authorization = `Bearer ${token}`;

4. VERIFICATION (Protected Routes)
   ───────────────────────────────
   Backend: authMiddleware.ts protect()
   
   const token = req.headers.authorization.split(' ')[1];
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   
   // decoded = { id: "uuid-here" }
   
   // Look up in DB
   let user = await prisma.user.findUnique({ where: { id: decoded.id } });
   if (!user) {
     user = await prisma.traveler.findUnique({ where: { id: decoded.id } });
   }
   
   req.user = user;  // { id, name, email, role }
   next();

5. EXPIRY HANDLING
   ──────────────
   ADMIN-PANEL (api.ts interceptor):
   │
   └─> if (err.response?.status === 401) {
         localStorage.removeItem('admin_token');
         window.location.href = '/admin/login';
       }
```

---

## Authentication Flow Comparison

```
TRAVELER/CUSTOMER AUTH
──────────────────────
1. POST /api/auth/register
   ├─ Hash password with bcryptjs
   ├─ Create Traveler record
   └─ Return JWT token
   
2. POST /api/auth/login {email, password, type: 'traveler'}
   ├─ Find Traveler by email
   ├─ Compare password hash
   ├─ Sign JWT with traveler.id
   └─ Return token
   
3. Protected routes accept traveler JWT
   ├─ GET /api/bookings/me (fetch own bookings)
   ├─ GET /api/inquiries/me (fetch own inquiries)
   └─ Can't access admin functions


ADMIN/AGENT AUTH
────────────────
1. No public registration
   (Admins pre-created in database)

2. POST /api/auth/login {email, password, type: 'admin'}
   ├─ Find User by email
   ├─ Compare password hash
   ├─ Sign JWT with user.id
   └─ Return user.role ('ADMIN' or 'AGENT')
   
3. Protected routes check role
   ├─ GET /api/inquiries (protected, sees all)
   ├─ POST /api/bookings (protected, creates)
   └─ adminOnly middleware enforces user.role === 'ADMIN'
      (currently UNUSED in most routes)


ACTUAL BEHAVIOR vs INTENDED
────────────────────────────
ADMIN-PANEL calls:
  POST /api/admin/login
  ↓ (doesn't exist!)

Backend has:
  POST /api/auth/login {type: 'admin'}
  
MISMATCH: Either fix frontend call or add middleware endpoint
```

---

## Database Relationships

```
┌─────────┐         ┌────────┐         ┌──────────┐
│  User   │         │ Traveler│         │  Trip    │
├─────────┤         ├────────┤         ├──────────┤
│ id (PK) │         │ id (PK)│         │ id (PK)  │
│ name    │         │ name   │         │ title    │
│ email* │         │ email*│         │ slug*   │
│ password│         │password│         │ price    │
│ role    │─┐       │ ...    │         │ location │
│ ...     │ │       └────────┘         │ images[] │
└─────────┘ │            ▲             │ ...      │
            │            │             └──────────┘
            │            │             ▲
            │      ┌──────┴─────┐      │
            │      │ Traveler_id│      │
            │      │            │      │
            │  ┌─────────────┐  │  ┌────────────┐
            │  │  Booking    │  │  │ Inquiry    │
            │  ├─────────────┤  │  ├────────────┤
            │  │ id (PK)     │  │  │ id (PK)    │
            │  │ inquiryId*  │──┼──│ tripId*    │
            │  │ travelerId* │──┘  │ trip       │──→ Trip
            │  │ totalAmount │     │ name       │
            │  │ paymentStatus      │ email      │
            │  │ travelers   │     │ status     │
            │  └─────────────┘     │ assignedTo*│──┐
            │       ▲              │ notes      │  │
            │       │              │ source     │  │
            │       └──────────────────────────┘  │
            └────────────────────────────────────────┘
            (Inquiry.admin ← User.id)

Legend:
  * = Unique constraint
  * = Foreign Key reference
  [] = JSON array
```

---

## Current Integration Status Matrix

```
Component           Ready?  Notes
───────────────────────────────────────────────────────────────
Backend             ⚠️ Partial - Missing endpoints & routes
├─ Auth routes      ⚠️ Partial - Works but frontend expects different path
├─ Trip CRUD        ⚠️ Partial - Read works, Create/Update/Delete broken
├─ Inquiry CRUD     ⚠️ Partial - Create/Read work, Update incomplete
├─ Booking CRUD     ⚠️ Partial - Create/Read work, Update/Delete missing
├─ Validation       ❌ None  - No input validation
└─ Error handling   ⚠️ Weak  - Exposes internal errors

ADMIN-PANEL         ❌ Broken - Can't login (405/404 on /admin/login)
├─ Auth             ❌ Broken - Wrong endpoint path
├─ Dashboard        ❌ Broken - Missing /admin/stats endpoint
├─ Trips page       ⚠️ Partial - Can list, edit/delete fail
├─ Bookings page    ⚠️ Partial - Can list, edit/delete fail
├─ Inquiries page   ✅ Works  - Can list and update status
└─ Other pages      ⚠️ Partial - Many call unimplemented endpoints

FT Frontend         ❌ Broken - Wrong port + missing endpoints
├─ Auth flow        ⚠️ Partial - Registration works, login ok
├─ Tour listing     ✅ Works  - Can browse tours
├─ Tour detail      ✅ Works  - Can view details
├─ Inquiry submit   ✅ Works  - Can submit inquiry
├─ My Trips         ❌ Broken - Calls /users/bookings (doesn't exist)
├─ Port config      ❌ Wrong  - Points to 8888 (no API there)
└─ User profile     ❌ Broken - Calls /users/me (doesn't exist)

Database            ✅ Works  - Schema defined, Prisma configured
├─ PostgreSQL       ✅ Ready  - Connection string in .env
└─ Migrations       ⏳ Pending- Need to run prisma migrate

Port 8888           ❓ Unknown- Is this proxy configured? Running?
Auth Token          ✅ Works  - JWT generation, verification functional
Cloudinary          ⏳ Pending- Configured in .env but not in use
```

---

## What Works vs What Doesn't

```
✅ WORKS
────────
- Traveler registration and login
- Viewing list of trips
- Submitting inquiry form
- User authentication middleware
- JWT token generation and verification
- Database schema and ORM setup
- Inquiry status updates by admin
- Booking creation from inquiry

❌ DOESN'T WORK
──────────────
- Admin login (wrong endpoint)
- Viewing user's bookings (endpoint doesn't exist)
- Viewing user's inquiries (endpoint doesn't exist)
- Editing/deleting trips
- Editing/deleting bookings
- Dashboard statistics
- Admin profile retrieval
- User profile endpoint

⚠️ PARTIALLY WORKS
──────────────────
- API calls (port mismatch)
- Route protection (not all admin routes protected)
- Trip creation (not admin-only)
- Error handling (exposes internals)
```
