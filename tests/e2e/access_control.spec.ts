import { test, expect } from '@playwright/test';
import { PrismaClient } from '../../backend/node_modules/@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const {
  assertMutatingTestSafety,
  requireEnvironmentValue,
} = require('../../backend/src/utils/testSafety');
const API_URL = assertMutatingTestSafety({
  apiUrl: requireEnvironmentValue('TEST_API_URL')
});
const ADMIN_URL = 'http://localhost:8080';
const JWT_SECRET = requireEnvironmentValue('JWT_SECRET');
const prisma = new PrismaClient();

function createToken(id: string, role: string, tenantId = 'default', tokenVersion = 0) {
  return jwt.sign({ id, role, tenantId, tokenVersion }, JWT_SECRET, { expiresIn: '1d' });
}

test.describe('Access Control & RBAC System Tests', () => {
  let superadminUser: any;
  let adminUser: any;
  let sales1User: any;
  let sales2User: any;
  let operationsUser: any;
  let financeUser: any;
  let guideUser: any;
  let viewerUser: any;

  let testTrip: any;
  let testBookingSales1: any;
  let testBookingSales2: any;

  test.beforeAll(async () => {
    // Clean up any existing test bookings, trip assignments, trips, and admins to prevent duplicates/leaks
    await prisma.booking.deleteMany({
      where: {
        bookingId: { in: ['BK-SALES1-TEST', 'BK-SALES2-TEST'] }
      }
    });

    const existingTrip = await prisma.trip.findUnique({
      where: { slug: 'rbac-test-expedition' }
    });

    if (existingTrip) {
      await prisma.tripAssignment.deleteMany({
        where: { tripId: existingTrip.id }
      });
      await prisma.trip.delete({
        where: { id: existingTrip.id }
      });
    }

    await prisma.admin.deleteMany({
      where: {
        email: {
          in: [
            'test-superadmin@youthcamping.in',
            'test-admin@youthcamping.in',
            'test-sales1@youthcamping.in',
            'test-sales2@youthcamping.in',
            'test-operations@youthcamping.in',
            'test-finance@youthcamping.in',
            'test-guide@youthcamping.in',
            'test-viewer@youthcamping.in'
          ]
        }
      }
    });

    const hashedPassword = await bcrypt.hash('testpass123', 10);

    // Create a generic test trip
    testTrip = await prisma.trip.create({
      data: {
        title: 'RBAC Test Expedition',
        slug: 'rbac-test-expedition',
        description: 'Trip for testing access controls',
        heroImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        price: 15000,
        location: 'Spiti',
        duration: '7 Days',
        category: 'Expeditions',
        images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb'],
        inclusions: ['Stay', 'Meals'],
        exclusions: ['Personal Expenses'],
        availableDates: ['2026-07-20'],
        variants: [
          {
            location: 'Delhi',
            duration: '7 Days',
            originalPrice: 15000,
            discountedPrice: 15000,
            image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
          }
        ],
        travelOptions: [{ label: 'Volvo Bus', priceDelta: 0 }],
        roomOptions: [{ label: 'Triple Sharing', priceDelta: 0 }],
        addons: [],
        status: 'published',
        tenantId: 'default'
      }
    });

    // Create test accounts
    superadminUser = await prisma.admin.create({
      data: { name: 'RBAC Superadmin', email: 'test-superadmin@youthcamping.in', password: hashedPassword, role: 'superadmin', tenantId: 'default' }
    });

    adminUser = await prisma.admin.create({
      data: { name: 'RBAC Admin', email: 'test-admin@youthcamping.in', password: hashedPassword, role: 'admin', tenantId: 'default' }
    });

    sales1User = await prisma.admin.create({
      data: { name: 'RBAC Sales 1', email: 'test-sales1@youthcamping.in', password: hashedPassword, role: 'sales', tenantId: 'default' }
    });

    sales2User = await prisma.admin.create({
      data: { name: 'RBAC Sales 2', email: 'test-sales2@youthcamping.in', password: hashedPassword, role: 'sales', tenantId: 'default' }
    });

    operationsUser = await prisma.admin.create({
      data: { name: 'RBAC Operations', email: 'test-operations@youthcamping.in', password: hashedPassword, role: 'operations', tenantId: 'default' }
    });

    financeUser = await prisma.admin.create({
      data: { name: 'RBAC Finance', email: 'test-finance@youthcamping.in', password: hashedPassword, role: 'finance', tenantId: 'default' }
    });

    guideUser = await prisma.admin.create({
      data: { name: 'RBAC Guide', email: 'test-guide@youthcamping.in', password: hashedPassword, role: 'guide', tenantId: 'default' }
    });

    viewerUser = await prisma.admin.create({
      data: { name: 'RBAC Viewer', email: 'test-viewer@youthcamping.in', password: hashedPassword, role: 'viewer', tenantId: 'default' }
    });

    // Assign guide to trip
    await prisma.tripAssignment.create({
      data: {
        tripId: testTrip.id,
        guideId: guideUser.id,
        tenantId: 'default'
      }
    });

    // Create booking for Sales 1
    testBookingSales1 = await prisma.booking.create({
      data: {
        bookingId: 'BK-SALES1-TEST',
        tripId: testTrip.id,
        tripName: testTrip.title,
        status: 'pending',
        name: 'Sales1 Customer',
        fullName: 'Sales1 Customer',
        age: 25,
        gender: 'Male',
        phone: '9999999991',
        mobile: '9999999991',
        amount: 15000,
        baseAmount: 15000,
        gstAmount: 750,
        totalAmount: 15750,
        advancePaid: 5000,
        remainingAmount: 10750,
        paymentMode: 'UPI',
        paymentStatus: 'Pending',
        salesAdminId: sales1User.id,
        tenantId: 'default',
        passengers: {
          details: {
            trainClass: 'Sleeper',
            ticketStatus: 'Not Booked',
            roomType: 'Triple Sharing'
          },
          persons: []
        }
      }
    });

    // Create booking for Sales 2
    testBookingSales2 = await prisma.booking.create({
      data: {
        bookingId: 'BK-SALES2-TEST',
        tripId: testTrip.id,
        tripName: testTrip.title,
        status: 'pending',
        name: 'Sales2 Customer',
        fullName: 'Sales2 Customer',
        age: 26,
        gender: 'Female',
        phone: '9999999992',
        mobile: '9999999992',
        amount: 15000,
        baseAmount: 15000,
        gstAmount: 750,
        totalAmount: 15750,
        advancePaid: 5000,
        remainingAmount: 10750,
        paymentMode: 'UPI',
        paymentStatus: 'Pending',
        salesAdminId: sales2User.id,
        tenantId: 'default',
        passengers: {
          details: {
            trainClass: 'Sleeper',
            ticketStatus: 'Not Booked',
            roomType: 'Triple Sharing'
          },
          persons: []
        }
      }
    });
  });

  test.afterAll(async () => {
    // Cleanup created records safely
    const bookingIds: string[] = [];
    if (testBookingSales1?.id) bookingIds.push(testBookingSales1.id);
    if (testBookingSales2?.id) bookingIds.push(testBookingSales2.id);

    if (bookingIds.length > 0) {
      await prisma.booking.deleteMany({
        where: { id: { in: bookingIds } }
      });
    }

    if (testTrip?.id) {
      await prisma.tripAssignment.deleteMany({
        where: { tripId: testTrip.id }
      });
    }

    await prisma.admin.deleteMany({
      where: {
        email: {
          in: [
            'test-superadmin@youthcamping.in',
            'test-admin@youthcamping.in',
            'test-sales1@youthcamping.in',
            'test-sales2@youthcamping.in',
            'test-operations@youthcamping.in',
            'test-finance@youthcamping.in',
            'test-guide@youthcamping.in',
            'test-viewer@youthcamping.in'
          ]
        }
      }
    });

    if (testTrip?.id) {
      await prisma.trip.delete({
        where: { id: testTrip.id }
      });
    }
    await prisma.$disconnect();
  });

  // 1. Unauthenticated protected routes return 401
  test('Unauthenticated protected routes return 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/users`);
    expect(res.status()).toBe(401);
  });

  // 2. Superadmin can access all protected modules
  test('Superadmin can access users and audit logs', async ({ request }) => {
    const token = createToken(superadminUser.id, 'superadmin');
    const resUsers = await request.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(resUsers.status()).toBe(200);

    const resAudit = await request.get(`${API_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(resAudit.status()).toBe(200);
  });

  // 3. Admin cannot access users, access-control, roles, or audit logs
  test('Admin cannot access users and audit logs', async ({ request }) => {
    const token = createToken(adminUser.id, 'admin');
    const resUsers = await request.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(resUsers.status()).toBe(403);

    const resAudit = await request.get(`${API_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(resAudit.status()).toBe(403);
  });

  // 4. Sales user can only list their own bookings
  test('Sales user can only list their own bookings', async ({ request }) => {
    const token = createToken(sales1User.id, 'sales');
    const res = await request.get(`${API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const ids = body.data.map((b: any) => b.id);
    expect(ids).toContain(testBookingSales1.id);
    expect(ids).not.toContain(testBookingSales2.id);
  });

  // 5. Sales user requesting another salesperson’s record receives safe 404 or 403
  test('Sales user requesting another sales booking receives 404', async ({ request }) => {
    const token = createToken(sales1User.id, 'sales');
    const res = await request.get(`${API_URL}/bookings/${testBookingSales2.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(404);
  });

  // 6. Sales user cannot access PageBuilder, SEO, settings, payment controls, trip edit endpoints
  test('Sales user cannot edit trips, settings or view pagebuilder', async ({ request }) => {
    const token = createToken(sales1User.id, 'sales');
    
    // PageBuilder view
    const resPageBuilder = await request.get(`${API_URL}/page-builder/home/draft`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(resPageBuilder.status()).toBe(403);

    // Edit Trip
    const resEditTrip = await request.put(`${API_URL}/trips/${testTrip.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Hacked Title' }
    });
    expect(resEditTrip.status()).toBe(403);
  });

  // 7. A public booking request cannot set another person’s salesAdminId
  test('Public booking request cannot arbitrarily set salesAdminId', async ({ request }) => {
    const res = await request.post(`${API_URL}/bookings/create`, {
      data: {
        tripId: testTrip.id,
        fullName: 'Public Traveller',
        age: 30,
        gender: 'Male',
        mobile: '9876543212',
        trainClass: '3AC',
        ticketStatus: 'Not Booked',
        roomType: 'Triple Sharing',
        baseAmount: 15000,
        gstAmount: 750,
        totalAmount: 15750,
        advancePaid: 5000,
        paymentMode: 'UPI',
        paymentStatus: 'Pending',
        departureDate: '2026-07-20',
        salesAdminId: sales2User.id // Attempt to hijack sales attribution
      }
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    const createdBookingId = body.data.id;

    // Verify in DB that salesAdminId is null or ignored
    const bookingInDb = await prisma.booking.findUnique({ where: { id: createdBookingId } });
    expect(bookingInDb?.salesAdminId).toBeNull();

    // Clean up
    await prisma.booking.delete({ where: { id: createdBookingId } });
  });

  // 8. Operations can update room allocation but cannot update price or financial fields
  test('Operations can update room allocation but not basePrice / gst', async ({ request }) => {
    const token = createToken(operationsUser.id, 'operations');
    
    // Attempt allowed update
    const resAllowed = await request.put(`${API_URL}/bookings/${testBookingSales1.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { roomAllocation: 'Room 201' }
    });
    expect(resAllowed.status()).toBe(200);

    // Attempt blocked update (baseAmount/price)
    const resBlocked = await request.put(`${API_URL}/bookings/${testBookingSales1.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { baseAmount: 1000 }
    });
    expect(resBlocked.status()).toBe(403);
  });

  // 9. Finance can update payment status but cannot change base price, tripId, itinerary
  test('Finance can update payment status but not base price or tripId', async ({ request }) => {
    const token = createToken(financeUser.id, 'finance');

    // Attempt allowed update
    const resAllowed = await request.put(`${API_URL}/bookings/${testBookingSales1.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { paymentStatus: 'Paid' }
    });
    expect(resAllowed.status()).toBe(200);

    // Attempt blocked update
    const resBlocked = await request.put(`${API_URL}/bookings/${testBookingSales1.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { baseAmount: 1000 }
    });
    expect(resBlocked.status()).toBe(403);
  });

  // 10. Guide can access only assigned trips
  test('Guide can access assigned trips but not unassigned trips', async ({ request }) => {
    const token = createToken(guideUser.id, 'guide');

    // Assinged trip
    const resAssigned = await request.get(`${API_URL}/trips/${testTrip.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(resAssigned.status()).toBe(200);

    // Create an unassigned trip
    const unassignedTrip = await prisma.trip.create({
      data: {
        title: 'Unassigned Test Trip',
        slug: 'unassigned-test-trip',
        description: 'Trip not assigned to guide',
        heroImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        price: 15000,
        location: 'Spiti',
        duration: '7 Days',
        category: 'Expeditions',
        images: [],
        inclusions: [],
        exclusions: [],
        availableDates: [],
        variants: [],
        travelOptions: [],
        roomOptions: [],
        addons: [],
        status: 'published',
        tenantId: 'default'
      }
    });

    const resUnassigned = await request.get(`${API_URL}/trips/${unassignedTrip.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(resUnassigned.status()).toBe(404);

    // Clean up
    await prisma.trip.delete({ where: { id: unassignedTrip.id } });
  });

  // 11. Guide API responses do not include amount, GST, payment status, balance
  test('Guide API responses strip financial data', async ({ request }) => {
    const token = createToken(guideUser.id, 'guide');

    const res = await request.get(`${API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    
    // Ensure all financial keys are stripped
    const sampleBooking = body.data[0];
    if (sampleBooking) {
      expect(sampleBooking.baseAmount).toBeUndefined();
      expect(sampleBooking.gstAmount).toBeUndefined();
      expect(sampleBooking.totalAmount).toBeUndefined();
      expect(sampleBooking.advancePaid).toBeUndefined();
      expect(sampleBooking.remainingAmount).toBeUndefined();
      expect(sampleBooking.paymentStatus).toBeUndefined();
    }
  });

  // 12. Viewer can read only approved modules and cannot submit create/update/delete calls
  test('Viewer is read-only and cannot mutate resources', async ({ request }) => {
    const token = createToken(viewerUser.id, 'viewer');

    const resRead = await request.get(`${API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(resRead.status()).toBe(200);

    const resMutate = await request.put(`${API_URL}/bookings/${testBookingSales1.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { fullName: 'Viewer Attempt' }
    });
    expect(resMutate.status()).toBe(403);
  });

  // 13. Deactivate a logged-in user and reuse their existing JWT; all protected endpoints must reject access
  test('Deactivated user JWT is rejected immediately', async ({ request }) => {
    const token = createToken(financeUser.id, 'finance');

    // Deactivate user in DB
    await prisma.admin.update({
      where: { id: financeUser.id },
      data: { isActive: false }
    });

    const res = await request.get(`${API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(403);

    // Restore status for cleanup safety
    await prisma.admin.update({
      where: { id: financeUser.id },
      data: { isActive: true }
    });
  });

  // 14. Change a user role and confirm the old JWT stops working due to tokenVersion
  test('Role change increments tokenVersion and revokes old JWT', async ({ request }) => {
    const token = createToken(financeUser.id, 'finance', 'default', financeUser.tokenVersion);

    // Increment tokenVersion in DB (representing a role change or password reset)
    await prisma.admin.update({
      where: { id: financeUser.id },
      data: { 
        role: 'admin',
        tokenVersion: { increment: 1 } 
      }
    });

    const res = await request.get(`${API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(401);
  });

  // 15. Direct URL navigation to blocked admin routes shows Access Denied
  test('Direct URL navigation to blocked admin routes shows Access Denied', async ({ page }) => {
    // Authenticate as a sales user
    const token = createToken(sales1User.id, 'sales', 'default', sales1User.tokenVersion);
    
    await page.goto(`${ADMIN_URL}/admin/login`);
    await page.evaluate((t) => {
      localStorage.setItem('token', t);
    }, token);

    // Navigate directly to user management page (/admin/users)
    await page.goto(`${ADMIN_URL}/admin/users`);
    await page.waitForLoadState('networkidle');

    // Check if redirected to unauthorized page or shows Access Denied heading
    await expect(page.locator('h1')).toContainText(/Access Denied/i);
  });

  // 16. Role changes and payment updates create audit log records
  test('Audit log records are generated on role change', async ({ request }) => {
    const superadminToken = createToken(superadminUser.id, 'superadmin');

    // Trigger role change through API
    const res = await request.put(`${API_URL}/admin/users/${sales1User.id}/role`, {
      headers: { Authorization: `Bearer ${superadminToken}` },
      data: { role: 'viewer' }
    });
    expect(res.status()).toBe(200);

    // Check if audit log was written to DB
    const log = await prisma.auditLog.findFirst({
      where: {
        action: 'role_change',
        entityId: sales1User.id
      }
    });
    expect(log).toBeDefined();
    expect(log?.action).toBe('role_change');
  });

  // 17. Every ownership-sensitive query is tenant-scoped
  test('Ownership and queries are tenant-scoped', async ({ request }) => {
    // Create sales user with different tenantId
    const otherTenantSales = await prisma.admin.create({
      data: {
        name: 'Other Tenant Sales',
        email: 'other-sales@youthcamping.in',
        password: await bcrypt.hash('testpass123', 10),
        role: 'sales',
        tenantId: 'other-tenant'
      }
    });

    const token = createToken(otherTenantSales.id, 'sales', 'other-tenant');

    // Try to get testBookingSales1 (which is on 'default' tenant) using other-tenant sales credentials
    const res = await request.get(`${API_URL}/bookings/${testBookingSales1.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // Should return 404 since it's in a different tenant context
    expect(res.status()).toBe(404);

    // Cleanup
    await prisma.admin.delete({ where: { id: otherTenantSales.id } });
  });
});
