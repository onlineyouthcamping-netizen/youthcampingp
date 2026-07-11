const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/utils/pdfGenerator.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PDF GENERATOR VARIABLES BLOCK TOP:");
for (let i = 40; i < 80; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
