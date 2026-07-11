const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("handleSaveBookingItems UPDATE PAYLOAD:");
for (let i = 1004; i < 1020; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
