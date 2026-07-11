const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log("BookingDetailsView.tsx imports:");
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('import')) {
      console.log(`${i + 1}: ${lines[i].trim()}`);
    }
  }
} else {
  console.log("BookingDetailsView.tsx does not exist!");
}
