const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/OperationsHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("OperationsHubPage.tsx HEADERS:");
for (let i = 0; i < 20; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
