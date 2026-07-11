const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/services/bookings.service.ts');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("bookings.service.ts DOCUMENT END BLOCK:");
for (let i = 140; i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
