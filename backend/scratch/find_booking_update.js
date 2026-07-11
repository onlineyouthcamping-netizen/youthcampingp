const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("BOOKING UPDATE MATCHES:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('updateBooking') || (line.includes('exports.') && line.includes('update')) || line.includes('prisma.booking.update')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
