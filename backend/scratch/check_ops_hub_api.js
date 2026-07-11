const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/OperationsHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("OperationsHubPage.tsx API OR FETCH SEARCH:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('useEffect') || line.includes('axios') || line.includes('service') || line.includes('api.')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
