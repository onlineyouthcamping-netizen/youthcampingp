const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/email.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PRICING ROWS GENERATION BLOCK:");
for (let i = 150; i < 220; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
