const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/routes/bookingRoutes.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("bookingRoutes.js LINES 20-100:");
for (let i = 20; i < Math.min(100, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
