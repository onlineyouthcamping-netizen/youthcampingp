const { generateInvoicePDF } = require('./src/utils/pdfGenerator');
const fs = require('fs');

const mockBooking = {
  bookingId: 'BK-TEST',
  fullName: 'Test User',
  mobile: '1234567890',
  email: 'test@example.com',
  tripId: 'TRIP-1',
  tripName: 'Test Trip',
  trainClass: '3AC',
  ticketStatus: 'Confirmed',
  totalAmount: 10000,
  advancePaid: 2000,
  remainingAmount: 8000,
  paymentStatus: 'Partial'
};

async function test() {
  try {
    console.log('Generating PDF...');
    const buffer = await generateInvoicePDF(mockBooking);
    fs.writeFileSync('test_invoice.pdf', buffer);
    console.log('PDF generated successfully: test_invoice.pdf');
  } catch (err) {
    console.error('PDF Generation failed:', err);
  }
}

test();
