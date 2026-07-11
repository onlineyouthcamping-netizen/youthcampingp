const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/routes/opsRoutes.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('vendor') || lines[i].includes('assign') || lines[i].includes('payment') || lines[i].includes('status')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
