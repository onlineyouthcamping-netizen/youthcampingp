const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let found = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Train Bookings')) {
    found = true;
    console.log(`Train Bookings section found at line ${i + 1}`);
  }
  if (found && lines[i].includes('OTHER BOOKINGS')) {
    found = false;
  }
  if (found) {
    if (lines[i].includes('View') || lines[i].includes('ACTION') || lines[i].includes('SHATABDI')) {
      console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
      for (let j = i; j < i + 10; j++) {
        if (lines[j]) console.log(`    ${j + 1}: ${lines[j].trim()}`);
      }
    }
  }
}
