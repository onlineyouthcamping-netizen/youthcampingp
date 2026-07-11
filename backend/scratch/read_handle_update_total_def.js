const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("HANDLE UPDATE TOTAL FUNCTION DEFINITION:");
for (let i = 960; i < 1010; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
