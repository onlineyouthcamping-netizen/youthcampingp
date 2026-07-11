const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/utils/pdfGenerator.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("PDF GENERATOR ROW MAPPING BLOCK:");
for (let i = 130; i < 200; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
