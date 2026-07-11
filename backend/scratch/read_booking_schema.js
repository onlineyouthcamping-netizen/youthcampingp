const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/validators/index.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("createBookingSchema IN backend/src/validators/index.js:");
for (let i = 15; i < 60; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
