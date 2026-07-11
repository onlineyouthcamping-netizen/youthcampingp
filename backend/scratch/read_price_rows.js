const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/email.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("MATCHES FOR priceRowsHtml:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('priceRowsHtml') || line.includes('bookingItems')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
