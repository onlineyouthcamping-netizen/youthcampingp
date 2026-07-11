const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/BookingsPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("MATCHES FOR fetchAll:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('fetchAll =') || line.includes('function fetchAll')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
