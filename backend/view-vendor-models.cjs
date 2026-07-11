const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '../backend/prisma/schema.prisma'), 'utf8');
const lines = content.split('\n');
let print = false;
let brackets = 0;
lines.forEach((line, idx) => {
  if (line.includes('model Vendor') || line.includes('model TripVendor')) {
    print = true;
    brackets = 0;
  }
  if (print) {
    console.log(`${idx + 1}: ${line}`);
    if (line.includes('{')) brackets++;
    if (line.includes('}')) {
      brackets--;
      if (brackets <= 0) print = false;
    }
  }
});
