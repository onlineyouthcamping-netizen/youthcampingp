const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/OperationsHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("OperationsHubPage.tsx LINES 50-80:");
for (let i = 49; i < Math.min(80, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
