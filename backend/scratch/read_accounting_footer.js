const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("ACCOUNTING TAB FOOTER BLOCK:");
for (let i = 2485; i < 2650; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
