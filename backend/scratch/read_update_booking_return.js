const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("updateBooking RETURN BLOCK:");
for (let i = 1120; i < 1150; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
