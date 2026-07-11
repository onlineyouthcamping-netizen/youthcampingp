const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const keywords = ['addPayment', 'addTask', 'addActivity', 'uploadDoc', 'Modal', 'Dialog', 'add-', 'create-'];
for (let i = 0; i < lines.length; i++) {
  for (const kw of keywords) {
    if (lines[i].toLowerCase().includes(kw.toLowerCase())) {
      console.log(`Line ${i + 1} (${kw}): ${lines[i].trim()}`);
    }
  }
}
