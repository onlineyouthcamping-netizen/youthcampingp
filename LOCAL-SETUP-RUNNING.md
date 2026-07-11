# 🚀 Travel CRM - LOCAL SETUP RUNNING

## ✅ ALL SERVICES RUNNING

| Service | URL | Status | Port |
|---------|-----|--------|------|
| **Backend API** | http://localhost:5005 | ✅ Running | 5005 |
| **FT Frontend** | http://localhost:3000 | ✅ Running | 3000 |
| **ADMIN Panel** | http://localhost:8081 | ✅ Running | 8081 |

---

## 🎯 QUICK ACCESS LINKS

### Frontend (Travelers)
- **Home**: http://localhost:3000/
- **Browse Trips**: http://localhost:3000/tour-packages
- **My Wishlist**: http://localhost:3000/wishlist
- **My Trips**: http://localhost:3000/my-trips

### Admin Panel (Staff)
- **Dashboard**: http://localhost:8081/dashboard
- **Trips Management**: http://localhost:8081/trips
- **Bookings**: http://localhost:8081/bookings
- **Inquiries**: http://localhost:8081/inquiries

### Backend API (Developers)
- **API Base URL**: http://localhost:5005/api
- **Health Check**: http://localhost:5005/

---

## 📋 TEST CREDENTIALS

Use these to log in and test the system:

### Admin Account
- **Email**: `admin@test.com`
- **Password**: `testpass123`
- **Access**: Admin Panel at http://localhost:8081

### Traveler Account  
- **Email**: `traveler@test.com`
- **Password**: `testpass123`
- **Access**: Frontend at http://localhost:3000

---

## 🔗 API ENDPOINTS (for development)

### Authentication
```
POST   http://localhost:5005/api/auth/login
GET    http://localhost:5005/api/auth/me
POST   http://localhost:5005/api/auth/register
```

### Trips
```
GET    http://localhost:5005/api/trips                    # List all
GET    http://localhost:5005/api/trips/:slug              # By slug
GET    http://localhost:5005/api/trips/:id                # By ID
POST   http://localhost:5005/api/trips                    # Create (admin)
PUT    http://localhost:5005/api/trips/:id                # Update (admin)
DELETE http://localhost:5005/api/trips/:id                # Delete (admin)
```

### Users & Bookings
```
GET    http://localhost:5005/api/users/me                 # User profile
GET    http://localhost:5005/api/users/bookings           # My bookings
GET    http://localhost:5005/api/bookings                 # All bookings (admin)
GET    http://localhost:5005/api/admin/stats              # Dashboard stats (admin)
```

---

## 💻 RUNNING COMMANDS

If you need to restart any service:

### Backend
```bash
cd d:\os\travel-crm\backend
npm run dev
```

### FT Frontend
```bash
cd d:\os\FT\artifacts\tour-packages
npm run dev
```

### Admin Panel
```bash
cd d:\os\ADMIN-PANEL
npm run dev
```

---

## 🧪 TESTING THE SYSTEM

### 1. **Test Frontend (Travelers)**
   -Visit http://localhost:3000
   - Browse trips on `/tour-packages`
   - Add trips to wishlist (heart icon)
   - Visit `/wishlist` to see saved trips
   - Search & filter trips

### 2. **Test Admin Panel**
   - Visit http://localhost:8081
   - Login with admin credentials
   - View dashboard with stats & charts
   - Create/edit/delete trips
   - Manage inquiries and bookings

### 3. **Test API Directly**
   ```bash
   # Login
   curl -X POST http://localhost:5005/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@test.com","password":"testpass123","type":"admin"}'
   
   # List trips
   curl http://localhost:5005/api/trips
   
   # Get stats (with token from login)
   curl http://localhost:5005/api/admin/stats \
     -H "Authorization: Bearer <your_token>"
   ```

---

## 🔄 ENVIRONMENT CONFIGURATION

### FT Frontend (.env.local)
```
VITE_API_URL=http://localhost:5005/api
NEXT_PUBLIC_API_URL=http://localhost:5005/api
```

### Admin Panel (.env)
```
VITE_API_URL=http://localhost:5005/api
NEXT_PUBLIC_API_URL=http://localhost:5005/api
```

### Backend (.env)
```
PORT=5005  (or auto-increment if port in use)
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://...
```

---

## ℹ️ FEATURES AVAILABLE

✅ **Smart Search** - Debounced search on trips  
✅ **Wishlist** - Save trips to localStorage  
✅ **Status Badges** - Available/Sold Out indicators  
✅ **Pricing Indicators** - Early bird & price changes  
✅ **Skeleton Loaders** - Better loading UX  
✅ **Toast Notifications** - Success/error messages  
✅ **Admin Dashboard** - Charts, stats, analytics  
✅ **JWT Authentication** - Secure login  
✅ **CRUD Operations** - Full trip & booking management  

---

## 🆘 TROUBLESHOOTING

### Port Already in Use?
- The services auto-increment to next available port
- Check running services with: `netstat -ano | findstr LISTEN`

### Backend Not Responding?
- Verify it's running: http://localhost:5005
- Check if Database URL is correct in .env
- Run: `cd backend && npm run dev`

### API Calls Failing in Frontend?
- Verify VITE_API_URL in .env files points to 5005
- Check CORS is enabled (should be by default)
- Look at browser console for detailed errors

### Can't Login?
- Verify test credentials are created in database
- Check JWT_SECRET is set in backend .env
- Ensure tokens are stored in localStorage

---

## 📊 SYSTEM STATUS

**Last Updated**: 2026-04-20  
**Backend Status**: ✅ Running on port 5005  
**Frontend Status**: ✅ Running on port 3000  
**Admin Status**: ✅ Running on port 8081  
**Database**: PostgreSQL (Prisma)  
**Tests**: Ready to run (Jest + Playwright)  

---

**Ready to Go!** 🎉

You can now:
- Browse trips as a traveler
- Manage trips as an admin
- Test the API directly
- Check the dashboard analytics
- Run tests locally

Enjoy!
