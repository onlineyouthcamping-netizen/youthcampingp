const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("handleUpdateTotal DEFINITION BLOCK:");
for (let i = 940; i < 962; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
