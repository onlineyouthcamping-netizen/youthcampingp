import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '../../backend/node_modules/@prisma/client';
import bcrypt from 'bcryptjs';

const { assertMutatingTestSafety } = require('../../backend/src/utils/testSafety');
assertMutatingTestSafety();

const app = require('../../backend/src/app');
const prisma = new PrismaClient();

let adminToken: string;
let testBookingId: string = 'TEST-VERIF-PERF-1';

describe('Verification Queue and Status Performance Optimization', () => {
  beforeAll(async () => {
    const verif = await prisma.bookingVerification.findFirst({ where: { bookingId: testBookingId } });
    if (verif) {
      await prisma.bookingVerificationLog.deleteMany({ where: { bookingVerificationId: verif.id } });
    }
    await prisma.bookingVerification.deleteMany({
      where: { bookingId: testBookingId }
    });
    await prisma.booking.deleteMany({
      where: { bookingId: testBookingId }
    });
    await prisma.admin.deleteMany({
      where: { email: 'admin@verifperf.com' }
    });
    await prisma.trip.deleteMany({
      where: { id: 'TEST-TRIP-VERIF-1' }
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('pass123', salt);

    await prisma.admin.create({
      data: {
        id: 'admin_verifperf_1',
        name: 'Admin Verif Perf',
        email: 'admin@verifperf.com',
        password: hashedPassword,
        role: 'admin',
        tenantId: 'default'
      }
    });

    await prisma.trip.create({
      data: {
        id: 'TEST-TRIP-VERIF-1',
        title: 'Trip Verif',
        slug: 'trip-verif-1',
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
        tripId: 'TEST-TRIP-VERIF-1',
        tripName: 'Trip Verif',
        name: 'John Doe',
        fullName: 'Johnathan Doe',
        phone: '9876543210',
        totalAmount: 10000,
        amount: 10000,
        tenantId: 'default'
      }
    });

    await prisma.bookingVerification.create({
      data: {
        bookingId: testBookingId,
        status: 'PENDING_VERIFICATION',
        tenantId: 'default'
      }
    });

    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@verifperf.com', password: 'pass123' });
    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    const verif = await prisma.bookingVerification.findFirst({ where: { bookingId: testBookingId } });
    if (verif) {
      await prisma.bookingVerificationLog.deleteMany({ where: { bookingVerificationId: verif.id } });
    }
    await prisma.bookingVerification.deleteMany({
      where: { bookingId: testBookingId }
    });
    await prisma.booking.deleteMany({
      where: { bookingId: testBookingId }
    });
    await prisma.admin.deleteMany({
      where: { email: 'admin@verifperf.com' }
    });
    await prisma.trip.deleteMany({
      where: { id: 'TEST-TRIP-VERIF-1' }
    });
    await prisma.$disconnect();
  });

  it('GET /api/booking-verifications/queue should return narrow payload without heavy passengers JSON or log loops', async () => {
    const response = await request(app)
      .get('/api/booking-verifications/queue?page=1&limit=15')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.verifications).toBeDefined();
    expect(response.body.data.pagination).toBeDefined();

    const target = response.body.data.verifications.find((v: any) => v.bookingId === testBookingId);
    if (target) {
      expect(target.booking.passengers).toBeUndefined();
      expect(target.logs).toBeUndefined();
    }
  });

  it('GET /api/booking-verifications/:bookingId/status should return lightweight verification status', async () => {
    const response = await request(app)
      .get(`/api/booking-verifications/${testBookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.bookingId).toBe(testBookingId);
    expect(response.body.data.verification).toBeDefined();
  });
});
