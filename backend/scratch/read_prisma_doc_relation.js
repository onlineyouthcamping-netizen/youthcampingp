const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/prisma/schema.prisma');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PRISMA SCHEMA SEARCH FOR documents IN Booking:");
let inBooking = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('model Booking ')) {
    inBooking = true;
  }
  if (inBooking) {
    if (line.startsWith('}')) {
      inBooking = false;
    }
    if (line.includes('documents')) {
      console.log(`${i + 1}: ${line.trim()}`);
    }
  }
}
