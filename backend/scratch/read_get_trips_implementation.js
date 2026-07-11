const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/controllers/tripController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("tripController.js getTrips IMPLEMENTATION:");
for (let i = 55; i < 110; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
