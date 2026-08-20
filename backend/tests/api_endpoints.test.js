/**
 * Jest & Supertest Integration Test Suite for YouthCamping API Endpoints
 */

const request = require('supertest');
const app = require('../src/app');

describe('YouthCamping Production API Endpoints', () => {
  describe('GET /api/trips', () => {
    it('Should return trips list with success flag', async () => {
      const res = await request(app).get('/api/trips');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Should filter trips by search query', async () => {
      const res = await request(app).get('/api/trips?search=Manali');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/destinations', () => {
    it('Should return destinations array', async () => {
      const res = await request(app).get('/api/destinations');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data || res.body)).toBe(true);
    });
  });

  describe('GET /api/stories', () => {
    it('Should fetch stories/blogs', async () => {
      const res = await request(app).get('/api/stories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data || res.body)).toBe(true);
    });
  });

  describe('GET /api/reviews', () => {
    it('Should fetch reviews', async () => {
      const res = await request(app).get('/api/reviews');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data || res.body)).toBe(true);
    });
  });

  describe('Health Endpoint', () => {
    it('Should pass health check endpoint GET /api/health', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.uptimeSeconds).toBeDefined();
    });
  });
});
