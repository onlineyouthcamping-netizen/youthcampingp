const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/OperationsHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("OperationsHubPage.tsx LINES 870-900:");
for (let i = 870; i < 900; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
