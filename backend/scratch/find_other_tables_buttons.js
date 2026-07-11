const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Add Other Transport') || lines[i].includes('View as Timeline') || lines[i].includes('More Filters')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
