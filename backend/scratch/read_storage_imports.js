const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/controllers/bookingController.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("SUPABASE STORAGE IMPORTS:");
for (let i = 0; i < 30; i++) {
  if (lines[i].includes('storage') || lines[i].includes('Storage')) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
