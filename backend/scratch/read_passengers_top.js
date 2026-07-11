const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PASSENGER INITIALIZATION LINES 440-470:");
for (let i = 440; i < 470; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
