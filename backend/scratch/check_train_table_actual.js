const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let occurrences = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Train Bookings')) {
    occurrences.push(i + 1);
  }
}
console.log("All 'Train Bookings' lines:", occurrences);

if (occurrences.length > 1) {
  const lineNum = occurrences[1];
  console.log(`Checking table starting at line ${lineNum}:`);
  for (let i = lineNum - 2; i < lineNum + 80; i++) {
    if (lines[i]) console.log(`${i + 1}: ${lines[i]}`);
  }
}
