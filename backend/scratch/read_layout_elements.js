const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("DESCRIPTION FIELDS IN BOOKINGDETAILSVIEW:");
for (let i = 1200; i < 1850; i++) {
  const line = lines[i];
  if (line.includes('(') && line.includes(')') && (line.includes('trainClass') || line.includes('roomType') || line.includes('pickupCity'))) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
