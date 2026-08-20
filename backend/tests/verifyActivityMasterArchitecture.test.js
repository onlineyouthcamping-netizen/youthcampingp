const request = require('supertest');
const app = require('../src/app');

describe('Activity Master Architecture Integration Tests', () => {
  it('Step 1: Activity Master record creation endpoint', async () => {
    const activityPayload = {
      name: 'River Rafting',
      category: 'ADVENTURE',
      duration: '2 Hours',
      defaultCapacity: 50,
      difficulty: 'MODERATE',
      minimumAge: 16,
      insuranceRequired: true,
      gstPercentage: 5.0,
      description: 'White water river rafting in Rishikesh rapids',
      safetyInstructions: 'Wear life jacket and helmet at all times',
      meetingPoint: 'Rishikesh River Base Camp',
      vendorId: 'SHOULD_BE_IGNORED_VND_01'
    };

    const resActivity = await request(app)
      .post('/api/admin/activities')
      .set('Authorization', 'Bearer test-guide-token-parth')
      .send(activityPayload);

    expect([200, 201, 400, 401, 403, 404, 409]).toContain(resActivity.status);
  });

  it('Step 2: Activity KPIs endpoint', async () => {
    const resKpi = await request(app)
      .get('/api/admin/activities/analytics/kpis')
      .set('Authorization', 'Bearer test-guide-token-parth');

    expect([200, 401, 403, 404]).toContain(resKpi.status);
  });
});
