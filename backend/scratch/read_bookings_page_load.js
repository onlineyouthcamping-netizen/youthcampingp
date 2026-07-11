const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/BookingsPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("LINES 465-500 OF BOOKINGSPAGE:");
for (let i = 464; i < 500; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
