const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the double bracket and replace it
content = content.replace(
  /\{\[\s*\[\s*\{/g,
  `{[\n                {`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Syntax error fixed successfully!");
