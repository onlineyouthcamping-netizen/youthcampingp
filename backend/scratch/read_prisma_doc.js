const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/prisma/schema.prisma');
const content = fs.readFileSync(filePath, 'utf8');

console.log("PRISMA SCHEMA SEARCH FOR BookingDocument:");
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('model BookingDocument') || line.includes('documents BookingDocument')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
