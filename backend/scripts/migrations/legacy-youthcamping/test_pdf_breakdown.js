const { generateInvoicePDF } = require('../../../src/utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

const mockBooking = {
  bookingId: 'BK-BREAKDOWN-TEST',
  fullName: 'Dev Lalitbhai Moradiya',
  name: 'Dev Lalitbhai Moradiya',
  mobile: '918849434633',
  phone: '918849434633',
  email: 'moradiyadev270808@gmail.com',
  tripId: 'spiti-valley-road-trip-137856',
  tripName: 'Spiti Valley Road Trip',
  totalAmount: 70509.60,
  advancePaid: 4000,
  remainingAmount: 66509.60,
  paymentStatus: 'Partial',
  passengers: {
    details: {
      trainClass: '3AC TRAIN',
      ticketStatus: 'Confirmed',
      roomType: 'DOUBLE SHARING',
    },
    persons: [
      { name: 'Traveller 1' },
      { name: 'Traveller 2' }
    ]
  },
  sourceMeta: {
    bookingItems: [
      { name: 'Spiti Valley Road Trip Package', qty: 2, rate: 32000 },
      { name: 'Extra Baggage Add-on', qty: 2, rate: 1576 },
      { name: 'Early Bird Discount', qty: 1, rate: -500 }
    ]
  }
};

async function run() {
  try {
    console.log('Generating detailed invoice PDF...');
    const buffer = await generateInvoicePDF(mockBooking);
    const outputPath = path.join(__dirname, 'test_breakdown_invoice.pdf');
    fs.writeFileSync(outputPath, buffer);
    console.log('PDF generated successfully at:', outputPath);
  } catch (err) {
    console.error('PDF Generation failed:', err);
  }
}

run();
