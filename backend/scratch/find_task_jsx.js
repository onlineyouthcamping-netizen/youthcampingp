const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('activeTab === "tasks"') || (i > 2400 && i < 2550)) {
    if (lines[i].includes('activeTab === "tasks"') || lines[i].includes('filteredTasks.map') || lines[i].includes('CheckSquare') || lines[i].includes('Circle')) {
      console.log(`Line ${i + 1}: ${lines[i].trim()}`);
      for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 15); j++) {
        console.log(`${j + 1}: ${lines[j]}`);
      }
    }
  }
}
