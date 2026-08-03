/**
 * Jest & Supertest Integration Test Suite for YouthCamping 7 API Endpoints
 */

jest.mock('isomorphic-dompurify', () => ({ sanitize: (str) => str }));

const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../utils/database');

describe('YouthCamping 7 Production API Endpoints', () => {
  beforeAll(async () => {
    // Ensure database connection and warm up
    await prisma.$connect();
    await prisma.apiTrip.findFirst();
    await prisma.apiTrip.findFirst({ where: { id: 'mka-1' }, include: { details: true, travelModes: true } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ==========================================
  // ENDPOINT 1: GET /api/trips
  // ==========================================
  describe('GET /api/trips', () => {
    it('✓ Should return paginated trips with status success', async () => {
      const start = Date.now();
      const res = await request(app).get('/api/trips?page=1&limit=10');
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);

      if (res.body.data.length > 0) {
        const trip = res.body.data[0];
        expect(trip).toHaveProperty('id');
        expect(trip).toHaveProperty('title');
        expect(trip).toHaveProperty('location');
        expect(trip).toHaveProperty('image');
        expect(trip).toHaveProperty('duration');
        expect(trip).toHaveProperty('difficulty');
        expect(trip).toHaveProperty('slug');
      }

      // Performance check
      expect(duration).toBeLessThan(1500);
    });

    it('✓ Should filter trips by month', async () => {
      const res = await request(app).get('/api/trips?month=August');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('✓ Should search trips by title or location', async () => {
      const res = await request(app).get('/api/trips?search=Manali');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toMatch(/Manali/i);
    });

    it('✓ Should return 400 for invalid month parameter', async () => {
      const res = await request(app).get('/api/trips?month=InvalidMonthName');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('BAD_REQUEST');
      expect(res.body.statusCode).toBe(400);
    });

    it('✓ Should return 400 for invalid page parameter', async () => {
      const res = await request(app).get('/api/trips?page=-1');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.statusCode).toBe(400);
    });
  });

  // ==========================================
  // ENDPOINT 2: GET /api/trips/:id
  // ==========================================
  describe('GET /api/trips/:id', () => {
    it('✓ Should return complete trip detail for valid trip ID', async () => {
      const start = Date.now();
      const res = await request(app).get('/api/trips/mka-1');
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      
      const trip = res.body.data;
      expect(trip.id).toBe('mka-1');
      expect(trip.title).toBe('Manali Kasol Amritsar');
      expect(trip.subtitle).toBeDefined();
      expect(trip.location).toBeDefined();
      expect(trip.image).toBeDefined();
      expect(Array.isArray(trip.galleryImages)).toBe(true);
      expect(trip.duration).toHaveProperty('nights');
      expect(trip.duration).toHaveProperty('days');
      expect(trip.price).toHaveProperty('base');
      expect(trip.price).toHaveProperty('currency');
      expect(Array.isArray(trip.travelModes)).toBe(true);
      expect(Array.isArray(trip.roomSharing)).toBe(true);
      expect(Array.isArray(trip.itinerary)).toBe(true);
      expect(Array.isArray(trip.inclusions)).toBe(true);
      expect(Array.isArray(trip.exclusions)).toBe(true);
      expect(Array.isArray(trip.stays)).toBe(true);
      expect(Array.isArray(trip.highlights)).toBe(true);
      expect(Array.isArray(trip.reviews)).toBe(true);
      expect(Array.isArray(trip.faqs)).toBe(true);
      expect(Array.isArray(trip.departureMonths)).toBe(true);
      expect(typeof trip.departureDates).toBe('object');
      expect(typeof trip.averageRating).toBe('number');
      expect(typeof trip.reviewCount).toBe('number');

      expect(duration).toBeLessThan(1500);
    });

    it('✓ Should fetch trip detail by slug', async () => {
      const res = await request(app).get('/api/trips/manali-kasol-amritsar');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe('mka-1');
    });

    it('✓ Should return 404 if trip not found', async () => {
      const res = await request(app).get('/api/trips/non-existent-trip-id-999');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('NOT_FOUND');
      expect(res.body.statusCode).toBe(404);
    });
  });

  // ==========================================
  // ENDPOINT 3: GET /api/destinations
  // ==========================================
  describe('GET /api/destinations', () => {
    it('✓ Should return top destinations carousel', async () => {
      const res = await request(app).get('/api/destinations');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);

      if (res.body.data.length > 0) {
        const dest = res.body.data[0];
        expect(dest).toHaveProperty('id');
        expect(dest).toHaveProperty('name');
        expect(dest).toHaveProperty('image');
        expect(dest).toHaveProperty('order');
      }
    });
  });

  // ==========================================
  // ENDPOINT 4: GET /api/stories
  // ==========================================
  describe('GET /api/stories', () => {
    it('✓ Should fetch blog stories with limit and featured filter', async () => {
      const res = await request(app).get('/api/stories?limit=3&featured=true');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);

      if (res.body.data.length > 0) {
        const story = res.body.data[0];
        expect(story).toHaveProperty('id');
        expect(story).toHaveProperty('title');
        expect(story).toHaveProperty('author');
        expect(story).toHaveProperty('avatar');
        expect(story).toHaveProperty('readTime');
        expect(story).toHaveProperty('image');
        expect(story).toHaveProperty('slug');
        expect(story).toHaveProperty('excerpt');
        expect(story).toHaveProperty('publishedAt');
      }
    });

    it('✓ Should return 400 for invalid featured parameter', async () => {
      const res = await request(app).get('/api/stories?featured=invalid_bool');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  // ==========================================
  // ENDPOINT 5: GET /api/reviews
  // ==========================================
  describe('GET /api/reviews', () => {
    it('✓ Should fetch homepage testimonials (featured reviews)', async () => {
      const res = await request(app).get('/api/reviews?limit=3');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);

      if (res.body.data.length > 0) {
        const review = res.body.data[0];
        expect(review).toHaveProperty('id');
        expect(review).toHaveProperty('author');
        expect(review).toHaveProperty('avatar');
        expect(review).toHaveProperty('trip');
        expect(review).toHaveProperty('tripSlug');
        expect(review).toHaveProperty('date');
        expect(review).toHaveProperty('rating');
        expect(review).toHaveProperty('text');
        expect(review).toHaveProperty('images');
      }
    });
  });

  // ==========================================
  // ENDPOINT 6: GET /api/trips/:id/reviews
  // ==========================================
  describe('GET /api/trips/:id/reviews', () => {
    it('✓ Should fetch reviews for specific trip with pagination & stats', async () => {
      const res = await request(app).get('/api/trips/mka-1/reviews?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats).toHaveProperty('averageRating');
      expect(res.body.stats).toHaveProperty('totalReviews');
    });
  });

  // ==========================================
  // ENDPOINT 7: GET /api/trips/:id/faqs
  // ==========================================
  describe('GET /api/trips/:id/faqs', () => {
    it('✓ Should fetch FAQs for specific trip', async () => {
      const res = await request(app).get('/api/trips/mka-1/faqs');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);

      if (res.body.data.length > 0) {
        const faq = res.body.data[0];
        expect(faq).toHaveProperty('id');
        expect(faq).toHaveProperty('question');
        expect(faq).toHaveProperty('answer');
      }
    });
  });

  // ==========================================
  // HEADERS & MIDDLEWARE CHECKS
  // ==========================================
  describe('Headers & Middlewares', () => {
    it('✓ Should return required response headers (CORS, Cache-Control, X-Response-Time)', async () => {
      const res = await request(app).get('/api/destinations');
      expect(res.headers['access-control-allow-origin']).toBe('*');
      expect(res.headers['access-control-allow-methods']).toContain('GET');
      expect(res.headers['cache-control']).toBe('max-age=300, public');
      expect(res.headers['x-response-time']).toBeDefined();
    });

    it('✓ Should pass health check endpoint GET /api/health', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.services.database.status).toBe('healthy');
    });
  });
});
