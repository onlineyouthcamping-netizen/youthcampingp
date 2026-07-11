const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("MATCHES FOR getBooking:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('getBooking =') || line.includes('getBookingDetails =') || line.includes('exports.getBooking')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
