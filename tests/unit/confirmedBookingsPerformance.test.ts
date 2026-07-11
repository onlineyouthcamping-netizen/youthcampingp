import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '../../backend/node_modules/@prisma/client';
import bcrypt from 'bcryptjs';

const { assertMutatingTestSafety } = require('../../backend/src/utils/testSafety');
assertMutatingTestSafety();

const app = require('../../backend/src/app');
const prisma = new PrismaClient();

let adminToken: string;
let salesToken: string;
let testBookingId: string = 'TEST-CONF-PERF-1';

describe('Confirmed Bookings Performance and Security Optimization', () => {
  beforeAll(async () => {
    await prisma.booking.deleteMany({
      where: { bookingId: { in: [testBookingId, 'TEST-CONF-PERF-2'] } }
    });
    await prisma.admin.deleteMany({
      where: { email: { in: ['admin@confperf.com', 'sales@confperf.com'] } }
    });
    await prisma.trip.deleteMany({
      where: { id: 'TEST-TRIP-CONF-1' }
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('pass123', salt);

    const admin = await prisma.admin.create({
      data: {
        id: 'admin_confperf_1',
        name: 'Admin Conf Perf',
        email: 'admin@confperf.com',
        password: hashedPassword,
        role: 'admin',
        tenantId: 'default'
      }
    });

    const sales = await prisma.admin.create({
      data: {
        id: 'sales_confperf_1',
        name: 'Sales Conf Perf',
        email: 'sales@confperf.com',
        password: hashedPassword,
        role: 'sales',
        tenantId: 'default'
      }
    });

    await prisma.trip.create({
      data: {
        id: 'TEST-TRIP-CONF-1',
        title: 'Trip Conf',
        slug: 'trip-conf-1',
        location: 'Manali',
        price: 10000,
        duration: '3 days',
        description: 'Test trip',
        tenantId: 'default'
      }
    });

    await prisma.booking.create({
      data: {
        bookingId: testBookingId,
        tripId: 'TEST-TRIP-CONF-1',
        tripName: 'Trip Conf',
        status: 'confirmed',
        name: 'Alice Traveler',
        fullName: 'Alice Traveler',
        phone: '9876543210',
        totalAmount: 10000,
        amount: 10000,
        salesAdminId: admin.id,
        tenantId: 'default',
        passengers: JSON.stringify({ details: { passport: '123' }, items: [1, 2, 3] })
      }
    });

    await prisma.booking.create({
      data: {
        bookingId: 'TEST-CONF-PERF-2',
        tripId: 'TEST-TRIP-CONF-1',
        tripName: 'Trip Conf',
        status: 'confirmed',
        name: 'Bob Sales Traveler',
        fullName: 'Bob Sales Traveler',
        phone: '9876543211',
        totalAmount: 12000,
        amount: 12000,
        salesAdminId: sales.id,
        tenantId: 'default'
      }
    });

    const adminLogin = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@confperf.com', password: 'pass123' });
    adminToken = adminLogin.body.data.token;

    const salesLogin = await request(app)
      .post('/api/admin/login')
      .send({ email: 'sales@confperf.com', password: 'pass123' });
    salesToken = salesLogin.body.data.token;
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({
      where: { bookingId: { in: [testBookingId, 'TEST-CONF-PERF-2'] } }
    });
    await prisma.admin.deleteMany({
      where: { email: { in: ['admin@confperf.com', 'sales@confperf.com'] } }
    });
    await prisma.trip.deleteMany({
      where: { id: 'TEST-TRIP-CONF-1' }
    });
    await prisma.$disconnect();
  });

  it('GET /api/bookings?status=confirmed should return narrow table-required fields without heavy passengers JSON blob', async () => {
    const response = await request(app)
      .get('/api/bookings?status=confirmed&page=1&limit=25')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.pagination).toBeDefined();

    const target = response.body.data.find((b: any) => b.bookingId === testBookingId);
    expect(target).toBeDefined();
    expect(target.passengers).toBeUndefined();
    expect(target.name).toBe('Alice Traveler');
    expect(target.status).toBe('confirmed');
  });

  it('GET /api/bookings?status=confirmed should enforce sales ownership restriction', async () => {
    const response = await request(app)
      .get('/api/bookings?status=confirmed&page=1&limit=25')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    const bookings = response.body.data;
    const adminBooking = bookings.find((b: any) => b.bookingId === testBookingId);
    const salesBooking = bookings.find((b: any) => b.bookingId === 'TEST-CONF-PERF-2');

    expect(adminBooking).toBeUndefined();
    expect(salesBooking).toBeDefined();
  });
});
