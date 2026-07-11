const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/config/env.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("ENV LOADING LOGIC:");
for (let i = 0; i < Math.min(100, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
