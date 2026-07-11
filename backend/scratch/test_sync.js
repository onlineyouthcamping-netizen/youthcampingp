require('dotenv').config();
const { syncBookingToSheets } = require('../src/utils/googleSheetsSync');

const testBooking = {
  bookingId: 'BK-TEST-123',
  tripName: 'TEST TRIP',
  fullName: 'Test User',
  age: 25,
  gender: 'Male',
  mobile: '1234567890',
  advancePaid: 5000,
  departureDate: new Date(),
  passengers: {
    details: {
      trainClass: '3A',
      ticketStatus: 'Confirmed',
      roomType: 'Double'
    }
  },
  createdAt: new Date()
};

console.log('--- STARTING MANUAL SYNC TEST ---');
syncBookingToSheets(testBooking)
  .then(res => {
    console.log('✅ SUCCESS:', res);
  })
  .catch(err => {
    console.error('❌ FAILED:', err.message);
  });
