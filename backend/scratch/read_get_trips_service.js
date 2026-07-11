const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/services/bookings.service.ts');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("bookings.service.ts getTrips IMPLEMENTATION:");
let found = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('getTrips(')) {
    found = true;
  }
  if (found) {
    console.log(`${i + 1}: ${line}`);
    if (line.includes('}') && i > 10) {
      found = false;
      break;
    }
  }
}
