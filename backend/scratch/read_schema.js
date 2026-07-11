const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const lines = schemaContent.split('\n');
let insideTrip = false;
console.log("TRIP MODEL FIELDS IN SCHEMA.PRISMA:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('model Trip')) {
    insideTrip = true;
  }
  if (insideTrip) {
    console.log(`${i + 1}: ${line}`);
    if (line.includes('}')) {
      insideTrip = false;
    }
  }
}
