const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/email.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("EMAIL JS PASSENGERS RENDER BLOCK:");
for (let i = 260; i < 330; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
