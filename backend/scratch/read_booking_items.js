const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("BOOKINGITEMS INITIALIZATION IN BOOKINGDETAILSVIEW:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('bookingItems') || line.includes('setBookingItems')) {
    if (line.includes('const [') || line.includes('useEffect') || line.includes('function') || line.includes('const init')) {
      console.log(`${i + 1}: ${line}`);
    }
  }
}
