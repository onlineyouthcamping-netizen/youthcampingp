const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("DepartureHubPage.tsx generateMockBookings USAGE:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('generateMockBookings') || line.includes('generateMock')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
