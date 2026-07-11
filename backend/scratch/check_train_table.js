const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const idx = content.indexOf('Train Bookings');
if (idx !== -1) {
  const lineNum = content.substring(0, idx).split('\n').length;
  console.log(`Train Bookings starts around line ${lineNum}`);
  for (let i = lineNum - 2; i < lineNum + 60; i++) {
    if (lines[i]) console.log(`${i + 1}: ${lines[i]}`);
  }
}
