const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("getBookings PASSENGER HANDLING BLOCK:");
for (let i = 330; i < 390; i++) {
  const line = lines[i];
  if (line.includes('passengers')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
