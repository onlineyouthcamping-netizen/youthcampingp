const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/services/bookings.service.ts');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("uploadDocument IN bookings.service.ts:");
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('uploadDocument')) {
    start = i;
    break;
  }
}
if (start > -1) {
  for (let i = start; i < start + 20; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
} else {
  console.log("Not found");
}
