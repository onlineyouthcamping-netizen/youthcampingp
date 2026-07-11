const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('setTripVendors') || line.includes('setVendorSummary')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
    for (let j = Math.max(0, i - 5); j < Math.min(lines.length, i + 15); j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
  }
}
