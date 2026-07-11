const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/BookingsPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("fetchBookings BLOCK:");
for (let i = 394; i < 455; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
