const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/BookingsPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("MATCHES FOR fetchBookings:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('fetchBookings =') || line.includes('function fetchBookings')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
