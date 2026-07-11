const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PASSENGER UI RENDER BLOCK:");
for (let i = 1670; i < 1750; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
