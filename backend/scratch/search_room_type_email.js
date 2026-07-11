const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/email.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("MATCHES FOR roomType IN email.js:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('roomType')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
