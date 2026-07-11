const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PASSENGER FORM INPUT FIELDS:");
let inForm = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('firstName') || line.includes('lastName') || line.includes('handleSavePassenger')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
