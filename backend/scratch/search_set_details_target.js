const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/BookingsPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("OCCURRENCES OF setDetailsTarget IN BookingsPage.tsx:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('setDetailsTarget')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
