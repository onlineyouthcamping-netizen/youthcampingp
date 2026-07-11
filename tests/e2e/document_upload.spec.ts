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
const JWT_SECRET = requireEnvironmentValue('JWT_SECRET');
const prisma = new PrismaClient();

function createToken(id: string, role: string, tenantId = 'default', tokenVersion = 0) {
  return jwt.sign({ id, role, tenantId, tokenVersion }, JWT_SECRET, { expiresIn: '1d' });
}

test.describe('Booking Passenger Document Upload Tests', () => {
  let adminUser: any;
  let sales1User: any;
  let sales2User: any;
  let guideUser: any;

  let adminToken: string;
  let sales1Token: string;
  let sales2Token: string;
  let guideToken: string;

  let testTrip: any;
  let testBookingSales1: any;

  test.beforeAll(async () => {
    // 1. Clean up potential old test data
    await prisma.booking.deleteMany({
      where: {
        bookingId: { in: ['BK-DOC-TEST-1'] }
      }
    });

    const existingTrip = await prisma.trip.findUnique({
      where: { slug: 'doc-test-trip' }
    });
    if (existingTrip) {
      await prisma.tripAssignment.deleteMany({ where: { tripId: existingTrip.id } });
      await prisma.trip.delete({ where: { id: existingTrip.id } });
    }

    await prisma.admin.deleteMany({
      where: {
        email: {
          in: [
            'admin-doc-test@youthcamping.in',
            'sales1-doc-test@youthcamping.in',
            'sales2-doc-test@youthcamping.in',
            'guide-doc-test@youthcamping.in'
          ]
        }
      }
    });

    const hashedPassword = await bcrypt.hash('testpass123', 10);

    // 2. Create admin, sales1, sales2, and guide users
    adminUser = await prisma.admin.create({
      data: { email: 'admin-doc-test@youthcamping.in', password: hashedPassword, name: 'Admin Doc Test', role: 'admin' }
    });
    sales1User = await prisma.admin.create({
      data: { email: 'sales1-doc-test@youthcamping.in', password: hashedPassword, name: 'Sales 1 Doc Test', role: 'sales' }
    });
    sales2User = await prisma.admin.create({
      data: { email: 'sales2-doc-test@youthcamping.in', password: hashedPassword, name: 'Sales 2 Doc Test', role: 'sales' }
    });
    guideUser = await prisma.admin.create({
      data: { email: 'guide-doc-test@youthcamping.in', password: hashedPassword, name: 'Guide Doc Test', role: 'guide' }
    });

    adminToken = createToken(adminUser.id, adminUser.role);
    sales1Token = createToken(sales1User.id, sales1User.role);
    sales2Token = createToken(sales2User.id, sales2User.role);
    guideToken = createToken(guideUser.id, guideUser.role);

    // 3. Create test trip
    testTrip = await prisma.trip.create({
      data: {
        title: 'Doc Test Trip',
        slug: 'doc-test-trip',
        description: 'Trip for testing document uploads',
        heroImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        price: 15000,
        location: 'Manali',
        duration: '6 Days',
        category: 'Trek',
        images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb'],
        inclusions: ['Meals', 'Stay'],
        exclusions: ['Personal Expenses'],
        availableDates: ['2026-07-25'],
        variants: [
          {
            location: 'Delhi',
            duration: '6 Days',
            originalPrice: 15000,
            discountedPrice: 15000,
            image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
          }
        ],
        travelOptions: [{ label: 'Train', priceDelta: 0 }],
        roomOptions: [{ label: 'Quad Sharing', priceDelta: 0 }]
      }
    });

    // 4. Create booking owned by Sales 1
    testBookingSales1 = await prisma.booking.create({
      data: {
        bookingId: 'BK-DOC-TEST-1',
        tripId: testTrip.id,
        tripName: testTrip.title,
        status: 'pending',
        name: 'John Doe',
        fullName: 'John Doe',
        phone: '9999999999',
        mobile: '9999999999',
        email: 'john@example.com',
        amount: 15000,
        totalAmount: 15000,
        remainingAmount: 15000,
        salesAdminId: sales1User.id,
        passengers: {
          persons: [
            { id: 'pax-1', name: 'John Doe', gender: 'Male', age: 30 }
          ]
        }
      }
    });
  });

  test.afterAll(async () => {
    // Cleanup created data
    await prisma.bookingDocument.deleteMany({
      where: { bookingId: testBookingSales1.id }
    });
    await prisma.booking.deleteMany({
      where: { id: testBookingSales1.id }
    });
    if (testTrip) {
      await prisma.tripAssignment.deleteMany({ where: { tripId: testTrip.id } });
      await prisma.trip.delete({ where: { id: testTrip.id } });
    }
    await prisma.admin.deleteMany({
      where: { id: { in: [adminUser.id, sales1User.id, sales2User.id, guideUser.id] } }
    });
    await prisma.$disconnect();
  });

  test('Sales 1 (owner) can upload and view document', async ({ request }) => {
    const boundary = '----PlaywrightBoundary' + Math.random().toString(36).substring(2);
    
    // Construct raw multipart request body for small PDF (under 1MB)
    const content = 'Hello Document Upload';
    const bodyParts = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="document"; filename="passport.pdf"',
      'Content-Type: application/pdf',
      '',
      content,
      `--${boundary}--`
    ].join('\r\n');

    const res = await request.post(`${API_URL}/bookings/${testBookingSales1.id}/passengers/pax-1/document`, {
      headers: {
        'Authorization': `Bearer ${sales1Token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      data: Buffer.from(bodyParts)
    });

    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.originalFileName).toBe('passport.pdf');
    expect(json.data.status).toBe('UPLOADED');

    // Verify Sales 1 can download it
    const downloadRes = await request.get(`${API_URL}/bookings/${testBookingSales1.id}/passengers/pax-1/document`, {
      headers: {
        'Authorization': `Bearer ${sales1Token}`
      }
    });
    expect(downloadRes.status()).toBe(200);
    expect(downloadRes.headers()['content-type']).toContain('application/pdf');
    const downloadedText = await downloadRes.text();
    expect(downloadedText).toBe(content);
  });

  test('Sales 2 (non-owner) is blocked from uploading and viewing', async ({ request }) => {
    const boundary = '----PlaywrightBoundary' + Math.random().toString(36).substring(2);
    const bodyParts = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="document"; filename="id.png"',
      'Content-Type: image/png',
      '',
      'Fake PNG content',
      `--${boundary}--`
    ].join('\r\n');

    // 1. Blocked from uploading
    const uploadRes = await request.post(`${API_URL}/bookings/${testBookingSales1.id}/passengers/pax-1/document`, {
      headers: {
        'Authorization': `Bearer ${sales2Token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      data: Buffer.from(bodyParts)
    });
    expect(uploadRes.status()).toBe(403);

    // 2. Blocked from downloading
    const downloadRes = await request.get(`${API_URL}/bookings/${testBookingSales1.id}/passengers/pax-1/document`, {
      headers: {
        'Authorization': `Bearer ${sales2Token}`
      }
    });
    expect(downloadRes.status()).toBe(403);
  });

  test('Guide is blocked from accessing documents', async ({ request }) => {
    const boundary = '----PlaywrightBoundary' + Math.random().toString(36).substring(2);
    const bodyParts = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="document"; filename="id.png"',
      'Content-Type: image/png',
      '',
      'Fake PNG content',
      `--${boundary}--`
    ].join('\r\n');

    // 1. Blocked from uploading
    const uploadRes = await request.post(`${API_URL}/bookings/${testBookingSales1.id}/passengers/pax-1/document`, {
      headers: {
        'Authorization': `Bearer ${guideToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      data: Buffer.from(bodyParts)
    });
    expect(uploadRes.status()).toBe(403);

    // 2. Blocked from downloading
    const downloadRes = await request.get(`${API_URL}/bookings/${testBookingSales1.id}/passengers/pax-1/document`, {
      headers: {
        'Authorization': `Bearer ${guideToken}`
      }
    });
    expect(downloadRes.status()).toBe(403);
  });

  test('Admin can access and upload/download all documents', async ({ request }) => {
    // 1. Verify Admin can download the document uploaded by Sales 1
    const downloadRes = await request.get(`${API_URL}/bookings/${testBookingSales1.id}/passengers/pax-1/document`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    expect(downloadRes.status()).toBe(200);

    // 2. Verify Admin can replace the document
    const boundary = '----PlaywrightBoundary' + Math.random().toString(36).substring(2);
    const bodyParts = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="document"; filename="admin_passport.pdf"',
      'Content-Type: application/pdf',
      '',
      'Admin Upload Content',
      `--${boundary}--`
    ].join('\r\n');

    const replaceRes = await request.post(`${API_URL}/bookings/${testBookingSales1.id}/passengers/pax-1/document`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      data: Buffer.from(bodyParts)
    });
    expect(replaceRes.status()).toBe(200);
    const json = await replaceRes.json();
    expect(json.data.originalFileName).toBe('admin_passport.pdf');
  });

  test('Files above 1 MB are rejected', async ({ request }) => {
    // Generate a file content > 1 MB (e.g. 1.1 MB)
    const largeContent = 'A'.repeat(1.1 * 1024 * 1024);
    const boundary = '----PlaywrightBoundary' + Math.random().toString(36).substring(2);
    
    const bodyParts = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="document"; filename="large_passport.pdf"',
      'Content-Type: application/pdf',
      '',
      largeContent,
      `--${boundary}--`
    ].join('\r\n');

    const res = await request.post(`${API_URL}/bookings/${testBookingSales1.id}/passengers/pax-1/document`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      data: Buffer.from(bodyParts)
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.message).toBe('File size must be under 1 MB.');
  });
});
