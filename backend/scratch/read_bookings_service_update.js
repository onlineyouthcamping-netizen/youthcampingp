const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/services/bookings.service.ts');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("BOOKINGS SERVICE UPDATE METHOD:");
for (let i = 50; i < 70; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
