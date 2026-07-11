const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/prisma/schema.prisma');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PRISMA SCHEMA Booking MODEL:");
let inModel = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('model Booking ')) {
    inModel = true;
  }
  if (inModel) {
    console.log(`${i + 1}: ${line}`);
    if (line.startsWith('}')) {
      inModel = false;
    }
  }
}
