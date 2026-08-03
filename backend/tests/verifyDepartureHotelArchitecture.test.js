const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

test('Step 1: Hotel Master record is created decoupled from vendorId', async () => {
  const hotelPayload = {
    name: 'Spiti Siddharth Luxury Resort',
    city: 'Kaza',
    category: 'Deluxe',
    rating: 5,
    totalRooms: 25,
    contactPerson: 'Tenzin Norbu',
    phone: '+919876543210'
  };

  const resHotel = await request(app)
    .post('/api/admin/hotels')
    .set('Authorization', 'Bearer test-guide-token-parth')
    .send(hotelPayload);

  assert.equal(resHotel.status, 201, `Expected status 201, got ${resHotel.status}`);
  assert.ok(resHotel.body.data.id, 'Hotel ID should be generated');
  assert.equal(resHotel.body.data.vendorId, undefined, 'CRITICAL: Hotel Master record MUST NOT contain vendorId');
});

test('Step 2: Hotel-Vendor Contract mapping is created linking hotelId and vendorId', async () => {
  const contractPayload = {
    hotelId: 'HTL-TEST-001',
    vendorId: 'VND-MH-001',
    vendorName: 'Mountain Hospitality Pvt Ltd',
    contractType: 'SEASONAL_B2B',
    negotiatedRates: {
      Twin: 3500,
      Triple: 4200,
      Quad: 5000,
      ExtraBed: 1000
    },
    paymentTerms: '50% Advance, 50% Post-Trip Check-out'
  };

  const resContract = await request(app)
    .post('/api/admin/hotel-vendors')
    .set('Authorization', 'Bearer test-guide-token-parth')
    .send(contractPayload);

  assert.equal(resContract.status, 201, `Expected status 201, got ${resContract.status}`);
  assert.equal(resContract.body.data.hotelId, 'HTL-TEST-001');
  assert.equal(resContract.body.data.vendorId, 'VND-MH-001');
});

test('Step 3 & 4: Departure Stay assignment and 9-Stage Operational Status Flow', async () => {
  const stayPayload = {
    departureId: 'DEP-SPITI-05JUN',
    hotelId: 'HTL-TEST-001',
    hotelName: 'Spiti Siddharth Luxury Resort',
    vendorContractId: 'CTR-TEST-001',
    vendorName: 'Mountain Hospitality Pvt Ltd',
    day: 'Day 3',
    destCity: 'Kaza',
    checkInDate: '2026-06-07',
    checkOutDate: '2026-06-08',
    roomAllocations: {
      Twin: 5,
      Triple: 2
    },
    vendorRate: 3500,
    sellingRate: 4500,
    status: 'Draft'
  };

  const resStay = await request(app)
    .post('/api/admin/departure-stays')
    .set('Authorization', 'Bearer test-guide-token-parth')
    .send(stayPayload);

  assert.equal(resStay.status, 201, `Expected status 201, got ${resStay.status}`);
  assert.equal(resStay.body.data.status, 'Draft', 'Initial status should be Draft');

  const stayId = resStay.body.data.id;
  const stages = [
    'Draft',
    'Rate Finalized',
    'Voucher Sent',
    'Hotel Confirmed',
    'Checked In',
    'Checked Out',
    'Invoice Received',
    'Paid',
    'Closed'
  ];

  for (const stage of stages) {
    const resUpdate = await request(app)
      .put(`/api/admin/departure-stays/${stayId}`)
      .set('Authorization', 'Bearer test-guide-token-parth')
      .send({ status: stage });

    assert.equal(resUpdate.status, 200, `Expected status 200 when updating stay to ${stage}, got ${resUpdate.status}`);
    assert.equal(resUpdate.body.data.status, stage, `Stay status should be updated to ${stage}`);
  }
});
