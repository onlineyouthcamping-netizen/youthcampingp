import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '../../backend/node_modules/@prisma/client';
import bcrypt from 'bcryptjs';

const { assertMutatingTestSafety } = require('../../backend/src/utils/testSafety');
assertMutatingTestSafety();

const app = require('../../backend/src/app');
const prisma = new PrismaClient();
let adminToken: string;
let travelerToken: string;
let adminId: string;
let travelerId: string;

describe('Unit/API Tests', () => {
  beforeAll(async () => {
    // Clean up test admin and traveler if they already exist to avoid unique constraint failure
    await prisma.admin.deleteMany({
      where: { OR: [{ email: 'admin@test.com' }, { id: 'test_admin_id_unique' }] }
    });
    await prisma.user.deleteMany({
      where: { email: 'traveler@test.com' }
    });

    // Create test admin with a non-bypass ID so we test real role-checking logic
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('testpass123', salt);
    
    const admin = await prisma.admin.create({
      data: {
        id: 'test_admin_id_unique',
        name: 'Test Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
        tenantId: 'default'
      }
    });
    adminId = admin.id;

    // Create test traveler
    const traveler = await prisma.user.create({
      data: {
        name: 'Test Traveler',
        email: 'traveler@test.com',
        password: hashedPassword,
        phone: '1234567890',
        role: 'user'
      }
    });
    travelerId = traveler.id;
  });

  afterAll(async () => {
    // Cleanup test accounts and test trips to prevent wiping seeded DB data
    await prisma.admin.deleteMany({
      where: { email: 'admin@test.com' }
    });
    await prisma.user.deleteMany({
      where: { email: 'traveler@test.com' }
    });
    await prisma.trip.deleteMany({
      where: { slug: { in: ['test-trip', 'new-test-trip'] } }
    });
    await prisma.$disconnect();
  });

  describe('Auth API - POST /api/auth/login', () => {
    it('should login admin with correct credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@test.com',
          password: 'testpass123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.admin.role).toBe('admin');
      adminToken = response.body.data.token;
    });

    it('should login traveler with correct credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'traveler@test.com',
          password: 'testpass123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      travelerToken = response.body.data.token;
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Auth API - GET /api/auth/me', () => {
    it('should return current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/admin/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('admin');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/admin/me');

      expect(response.status).toBe(401);
    });
  });

  describe('Trips API - GET /api/trips', () => {
    beforeAll(async () => {
      // Cleanup only test trips to avoid unique slug constraint failure without wiping other trips
      await prisma.trip.deleteMany({
        where: { slug: { in: ['test-trip', 'new-test-trip'] } }
      });
      
      // Create test trip
      await prisma.trip.create({
        data: {
          title: 'Test Trip',
          slug: 'test-trip',
          location: 'Himachal',
          price: 10000,
          duration: '5 days',
          description: 'A test trip',
          images: ['image1.jpg'],
          inclusions: ['meals'],
          exclusions: [],
          itinerary: {}
        }
      });
    });

    it('should get all trips', async () => {
      const response = await request(app)
        .get('/api/trips')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Trips API - POST /api/trips', () => {
    it('should create trip only for admins', async () => {
      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'New Test Trip',
          slug: 'new-test-trip',
          location: 'Ladakh',
          price: 15000,
          duration: '7 days',
          description: 'A new test trip',
          images: ['image.jpg'],
          inclusions: [],
          exclusions: [],
          itinerary: {}
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Test Trip');
    });

    it('should deny trip creation for non-admins', async () => {
      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${travelerToken}`)
        .send({
          title: 'Unauthorized Trip',
          location: 'Goa'
        });

      expect(response.status).toBe(403);
    });
  });
});
