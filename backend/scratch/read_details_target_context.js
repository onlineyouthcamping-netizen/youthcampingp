const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/BookingsPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("MATCHES FOR detailsTarget WITH CONTEXT:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('detailsTarget')) {
    console.log(`--- Line ${i + 1} ---`);
    for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
  }
}
