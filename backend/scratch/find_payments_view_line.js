const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('border-slate-200') && lines[i].includes('View') && i > 2300 && i < 2500) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    break;
  }
}
