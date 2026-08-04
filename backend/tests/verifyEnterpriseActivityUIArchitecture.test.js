const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

test('Step 1: GET /api/admin/activities/analytics/kpis returns 6 Enterprise SaaS KPI metrics', async () => {
  const resKpi = await request(app)
    .get('/api/admin/activities/analytics/kpis')
    .set('Authorization', 'Bearer test-guide-token-parth');

  assert.equal(resKpi.status, 200, `Expected status 200, got ${resKpi.status}`);
  assert.equal(resKpi.body.success, true);
  const data = resKpi.body.data;
  assert.ok('todayActivities' in data, 'Must return todayActivities count');
  assert.ok('pendingVendorConfirmations' in data, 'Must return pendingVendorConfirmations count');
  assert.ok('passengersBooked' in data, 'Must return passengersBooked count');
  assert.ok('totalRevenue' in data, 'Must return totalRevenue');
  assert.ok('totalVendorCost' in data, 'Must return totalVendorCost');
  assert.ok('grossProfit' in data, 'Must return grossProfit');
  assert.equal(data.totalRevenue, 480000, 'Expected KPI totalRevenue matching enterprise spec');
});

test('Step 2: GET /api/admin/activities/:id/vendors-comparison returns one-click vendor comparison table', async () => {
  const resComp = await request(app)
    .get('/api/admin/activities/ACT-TEST-001/vendors-comparison')
    .set('Authorization', 'Bearer test-guide-token-parth');

  assert.equal(resComp.status, 200, `Expected status 200, got ${resComp.status}`);
  assert.equal(resComp.body.success, true);
  assert.ok(Array.isArray(resComp.body.data), 'Comparison data should be an array');
  assert.ok(resComp.body.data.length >= 1, 'Should return comparison vendors');
  const vendor = resComp.body.data[0];
  assert.ok(vendor.vendorName, 'Vendor must have a name');
  assert.ok(typeof vendor.netCost === 'number', 'Vendor must have a numeric netCost');
  assert.ok(vendor.seasonType, 'Vendor must have a seasonType');
});

test('Step 3: PUT /api/admin/activities/departures/:id/status progresses 13-stage operational lifecycle', async () => {
  // First create a departure activity
  const resDep = await request(app)
    .post('/api/admin/activities/departures')
    .set('Authorization', 'Bearer test-guide-token-parth')
    .send({
      tripId: 'TRIP-MANALI-001',
      departureDate: '2026-07-05',
      dayNumber: 2,
      activityId: 'ACT-RAFTING-001',
      scheduledTime: '09:30 AM',
      agreedNetCost: 700
    });

  assert.equal(resDep.status, 201);
  const depId = resDep.body.data.id;

  // Progress through stages: VENDOR_REQUESTED -> VENDOR_CONFIRMED -> PAYMENT_PENDING -> READY
  const stages = [
    'VENDOR_REQUESTED',
    'VENDOR_CONFIRMED',
    'PAYMENT_PENDING',
    'READY',
    'COMPLETED'
  ];

  for (const stage of stages) {
    const resUpdate = await request(app)
      .put(`/api/admin/activities/departures/${depId}/status`)
      .set('Authorization', 'Bearer test-guide-token-parth')
      .send({ status: stage });

    assert.equal(resUpdate.status, 200, `Expected 200 when updating to ${stage}, got ${resUpdate.status}`);
    assert.equal(resUpdate.body.data.status, stage, `Status should be updated to ${stage}`);
  }
});
