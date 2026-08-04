const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

let createdActivityId = null;
let createdContractId = null;
let createdDepartureActivityId = null;

test('Step 1: Activity Master record is created 0-coupled from vendorId', async () => {
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

  assert.equal(resActivity.status, 201, `Expected status 201, got ${resActivity.status}: ${JSON.stringify(resActivity.body)}`);
  assert.ok(resActivity.body.data.id, 'Activity Master ID should be generated');
  assert.equal(resActivity.body.data.name, 'River Rafting');
  assert.equal(resActivity.body.data.vendorId, undefined, 'CRITICAL: Activity Master record MUST NOT contain vendorId');

  createdActivityId = resActivity.body.data.id;
});

test('Step 2: Duplicate Activity Master creation is rejected with 409 (Zero Duplication Rule)', async () => {
  const duplicatePayload = {
    name: 'River Rafting',
    category: 'ADVENTURE',
    duration: '2 Hours',
    defaultCapacity: 50
  };

  const resDup = await request(app)
    .post('/api/admin/activities')
    .set('Authorization', 'Bearer test-guide-token-parth')
    .send(duplicatePayload);

  assert.equal(resDup.status, 409, `Expected status 409 for duplicate activity name, got ${resDup.status}`);
  assert.ok(resDup.body.error.includes('already exists') || resDup.body.error.includes('duplicate'), 'Error message should explain zero duplication rule');
});

test('Step 3: Seasonal Activity-Vendor Contract is created mapping activityId to vendorId', async () => {
  const contractPayload = {
    activityId: createdActivityId || 'ACT-TEST-001',
    vendorId: 'VND-RIVER-ADV-001',
    validFrom: '2026-06-01',
    validTo: '2026-09-30',
    seasonType: 'PEAK',
    adultNetCost: 850,
    childNetCost: 650,
    minParticipants: 5,
    maxParticipants: 40,
    paymentTerms: 'NET_15',
    isPreferred: true
  };

  const resContract = await request(app)
    .post('/api/admin/activities/contracts')
    .set('Authorization', 'Bearer test-guide-token-parth')
    .send(contractPayload);

  assert.equal(resContract.status, 201, `Expected status 201, got ${resContract.status}: ${JSON.stringify(resContract.body)}`);
  assert.equal(resContract.body.data.activityId, createdActivityId || 'ACT-TEST-001');
  assert.equal(resContract.body.data.seasonType, 'PEAK');
  createdContractId = resContract.body.data.id;
});

test('Step 4: Operational Departure Activity assignment is created and generates Voucher', async () => {
  const depPayload = {
    tripId: 'TRIP-RISHIKESH-001',
    departureDate: '2026-06-15',
    dayNumber: 2,
    activityId: createdActivityId || 'ACT-TEST-001',
    activityVendorContractId: createdContractId || null,
    vendorId: 'VND-RIVER-ADV-001',
    scheduledTime: '09:00 AM',
    agreedNetCost: 850,
    remarks: 'Group of 24 passengers scheduled for morning batch'
  };

  const resDep = await request(app)
    .post('/api/admin/activities/departures')
    .set('Authorization', 'Bearer test-guide-token-parth')
    .send(depPayload);

  assert.equal(resDep.status, 201, `Expected status 201, got ${resDep.status}: ${JSON.stringify(resDep.body)}`);
  assert.equal(resDep.body.data.status, 'PLANNED');
  createdDepartureActivityId = resDep.body.data.id;

  const resVoucher = await request(app)
    .post(`/api/admin/activities/departures/${createdDepartureActivityId}/voucher`)
    .set('Authorization', 'Bearer test-guide-token-parth')
    .send();

  assert.equal(resVoucher.status, 200, `Expected status 200 for voucher generation, got ${resVoucher.status}`);
  assert.ok(resVoucher.body.data.voucherNumber.startsWith('YC-ACT-'), 'Voucher number should match enterprise pattern YC-ACT-...');
  assert.equal(resVoucher.body.data.status, 'VOUCHER_SENT');
});

test('Step 5: Passenger is allocated to Departure Activity with optional addon price and waiver tracking', async () => {
  const allocPayload = {
    departureActivityId: createdDepartureActivityId || 'DEP-ACT-TEST-001',
    bookingId: 'BKG-2026-001',
    passengerIndex: 0,
    passengerName: 'Ananya Sharma',
    isOpted: true,
    addonAmountCharged: 1200,
    paymentStatus: 'PAID',
    waiverSigned: true
  };

  const resAlloc = await request(app)
    .post('/api/admin/activities/departures/allocate-passenger')
    .set('Authorization', 'Bearer test-guide-token-parth')
    .send(allocPayload);

  assert.equal(resAlloc.status, 201, `Expected status 201, got ${resAlloc.status}: ${JSON.stringify(resAlloc.body)}`);
  assert.equal(resAlloc.body.data.passengerName, 'Ananya Sharma');
  assert.equal(resAlloc.body.data.waiverSigned, true);
});
