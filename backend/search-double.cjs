const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '../ycadmin/src/pages/admin/DepartureHubPage.tsx'), 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('computedPayments')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
