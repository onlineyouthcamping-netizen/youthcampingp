const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const matchHotel = content.match(/Total Nights[\s\S]*?occupancy/);
if (matchHotel) {
  console.log("Hotel chunk matches:");
  console.log(JSON.stringify(matchHotel[0]));
} else {
  console.log("Hotel chunk NOT found!");
}

const matchAct = content.match(/Total Activities[\s\S]*?Optional Activities/);
if (matchAct) {
  console.log("Activity chunk matches:");
  console.log(JSON.stringify(matchAct[0]));
} else {
  console.log("Activity chunk NOT found!");
}
