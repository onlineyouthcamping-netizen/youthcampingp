const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("MATCHES IN BOOKING DETAILS VIEW:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('editDiscount') || line.includes('gstPercentage') || line.includes('BASE PRICE PREVIEW') || line.includes('editDiscountLabel')) {
    console.log(`${i + 1}: ${line}`);
  }
}
