const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("DECLARATIONS OF meta:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('const meta') || line.includes('let meta')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
