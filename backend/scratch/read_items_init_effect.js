const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("bookingItems INITIALIZATION EFFECT:");
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('setBookingItems') && lines[i - 1]?.includes('sourceMeta')) {
    start = i - 5;
    break;
  }
}
if (start > -1) {
  for (let i = start; i < start + 30; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
} else {
  console.log("Not found");
}
