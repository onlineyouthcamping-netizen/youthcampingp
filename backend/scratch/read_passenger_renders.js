const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PASSENGER RENDER BLOCKS:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('passengers.map') || line.includes('passengersList.map') || line.includes('p.name')) {
    if (line.includes('.map') || line.includes('<td>') || line.includes('<span') || line.includes('<div')) {
      console.log(`${i + 1}: ${line.trim()}`);
    }
  }
}
