const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/app.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("APP.JS ROUTE REGISTRATIONS:");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('bookingRoutes') || lines[i].includes('/api/bookings')) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
