const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/controllers/opsController.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('createHotelBooking') || lines[i].includes('createTransport') || lines[i].includes('getHotel') || lines[i].includes('getTransport')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
