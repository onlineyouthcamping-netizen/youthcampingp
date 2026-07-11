const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PASSENGER DOCUMENT ACTIONS LINES:");
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('handleViewDoc') && lines[i].includes('passengerDoc.originalFileName')) {
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
