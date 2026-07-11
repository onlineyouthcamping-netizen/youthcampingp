const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const keywords = ['MOCK_TASKS', 'MOCK_DOCUMENTS', 'MOCK_COMM', 'MOCK_FEED', 'MOCK_MESSAGE', 'task.md', 'communication', 'documents', 'reports'];
for (let i = 0; i < lines.length; i++) {
  for (const kw of keywords) {
    if (lines[i].includes(kw)) {
      console.log(`Line ${i + 1} (${kw}): ${lines[i].trim()}`);
    }
  }
}
