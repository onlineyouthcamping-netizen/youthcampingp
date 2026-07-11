const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("HANDLE EDIT PASSENGER DEFINITION:");
for (let i = 1080; i < 1105; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
