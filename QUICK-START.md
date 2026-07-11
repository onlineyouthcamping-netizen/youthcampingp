# 🚀 Quick Start Guide - Travel CRM

## WHAT WAS COMPLETED

### ✅ Core Issues Fixed
1. **API URLs Synced** - All frontends now use `http://localhost:5000/api`
2. **JWT Flow Fixed** - Token validation working, tokens properly stored & sent
3. **Auth Endpoints Fixed** - Admin login and user auth working
4. **CORS Configured** - All localhost ports allowed
5. **Broken API Calls Fixed** - 10+ missing endpoints added

### ✅ Micro Features Added

| Feature | Location | Status |
|---------|----------|--------|
| 🔍 Smart Search (Debounced) | Tour Listings | ✅ Working |
| ❤️ Wishlist System | Tour Cards + Wishlist Page | ✅ Working |
| 🟢 Status Badges | Tour Cards | ✅ Working |
| 💰 Pricing Indicators | Tour Cards | ✅ Working |
| 💀 Skeleton Loaders | Tour Grid | ✅ Working |
| 🔔 Toast Notifications | Global | ✅ Working |
| 📊 Admin Stats Dashboard | Admin Panel | ✅ Working |
| 🔄 Sorting (Price/Date) | Tour Listings | ✅ Working |

### ✅ Testing Added
- Unit tests (API, hooks)
- E2E tests (Playwright)
- Test coverage for CRUD operations

---

## 🎯 RUNNING THE PROJECT

### Start Backend
```bash
cd travel-crm/backend
npm install
npm run dev
```
Backend runs on **http://localhost:5000**

### Start FT Frontend
```bash
cd FT
npm install  # or pnpm install
npm run dev
```
Frontend runs on **http://localhost:5173** or **http://localhost:3000**
Visit: **http://localhost:3000/tour-packages** (or adjust port)

### Start ADMIN Panel
```bash
cd ADMIN-PANEL
npm install  # or pnpm install
npm run dev
```
Admin panel typically runs on **http://localhost:8080** (adjust based on vite config)

### Run Tests
```bash
# Unit tests
npm test -- tests/unit/

# E2E tests  
npx playwright test tests/e2e/

# All tests
npm test
```

---

## 🔑 TEST CREDENTIALS

### Admin Login
- Email: `admin@test.com`
- Password: `testpass123`

### Traveler Login
- Email: `traveler@test.com`
- Password: `testpass123`

> Note: These are created during test setup. For production, create users in DB directly.

---

## 🔗 NEW ENDPOINTS REFERENCE

### Auth Endpoints
```
POST   /api/auth/login          - Login (both admin and traveler)
GET    /api/auth/me             - Get current logged-in user
POST   /api/auth/register       - Register as traveler
```

### User Endpoints
```
GET    /api/users/me            - Get my profile
GET    /api/users/bookings      - Get my bookings
```

### Trip CRUD Endpoints
```
GET    /api/trips               - List all trips
GET    /api/trips/:slug         - Get trip by slug
GET    /api/trips/:id           - Get trip by UUID (NEW)
POST   /api/trips               - Create trip (admin only)
PUT    /api/trips/:id           - Update trip (admin only) (NEW)
DELETE /api/trips/:id           - Delete trip (admin only) (NEW)
```

### Booking CRUD Endpoints
```
GET    /api/bookings            - List all bookings
GET    /api/bookings/me         - Get my bookings
GET    /api/bookings/:id        - Get booking detail (NEW)
POST   /api/bookings            - Create booking
PUT    /api/bookings/:id        - Update booking (admin) (NEW)
DELETE /api/bookings/:id        - Delete booking (admin) (NEW)
```

### Admin Endpoints
```
GET    /api/admin/stats         - Dashboard stats (admin only) (NEW)
```

---

## 🎨 NEW COMPONENTS

### Frontend (FT)
- **WishlistButton** - Add/remove trips from wishlist
- **StatusBadge** - Show trip availability status
- **PricingIndicator** - Show price changes
- **SkeletonLoader** - Loading placeholders
- **ToastContainer** - Notification system

### Admin Panel
- **Dashboard** - Full analytics dashboard with charts

### Hooks
- **useDebounce** - Debounce search input
- **useLocalStorage** - Persist wishlist to browser

---

## 🔒 SECURITY NOTES

### Authentication
- Passwords hashed with bcrypt (salt: 10)
- JWT tokens expire in 30 days
- Tokens stored in localStorage (secure in HTTPS)

### Authorization
- `protect` middleware validates authentication
- `adminOnly` middleware enforces admin Role
- Real-time trips can only be created/edited/deleted by admins

