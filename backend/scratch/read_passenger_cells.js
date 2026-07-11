const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PASSENGER UI CELL RENDER BLOCK:");
for (let i = 1750; i < 1830; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
