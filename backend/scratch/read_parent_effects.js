const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/BookingsPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PARENT PAGE EFFECTS BLOCK:");
for (let i = 320; i < 395; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
