const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("MATCHES FOR PASSENGERS TAB JSX:");
let count = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('value="passengers"') || line.includes('value=\'passengers\'') || line.includes('activeTab === "passengers"') || line.includes('activeTab === \'passengers\'')) {
    console.log(`${i + 1}: ${line.trim()}`);
    // Print 35 lines after
    for (let j = 1; j <= 35; j++) {
      if (lines[i + j]) {
        console.log(`  +${j}: ${lines[i + j].trim()}`);
      }
    }
    count++;
  }
}
if (count === 0) {
  // Search for generic passengers tab contents
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('Passenger Manifest') || line.includes('Traveller List') || line.includes('Passenger Details')) {
      if (i >= 1200 && i <= 2300) {
        console.log(`${i + 1}: ${line.trim()}`);
      }
    }
  }
}
