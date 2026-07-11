const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/email.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("EMAIL JS LINES 220-260:");
for (let i = 220; i < 260; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
