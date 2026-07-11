const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PASSENGER INITIALIZATION BLOCK:");
for (let i = 469; i < 515; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
