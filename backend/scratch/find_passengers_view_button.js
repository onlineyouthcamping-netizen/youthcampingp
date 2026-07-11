const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let inPaxTab = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('activeTab === "passengers"')) {
    inPaxTab = true;
  }
  if (inPaxTab && lines[i].includes('activeTab ===') && !lines[i].includes('passengers')) {
    inPaxTab = false;
  }
  if (inPaxTab && (lines[i].includes('<button') || lines[i].includes('onClick'))) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
