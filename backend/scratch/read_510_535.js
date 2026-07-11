const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("LINE 510-535 BLOCK:");
for (let i = 510; i < 535; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