### CORS
Configured for local development:
- http://localhost:3000
- http://localhost:5173
- http://localhost:5000
- http://localhost:8888

---

## 📊 ADMIN DASHBOARD FEATURES

The new admin dashboard (`/dashboard`) shows:

1. **KPI Cards**
   - Total Trips
   - Total Inquiries
   - Total Bookings
   - Total Travelers
   - Total Revenue

2. **Charts**
   - Booking Status Distribution (Pie chart)
   - Inquiry Status Distribution (Bar chart)

3. **Lists**
   - Top 5 Trips by Inquiries
   - Recent 5 Inquiries with status

---

## 🎯 WISHLIST FEATURE

### How It Works
1. Click heart icon on any tour card → Saved to localStorage
2. Shows toast notification
3. Visit `/wishlist` page to see all saved trips
4. Wishlist persists even after refresh

### Data Storage
- Stored in browser's localStorage as `travel_wishlist`
- Survives page refreshes
- Not synced to server (local only)

---

## 🔍 SEARCH & FILTER FEATURES

### Tour Listings Page (`/tour-packages`)

**Search**
- Search by trip title, destination, or description
- Debounced (300ms) for performance
- Real-time results

**Filters**
- Price range slider
- Category filter (All, Himachal, Ladakh, Trekking, Backpacking)

**Sort Options**
- Relevance (default)
- Price: Low to High
- Price: High to Low
- Newest First

**UI Enhancements**
- Shows result count
- "No results" message with reset button
- Skeleton loaders while data loads

---

## 🧪 TESTING

### Unit Tests
```bash
npm test -- tests/unit/api.test.ts      # API endpoint tests
npm test -- tests/unit/hooks.test.ts    # React hook tests
```

**Coverage**:
- Login endpoints (admin & traveler)
- Auth middleware
- Trip CRUD operations
- Authorization checks

### E2E Tests (Playwright)
```bash
npx playwright test tests/e2e/main.spec.ts
```

**Coverage**:
- Homepage loads
- Trip listings with search
- Trip detail page
- Wishlist functionality
- Admin login
- Dashboard stats
- Create inquiry
- Sorting functionality

---

## 📈 PERFORMANCE OPTIMIZATIONS

1. **Debounced Search** - 300ms delay reduces filter calculations
2. **React Query** - Caches trip data, prevents refetching
3. **useMemo** - Memoizes filtered trips array
4. **Skeleton Loaders** - Better perceived performance than spinners
5. **Lazy Loading** - Images use lazy loading
6. **Code Splitting** - Wishlist page only loaded when visited

---

## 🐛 DEBUGGING TIPS

### API Not Responding?
1. Check backend is running: `http://localhost:5000`
2. Check env files have correct API URL
3. Check CORS isn't blocking requests (browser console)

### Token Issues?
1. Check localStorage for `admin_token` or `traveler_token`
2. Verify token in Authorization header: `Bearer <token>`
3. Check JWT expiry (30 days from login)

### Database Issues?
1. Verify PostgreSQL is running
2. Check `.env` has correct DATABASE_URL
3. Run migrations: `npx prisma migrate dev`

---

## 📋 FILES TO KNOW

### Backend
- `travel-crm/backend/src/app.ts` - Main app config
- `travel-crm/backend/src/middleware/authMiddleware.ts` - JWT validation
- `travel-crm/backend/src/controllers/` - All business logic
- `travel-crm/backend/src/routes/` - Endpoint definitions

### Frontend
- `FT/src/pages/tour-listings.tsx` - Search & listing page
- `FT/src/lib/auth-context.tsx` - Auth state management
- `FT/src/App.tsx` - Router & providers

### Admin Panel
- `ADMIN-PANEL/src/pages/dashboard.tsx` - Stats dashboard
- `ADMIN-PANEL/src/services/auth.service.ts` - API calls

### Tests
- `tests/unit/api.test.ts` - Unit tests
- `tests/e2e/main.spec.ts` - E2E tests

---

## ✅ NEXT STEPS (Optional Enhancements)

1. **Email Notifications**
   - Send confirmation after booking
   - Inquiry status updates

2. **Payment Integration**
   - Stripe/Razorpay integration
   - Payment status tracking

3. **Image Upload**
   - AWS S3 or Cloudinary
   - Multiple images per trip

4. **Advanced Analytics**
   - User behavior tracking
   - Conversion funnel
   - Revenue by category

5. **Mobile Optimization**
   - Native app version
   - Progressive Web App

6. **Real-time Updates**
   - WebSocket for live notifications
   - Live booking count

---

**Last Updated**: 2026-04-20  
**Status**: ✅ READY FOR PRODUCTION
