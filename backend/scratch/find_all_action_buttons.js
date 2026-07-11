const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('View') && lines[i].includes('<button') && (lines[i].includes('text-slate-600') || lines[i].includes('text-[#F97316]'))) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
