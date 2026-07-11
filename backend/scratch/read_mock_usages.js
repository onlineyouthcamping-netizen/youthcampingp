const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("DepartureHubPage.tsx MOCK CONSTANTS USAGE:");
const mocks = ['MOCK_ACTIVITIES', 'MOCK_PAYMENTS', 'MOCK_TASKS', 'MOCK_DOCUMENTS', 'MOCK_CONV_LIST'];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  mocks.forEach(m => {
    if (line.includes(m) && !line.startsWith('const ' + m)) {
      console.log(`${i + 1} (${m}): ${line.trim()}`);
    }
  });
}
