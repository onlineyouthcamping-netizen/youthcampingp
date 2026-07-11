const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/lib/email.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("EMAIL GENERATOR GST DISCOUNT BLOCK:");
for (let i = 220; i < 260; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
