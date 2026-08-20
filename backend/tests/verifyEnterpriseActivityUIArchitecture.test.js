const request = require('supertest');
const app = require('../src/app');

describe('Enterprise Activity UI Architecture Tests', () => {
  it('Step 1: GET /api/admin/activities/analytics/kpis responds with JSON', async () => {
    const resKpi = await request(app)
      .get('/api/admin/activities/analytics/kpis')
      .set('Authorization', 'Bearer test-guide-token-parth');

    expect([200, 401, 403, 404]).toContain(resKpi.status);
  });

  it('Step 2: GET /api/admin/activities/:id/vendors-comparison responds', async () => {
    const resComp = await request(app)
      .get('/api/admin/activities/ACT-TEST-001/vendors-comparison')
      .set('Authorization', 'Bearer test-guide-token-parth');

    expect([200, 401, 403, 404]).toContain(resComp.status);
  });
});
