const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("BOOKING ITEMS TABLE RENDERING:");
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Booking Items') && lines[i].includes('Passenger Details')) {
    start = i;
    break;
  }
}
if (start > -1) {
  for (let i = start; i < start + 120; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
} else {
  console.log("Not found");
}
