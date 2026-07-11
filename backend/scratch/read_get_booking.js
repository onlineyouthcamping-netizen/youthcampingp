const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("GET BOOKING BY ID BLOCK:");
for (let i = 520; i < 560; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
