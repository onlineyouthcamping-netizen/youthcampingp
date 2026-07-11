const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("bookingController.js getTrips IMPLEMENTATION:");
let found = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('exports.getTrips') || line.includes('getTrips =')) {
    found = true;
  }
  if (found) {
    console.log(`${i + 1}: ${line}`);
    if (line.includes('res.json') || line.includes('res.send') || line.includes('}')) {
      found = false;
      break;
    }
  }
}
