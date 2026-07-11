import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '../../backend/node_modules/@prisma/client';
import bcrypt from 'bcryptjs';

const { assertMutatingTestSafety } = require('../../backend/src/utils/testSafety');
assertMutatingTestSafety();

const app = require('../../backend/src/app');
const prisma = new PrismaClient();

let adminTokenTenant1: string;
let adminTokenTenant2: string;
let tripIdTenant1: string = 'TEST-TRIP-DEP-1';

describe('Departures API Security and Tenant Scoping', () => {
  beforeAll(async () => {
    // 1. Cleanup old test data
    await prisma.admin.deleteMany({
      where: { email: { in: ['admin1@depsecurity.com', 'admin2@depsecurity.com'] } }
    });
    await prisma.trip.deleteMany({
      where: { id: { in: [tripIdTenant1, 'TEST-TRIP-DEP-2'] } }
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('pass123', salt);

    // 2. Create admins for two different tenants
    const admin1 = await prisma.admin.create({
      data: {
        id: 'admin_depsec_1',
        name: 'Admin Tenant 1',
        email: 'admin1@depsecurity.com',
        password: hashedPassword,
        role: 'admin',
        tenantId: 'tenant1'
      }
    });

    const admin2 = await prisma.admin.create({
      data: {
        id: 'admin_depsec_2',
        name: 'Admin Tenant 2',
        email: 'admin2@depsecurity.com',
        password: hashedPassword,
        role: 'admin',
        tenantId: 'tenant2'
      }
    });

    // 3. Create a trip belonging to Tenant 1
    await prisma.trip.create({
      data: {
        id: tripIdTenant1,
        title: 'Trip Tenant 1',
        slug: 'trip-tenant-1',
        location: 'Manali',
        price: 12000,
        duration: '4 days',
        description: 'Trip with departures',
        tenantId: 'tenant1',
        availableDates: JSON.stringify(['2026-06-28', '2026-07-11'])
      }
    });

    // 4. Log in both admins to get tokens
    const login1 = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin1@depsecurity.com', password: 'pass123' });
    adminTokenTenant1 = login1.body.data.token;

    const login2 = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin2@depsecurity.com', password: 'pass123' });
    adminTokenTenant2 = login2.body.data.token;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.admin.deleteMany({
      where: { email: { in: ['admin1@depsecurity.com', 'admin2@depsecurity.com'] } }
    });
    await prisma.trip.deleteMany({
      where: { id: { in: [tripIdTenant1, 'TEST-TRIP-DEP-2'] } }
    });
    await prisma.$disconnect();
  });

  it('should return 200 and available dates for authorized user and valid trip ID (canonical identifier)', async () => {
    const response = await request(app)
      .get(`/api/trips/${tripIdTenant1}/departures`)
      .set('Authorization', `Bearer ${adminTokenTenant1}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(['2026-06-28', '2026-07-11']);
  });

  it('should return 404 for a trip that does not exist globally', async () => {
    const response = await request(app)
      .get('/api/trips/NON-EXISTENT-TRIP/departures')
      .set('Authorization', `Bearer ${adminTokenTenant1}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('should return 403 Forbidden for a trip belonging to another tenant', async () => {
    const response = await request(app)
      .get(`/api/trips/${tripIdTenant1}/departures`)
      .set('Authorization', `Bearer ${adminTokenTenant2}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });
});
