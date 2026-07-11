const { templates } = require('../../../src/lib/email');
const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\Dell\\.gemini\\antigravity\\html_artifacts';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. Mock Partial Payment Booking
const partialBooking = {
  bookingId: 'BK-PARTIAL-TEST',
  tripName: 'Spiti Valley Road Trip',
  fullName: 'Dev Lalitbhai Moradiya',
  name: 'Dev Lalitbhai Moradiya',
  email: 'moradiyadev270808@gmail.com',
  mobile: '918849434633',
  phone: '918849434633',
  pickupCity: 'Ahmedabad',
  departureDate: '2026-07-10',
  paymentMode: 'UPI',
  advancePaid: 4000,
  remainingAmount: 66509.60,
  baseAmount: 67152,
  totalAmount: 67152,
  tripRef: {
    title: 'Spiti Valley Road Trip',
    slug: 'spiti-valley-road-trip-137856',
    location: 'Himachal Pradesh',
    highlights: ['Key Monastery', 'Chandratal Lake']
  },
  sourceMeta: {
    bookingItems: [
      { name: 'Spiti Valley Road Trip Package', qty: 1, rate: 67152 }
    ]
  }
};

// 2. Mock Full Payment Booking
const fullBooking = {
  bookingId: 'BK-FULL-TEST',
  tripName: 'Kedarnath Tungnath & Rishikesh Trip',
  fullName: 'Anjali Sharma',
  name: 'Anjali Sharma',
  email: 'anjali@example.com',
  mobile: '9988776655',
  phone: '9988776655',
  pickupCity: 'Delhi',
  departureDate: '2026-07-25',
  paymentMode: 'Net Banking',
  advancePaid: 17325, // Includes GST @ 5% on 16,500
  remainingAmount: 0,
  baseAmount: 16500,
  totalAmount: 16500,
  tripRef: {
    title: 'Kedarnath Tungnath & Rishikesh Trip',
    slug: 'kedarnath-tungnath-rishikesh-backpacking-trip',
    location: 'Uttarakhand',
    highlights: ['Kedarnath Temple', 'Rishikesh Ganga Aarti']
  },
  sourceMeta: {
    bookingItems: [
      { name: 'Kedarnath Package Standard', qty: 1, rate: 16500 }
    ]
  }
};

// 3. Mock Cash Payment Booking
const cashBooking = {
  bookingId: 'BK-CASH-TEST',
  tripName: 'Spiti Valley Road Trip',
  fullName: 'Dev Lalitbhai Moradiya',
  name: 'Dev Lalitbhai Moradiya',
  email: 'moradiyadev270808@gmail.com',
  mobile: '918849434633',
  phone: '918849434633',
  pickupCity: 'Ahmedabad',
  departureDate: '2026-07-10',
  paymentMode: 'Cash',
  advancePaid: 10000,
  remainingAmount: 60509.60,
  baseAmount: 67152,
  totalAmount: 67152,
  tripRef: {
    title: 'Spiti Valley Road Trip',
    slug: 'spiti-valley-road-trip-137856',
    location: 'Himachal Pradesh',
    highlights: ['Key Monastery', 'Chandratal Lake']
  },
  sourceMeta: {
    bookingItems: [
      { name: 'Spiti Valley Road Trip Package', qty: 1, rate: 67152 }
    ]
  }
};

const renderPartial = templates.confirmation(partialBooking);
const renderFull = templates.confirmation(fullBooking);
const renderCash = templates.confirmation(cashBooking);

fs.writeFileSync(path.join(targetDir, 'partial_payment_email.html'), renderPartial.html, 'utf-8');
fs.writeFileSync(path.join(targetDir, 'full_payment_email.html'), renderFull.html, 'utf-8');
fs.writeFileSync(path.join(targetDir, 'cash_payment_email.html'), renderCash.html, 'utf-8');

console.log('MOCK EMAIL TEMPLATES GENERATED SUCCESSFULLY in html_artifacts!');
console.log(`Partial: ${path.join(targetDir, 'partial_payment_email.html')}`);
console.log(`Full: ${path.join(targetDir, 'full_payment_email.html')}`);
console.log(`Cash: ${path.join(targetDir, 'cash_payment_email.html')}`);
