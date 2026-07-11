const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("GET BOOKINGS LIST BLOCK:");
for (let i = 430; i < 490; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
