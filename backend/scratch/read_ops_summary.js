const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("buildBookingOpsSummary DEFINITION START:");
for (let i = 598; i < 650; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
