const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/BookingsPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("BOOKINGS PAGE FETCH/REFRESH MATCHES:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('bookingsService') || line.includes('setSelectedBooking') || line.includes('refresh') || line.includes('load')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
