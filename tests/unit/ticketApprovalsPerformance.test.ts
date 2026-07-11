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
let testTicketId: string = 'TEST-TICKET-PERF-1';

describe('Train Ticket Approvals Performance Optimization', () => {
  beforeAll(async () => {
    await prisma.trainTicket.deleteMany({
      where: { id: testTicketId }
    });
    await prisma.booking.deleteMany({
      where: { bookingId: 'TEST-BK-TICKET-1' }
    });
    await prisma.admin.deleteMany({
      where: { email: { in: ['admin@ticketperf.com', 'sales@ticketperf.com'] } }
    });
    await prisma.trip.deleteMany({
      where: { id: 'TEST-TRIP-TICKET-1' }
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('pass123', salt);

    const admin = await prisma.admin.create({
      data: {
        id: 'admin_ticketperf_1',
        name: 'Admin Ticket Perf',
        email: 'admin@ticketperf.com',
        password: hashedPassword,
        role: 'admin',
        tenantId: 'default'
      }
    });

    const sales = await prisma.admin.create({
      data: {
        id: 'sales_ticketperf_1',
        name: 'Sales Ticket Perf',
        email: 'sales@ticketperf.com',
        password: hashedPassword,
        role: 'sales',
        tenantId: 'default'
      }
    });

    await prisma.trip.create({
      data: {
        id: 'TEST-TRIP-TICKET-1',
        title: 'Trip Ticket',
        slug: 'trip-ticket-1',
        location: 'Manali',
        price: 10000,
        duration: '3 days',
        description: 'Test trip',
        tenantId: 'default'
      }
    });

    await prisma.booking.create({
      data: {
        bookingId: 'TEST-BK-TICKET-1',
        tripId: 'TEST-TRIP-TICKET-1',
        tripName: 'Trip Ticket',
        name: 'Ticket Traveler',
        fullName: 'Ticket Traveler',
        phone: '9876543210',
        totalAmount: 10000,
        amount: 10000,
        salesAdminId: admin.id,
        tenantId: 'default'
      }
    });

    await prisma.trainTicket.create({
      data: {
        id: testTicketId,
        bookingId: 'TEST-BK-TICKET-1',
        travelerName: 'Ticket Traveler',
        approvalStatus: 'SUBMITTED',
        ticketStatus: 'PENDING',
        tenantId: 'default',
        submittedByAdminId: sales.id
      }
    });

    const adminLogin = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@ticketperf.com', password: 'pass123' });
    adminToken = adminLogin.body.data.token;

    const salesLogin = await request(app)
      .post('/api/admin/login')
      .send({ email: 'sales@ticketperf.com', password: 'pass123' });
    salesToken = salesLogin.body.data.token;
  });

  afterAll(async () => {
    await prisma.trainTicket.deleteMany({
      where: { id: testTicketId }
    });
    await prisma.booking.deleteMany({
      where: { bookingId: 'TEST-BK-TICKET-1' }
    });
    await prisma.admin.deleteMany({
      where: { email: { in: ['admin@ticketperf.com', 'sales@ticketperf.com'] } }
    });
    await prisma.trip.deleteMany({
      where: { id: 'TEST-TRIP-TICKET-1' }
    });
    await prisma.$disconnect();
  });

  it('GET /api/train-tickets/approvals should return narrow table-required fields without nested history arrays', async () => {
    const response = await request(app)
      .get('/api/train-tickets/approvals?page=1&limit=25&approvalStatus=SUBMITTED')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.pagination).toBeDefined();

    const target = response.body.data.find((t: any) => t.id === testTicketId);
    expect(target).toBeDefined();
    expect(target.history).toBeUndefined();
    expect(target.travelerName).toBe('Ticket Traveler');
    expect(target.approvalStatus).toBe('SUBMITTED');
  });

  it('GET /api/train-tickets/approvals should enforce sales ownership restriction', async () => {
    const response = await request(app)
      .get('/api/train-tickets/approvals?page=1&limit=25&approvalStatus=SUBMITTED')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    const tickets = response.body.data;
    const target = tickets.find((t: any) => t.id === testTicketId);
    expect(target).toBeUndefined();
  });
});
