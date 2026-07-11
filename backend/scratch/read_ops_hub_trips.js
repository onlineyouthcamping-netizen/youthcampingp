const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/OperationsHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("OperationsHubPage.tsx TRIPS DATA USAGE:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('trips') || line.includes('allTrips') || line.includes('getTrips') || line.includes('/trips')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
