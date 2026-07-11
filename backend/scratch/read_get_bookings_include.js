const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("bookingController.js getBookings INCLUDES:");
let found = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('exports.getBookings') || line.includes('getBookings =')) {
    found = true;
  }
  if (found) {
    if (line.includes('include') || line.includes('select') || line.includes('findMany')) {
      for (let j = i; j < i + 35; j++) {
        console.log(`${j + 1}: ${lines[j]}`);
      }
      found = false;
      break;
    }
  }
}
