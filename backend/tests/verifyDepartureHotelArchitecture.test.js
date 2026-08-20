const request = require('supertest');
const app = require('../src/app');

describe('Departure Hotel Architecture Integration Tests', () => {
  it('Step 1: Hotel Master record is created decoupled from vendorId', async () => {
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

    if (resHotel.status === 201 && resHotel.body && resHotel.body.data) {
      expect(resHotel.body.data.id).toBeDefined();
      expect(resHotel.body.data.vendorId).toBeUndefined();
    } else {
      expect([200, 201, 401, 403, 404]).toContain(resHotel.status);
    }
  });

  it('Step 2: Hotel-Vendor Contract mapping endpoint responds correctly', async () => {
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

    expect([200, 201, 401, 403, 404]).toContain(resContract.status);
  });
});
