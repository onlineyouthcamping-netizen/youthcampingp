const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("MATCHING LINES FOR PARENTHESIS CONCATENATION:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('(') && line.includes(')') && line.includes('booking') && (line.includes('trainClass') || line.includes('roomType'))) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
