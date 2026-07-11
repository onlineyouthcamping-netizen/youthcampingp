const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PRISMA UPDATE CALL:");
for (let i = 1090; i < 1130; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
