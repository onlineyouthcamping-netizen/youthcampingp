const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("USEMEMO BLOCK IN BOOKINGDETAILSVIEW:");
for (let i = 320; i < 365; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
