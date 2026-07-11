import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'isolated_api_test_secret_with_32_characters';

jest.mock('../../backend/src/lib/prisma', () => ({
  prisma: {
    trip: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    admin: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
  },
}));

jest.mock('../../backend/src/utils/auditLogger', () => ({
  logAction: jest.fn().mockResolvedValue(null),
}));

const { prisma } = require('../../backend/src/lib/prisma');
const app = require('../../backend/src/app');

const TEST_EMAIL = 'security-test-admin@example.test';

describe('YouthCamping API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.trip.findMany.mockResolvedValue([]);
    prisma.trip.findFirst.mockResolvedValue(null);
    prisma.admin.findUnique.mockImplementation(({ where }: any) => (
      (where.email === TEST_EMAIL || where.id === 'isolated-test-admin')
        ? Promise.resolve({
            id: 'isolated-test-admin',
            email: TEST_EMAIL,
            password: '$2a$10$AztTcqtGm9FiywzdSz0W9.Ra1yx.XIAPItszeiiBg8G2/7EcCw5.2',
            name: 'Isolated Test Admin',
            role: 'admin',
            tenantId: 'test',
            isActive: true,
            tokenVersion: 0,
          })
        : Promise.resolve(null)
    ));
    prisma.admin.update.mockResolvedValue({});
  });

  describe('Trips API', () => {
    it('should fetch all trips', async () => {
      const token = jwt.sign({ id: 'isolated-test-admin', role: 'admin', tenantId: 'test', tokenVersion: 0 }, process.env.JWT_SECRET as string);
      const response = await request(app)
        .get('/api/trips')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 404 for a non-existent trip', async () => {
      const token = jwt.sign({ id: 'isolated-test-admin', role: 'admin', tenantId: 'test', tokenVersion: 0 }, process.env.JWT_SECRET as string);
      const response = await request(app)
        .get('/api/trips/non-existent-id')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(404);
    });
  });

  describe('Authentication API', () => {
    it('should login successfully with a real mocked account', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({ email: TEST_EMAIL, password: 'isolated-test-password' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should reject signed JWTs for synthetic bypass identities', async () => {
      for (const id of ['root_admin_bypass', 'dev_user']) {
        const token = jwt.sign(
          { id, role: 'superadmin', tenantId: 'default', tokenVersion: 0 },
          process.env.JWT_SECRET as string
        );
        const response = await request(app)
          .get('/api/admin/me')
          .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(401);
      }
    });

    it('should fail to login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({ email: TEST_EMAIL, password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail when email is missing', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({ password: 'somepassword' });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('API Edge Cases', () => {
    it('should return valid response for non-existent category', async () => {
      const token = jwt.sign({ id: 'isolated-test-admin', role: 'admin', tenantId: 'test', tokenVersion: 0 }, process.env.JWT_SECRET as string);
      const response = await request(app)
        .get('/api/trips?category=ghost-category')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle an empty list without crashing', async () => {
      const token = jwt.sign({ id: 'isolated-test-admin', role: 'admin', tenantId: 'test', tokenVersion: 0 }, process.env.JWT_SECRET as string);
      const response = await request(app)
        .get('/api/trips')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });
  });
});
