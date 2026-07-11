const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("LINE 2735-2755 OF BOOKINGDETAILSVIEW:");
for (let i = 2734; i < 2755; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
