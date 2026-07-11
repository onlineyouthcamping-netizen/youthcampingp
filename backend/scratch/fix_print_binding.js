const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'onClick={() => { window.print(); setMoreActionsOpen(false); }}',
  'onClick={() => { handlePrintManifest(); setMoreActionsOpen(false); }}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Print button bound successfully!");
