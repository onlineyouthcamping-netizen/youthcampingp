const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/prisma/schema.prisma');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("ALL MODELS IN schema.prisma:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith('model ')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
