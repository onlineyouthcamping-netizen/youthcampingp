const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '../ycadmin/src/pages/admin/DepartureHubPage.tsx'), 'utf8');
const lines = content.split('\n');
for (let i = 330; i <= 420; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
