const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find the getBookings function and print the select block to see what fields are retrieved from the DB.
let printSelect = false;
let braceCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('exports.getBookings') || lines[i].includes('getBookings =')) {
    printSelect = true;
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
  if (printSelect) {
    console.log(`${i + 1}: ${lines[i]}`);
    if (lines[i].includes('prisma.booking.findMany')) {
      // print next 40 lines
      for (let j = i + 1; j < i + 50; j++) {
        console.log(`${j + 1}: ${lines[j]}`);
      }
      break;
    }
  }
}
