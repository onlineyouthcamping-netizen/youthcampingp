const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("BOOKINGS SERVICE UPDATE CALLS in BookingDetailsView.tsx:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('bookingsService.update')) {
    console.log(`${i + 1}: ${line.trim()}`);
    // Print 5 lines after the match
    for (let j = 1; j <= 12; j++) {
      if (lines[i + j]) {
        console.log(`  +${j}: ${lines[i + j].trim()}`);
      }
    }
  }
}
