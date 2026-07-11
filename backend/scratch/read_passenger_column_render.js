const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PASSENGER COLUMN RENDER:");
for (let i = 1740; i < 1790; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
