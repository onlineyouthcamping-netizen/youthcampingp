const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/prisma/schema.prisma');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("DATASOURCE BLOCK:");
for (let i = 0; i < 20; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
