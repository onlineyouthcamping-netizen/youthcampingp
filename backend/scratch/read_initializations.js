const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("INITIALIZATION LINES 520-550:");
for (let i = 520; i < 550; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log("\nINITIALIZATION LINES 600-630:");
for (let i = 600; i < 630; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
