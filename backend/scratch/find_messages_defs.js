const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('MOCK_MESSAGES') || lines[i].includes('MOCK_CONV_LIST')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    for (let j = Math.max(0, i - 1); j < Math.min(lines.length, i + 8); j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
  }
}
