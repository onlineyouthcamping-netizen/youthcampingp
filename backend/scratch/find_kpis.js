const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('taskKpis =') || lines[i].includes('filteredTasks =')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    for (let j = Math.max(0, i - 1); j < Math.min(lines.length, i + 8); j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
  }
}
