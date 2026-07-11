const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("MATCHES FOR prisma.booking.findMany:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('prisma.booking.findMany')) {
    console.log(`${i + 1}: ${line.trim()}`);
    // Print 15 lines after
    for (let j = 1; j <= 25; j++) {
      if (lines[i + j]) {
        console.log(`  +${j}: ${lines[i + j].trim()}`);
      }
    }
  }
}
