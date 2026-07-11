const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("MATCHES FOR DESCRIPTION OR PARENTHESIS:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('SHARING') || line.includes('Sleeper') || line.includes('NON-AC')) {
    if (line.includes('(') || line.includes('`')) {
      console.log(`${i + 1}: ${line.trim()}`);
    }
  }
}
