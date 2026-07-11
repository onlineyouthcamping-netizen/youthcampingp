const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("DepartureHubPage.tsx LINES 330-360:");
for (let i = 330; i < Math.min(360, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
console.log("DepartureHubPage.tsx LINES 390-420:");
for (let i = 390; i < Math.min(420, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
