const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/utils/pdfGenerator.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PDF GENERATOR DISCOUNT SECTION START:");
for (let i = 120; i < 180; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
