const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("MATCHES FOR passengers IN getBookings:");
let inGetBookings = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('exports.getBookings =')) {
    inGetBookings = true;
  }
  if (line.includes('exports.getAllBookings =') || line.includes('exports.getBookingById =')) {
    inGetBookings = false;
  }
  if (inGetBookings && line.includes('passengers')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
