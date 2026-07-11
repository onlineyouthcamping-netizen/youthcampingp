const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/middleware/auth.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("AUTHENTICATE MIDDLEWARE:");
for (let i = 0; i < Math.min(100, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
