const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("REST OF HANDLE UPDATE TOTAL:");
for (let i = 740; i < 790; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
