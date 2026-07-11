const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("UPDATE BOOKING PASSENGER PARSING:");
for (let i = 1034; i < 1065; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
