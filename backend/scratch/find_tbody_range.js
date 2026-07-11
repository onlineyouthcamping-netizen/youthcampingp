const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/OperationsHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("OperationsHubPage.tsx TBODY LOCATION:");
let startLine = -1;
let endLine = -1;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('<tbody className="divide-y divide-slate-100">')) {
    startLine = i + 1;
  }
  if (startLine !== -1 && line.includes('</tbody>') && endLine === -1 && i > startLine) {
    endLine = i + 1;
    break;
  }
}
console.log(`Start Line: ${startLine}, End Line: ${endLine}`);
for (let i = startLine - 1; i < endLine; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
