const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let inHotels = false;
let inTransport = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('activeTab === "hotels"')) {
    inHotels = true;
    console.log(`Hotels tab starts at line ${i + 1}`);
  }
  if (lines[i].includes('activeTab === "transport"')) {
    inHotels = false;
    inTransport = true;
    console.log(`Transport tab starts at line ${i + 1}`);
  }
  if (lines[i].includes('activeTab === "guides"')) {
    inTransport = false;
  }
  
  if ((inHotels || inTransport) && lines[i].includes('ACTION')) {
    console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
    for (let j = i; j < i + 15; j++) {
      if (lines[j]) console.log(`    ${j + 1}: ${lines[j].trim()}`);
    }
  }
}
