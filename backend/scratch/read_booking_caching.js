const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("CACHE OCCURRENCES IN bookingController.js:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('cache.get') || line.includes('cache.set')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
