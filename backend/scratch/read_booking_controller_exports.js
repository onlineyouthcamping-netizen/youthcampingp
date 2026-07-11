const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("bookingController.js EXPORTS & bookingId GENERATION:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('bookingId') || line.includes('exports.') || line.includes('function ')) {
    if (line.includes('bookingId') || line.includes('createBooking') || line.includes('submitBookingForm')) {
      console.log(`${i + 1}: ${line.trim()}`);
    }
  }
}
