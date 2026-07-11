const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/BookingsPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PARENT PAGE LIST LOAD SYNC:");
for (let i = 430; i < 480; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
