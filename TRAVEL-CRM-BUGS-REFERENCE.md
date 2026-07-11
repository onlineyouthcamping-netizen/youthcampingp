# Travel CRM - Quick Bug Reference

## 🔴 Critical Issues (Blocking)

### Issue #1: Admin Login Broken
**Symptom**: ADMIN-PANEL login page fails
- **Root Cause**: Calls `/admin/login` endpoint which doesn't exist
- **Backend Reality**: Only `/api/auth/login` exists with `type: 'admin'` parameter
- **Fix Needed**: 
  - Either: Change auth.service.ts to call `/api/auth/login` with `type: 'admin'`
  - Or: Add `/api/admin/login` route to backend that delegates to auth controller

**Files Affected**:
- ❌ [ADMIN-PANEL/src/services/auth.service.ts](ADMIN-PANEL/src/services/auth.service.ts#L6) - calls wrong endpoint
- ❌ [ADMIN-PANEL/src/services/api.ts](ADMIN-PANEL/src/services/api.ts#L1) - shows 401 handling but never gets there

---

### Issue #2: FT Frontend Can't Fetch User Data
**Symptom**: FT "my-trips" page doesn't load bookings; user profile fails
- **Root Cause**: Calls `/users/bookings` and `/users/me` which don't exist in backend
- **Backend Reality**: These endpoints are completely missing

**Files Affected**:
- ❌ [FT/src/pages/my-trips.tsx#L46](FT/src/pages/my-trips.tsx) - `fetch(/users/bookings)`
- ❌ [FT/src/lib/auth-context.tsx#L48](FT/src/lib/auth-context.tsx) - `fetch(/users/me)`

**Fix Needed**: Create these endpoints in backend:
```typescript
// GET /api/users/me - return current user (User or Traveler)
// GET /api/users/bookings - return user's bookings
```

---

### Issue #3: Port Mismatch
**Symptom**: All API calls fail with connection refused/CORS errors
- **Root Cause**: FT expects API at `http://localhost:8888` but backend runs on 5000/5005
- **Uncertain**: Is port 8888 an external gateway? Missing proxy config?

**Files Affected**:
- ⚠️ [FT/.env.local#L3](FT/.env.local) - `VITE_API_URL=http://localhost:8888` (no /api)
- ⚠️ [ADMIN-PANEL/.env#L1](ADMIN-PANEL/.env) - `VITE_API_URL=http://localhost:8888/api`
- ⚠️ [travel-crm/backend/.env#L1](travel-crm/backend/.env) - `PORT=5005`
- ⚠️ [travel-crm/backend/src/server.ts#L3](travel-crm/backend/src/server.ts) - defaults to 5000

**Fix Needed**: Clarify which port is correct and update all configs

---

## 🟠 Medium Issues (Functional)

### Issue #4: Admin Stats Endpoint Missing
**Symptom**: ADMIN-PANEL Dashboard doesn't load
- **Root Cause**: Dashboard calls `GET /admin/stats` which doesn't exist
- **File**: [ADMIN-PANEL/src/services/dashboard.service.ts#L5](ADMIN-PANEL/src/services/dashboard.service.ts)

**Fix Needed**: Create backend endpoint:
```typescript
GET /api/admin/stats
// Return: { inquiriesCount, bookingsCount, tripsCount, revenueTotal, etc }
```

---

### Issue #5: Missing CRUD Operations (Update/Delete)
**Symptom**: Edit/delete buttons in ADMIN-PANEL silently fail
- **Root Cause**: Backend missing PUT/DELETE routes for trips and bookings

**Missing Endpoints**:
```typescript
PUT /api/trips/{id}          // Update trip
DELETE /api/trips/{id}       // Delete trip
PUT /api/bookings/{id}       // Update booking
DELETE /api/bookings/{id}    // Delete booking
```

**Files Affected**:
- [ADMIN-PANEL/src/services/trips.service.ts#L21](ADMIN-PANEL/src/services/trips.service.ts) - calls put/delete
- [ADMIN-PANEL/src/services/bookings.service.ts#L16](ADMIN-PANEL/src/services/bookings.service.ts) - calls put/delete

---

### Issue #6: Trip Lookup Inconsistency
**Symptom**: ADMIN-PANEL trip editors can't load trips by UUID
- **Root Cause**: Backend only provides `GET /api/trips/:slug` but frontend needs by ID

**Files Affected**:
- [ADMIN-PANEL/src/services/trips.service.ts#L11](ADMIN-PANEL/src/services/trips.service.ts) - calls `GET /trips/{id}`

**Fix Needed**: Add route to backend:
```typescript
GET /api/trips/{id}  // Get trip by UUID
```

---

### Issue #7: Trip Creation Not Admin-Protected
**Symptom**: Any authenticated user can create tours
- **Root Cause**: `POST /api/trips` uses `protect` but not `adminOnly` middleware
- **File**: [travel-crm/backend/src/routes/tripRoutes.ts#L8](travel-crm/backend/src/routes/tripRoutes.ts)

**Fix Needed**: Add adminOnly middleware:
```typescript
router.post('/', protect, adminOnly, createTrip);
```

---

### Issue #8: /admin/me Endpoint Missing
**Symptom**: ADMIN-PANEL can't verify current user after login
- **Root Cause**: Service calls `GET /admin/me` which doesn't exist

**Files Affected**:
- [ADMIN-PANEL/src/services/auth.service.ts#L11](ADMIN-PANEL/src/services/auth.service.ts)

**Fix Needed**: Create endpoint or fix to use `/api/auth/me`

---

## 🟡 Low Priority Issues

### Issue #9: Error Exposure (Security)
**Symptom**: Backend returns full error objects to frontend
- **Root Cause**: Controllers do `res.status(500).json({ error })`
- **Risk**: Exposes database schema, internal paths, etc.
- **File**: [travel-crm/backend/src/controllers/](travel-crm/backend/src/controllers/)

**Fix Needed**: Sanitize error responses:
```typescript
catch (error) {
  console.error(error);  // Log full error
  res.status(500).json({ message: 'Server error' });  // Don't expose
}
```

---

### Issue #10: No Input Validation
**Symptom**: Can submit invalid data; Prisma throws errors
- **Root Cause**: No middleware to validate request bodies
- **Files**: All controller files

**Fix Needed**: Add zod/joi validation or express-validator

---

## Route Mapping Reference

### What ADMIN-PANEL Calls vs What Exists

```
ADMIN-PANEL Call          | Backend Route      | Status
--------------------------|-------------------|--------
POST /admin/login         | POST /auth/login   | ❌ BROKEN
GET /admin/me             | ❌ MISSING         | ❌ BROKEN
GET /admin/stats          | ❌ MISSING         | ❌ BROKEN
GET /trips                | GET /trips         | ✅ Works
GET /trips/{id}           | GET /trips/:slug   | ❌ MISMATCH (by slug not ID)
POST /trips               | POST /trips        | ✅ Works  
PUT /trips/{id}           | ❌ MISSING         | ❌ Missing
DELETE /trips/{id}        | ❌ MISSING         | ❌ Missing
GET /inquiries            | GET /inquiries     | ✅ Works
PATCH /inquiries/{id}     | PATCH /inquiries   | ✅ Works
GET /bookings             | GET /bookings      | ✅ Works
POST /bookings            | POST /bookings     | ✅ Works
PUT /bookings/{id}        | ❌ MISSING         | ❌ Missing
DELETE /bookings/{id}     | ❌ MISSING         | ❌ Missing
```

---

## Testing Checklist

- [ ] Verify backend port is actually 5000 or 5005
- [ ] Check if port 8888 is configured somewhere (nginx/proxy)
- [ ] Test `POST /api/auth/login` with `{ email, password, type: 'admin' }`
- [ ] Check JWT secret matches between backend .env and actual token generation
- [ ] Test `GET /api/inquiries` with valid token - does it require admin role?
- [ ] Check if Travels can submit inquiries (public endpoint)
- [ ] Verify `adminOnly` middleware is being imported/exported correctly
- [ ] Test all error cases - do they have proper response codes?
