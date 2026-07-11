const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/email.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("EMAIL JS LINES 158-183:");
for (let i = 157; i < 183; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
