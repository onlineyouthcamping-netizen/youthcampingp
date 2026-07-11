const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/controllers/tripController.js');
let content = "";
try {
  content = fs.readFileSync(filePath, 'utf8');
} catch (e) {
  // If not in controllers, let's search routes
  console.log("tripController.js not found, trying routes");
}

if (content) {
  const lines = content.split('\n');
  console.log("tripController.js TRIPS GET ROUTE:");
  let print = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('getAllTrips') || line.includes('getTrips') || line.includes('findMany')) {
      print = true;
    }
    if (print) {
      console.log(`${i + 1}: ${line}`);
      if (line.includes('res.json') || line.includes('res.send') || line.includes('}')) {
        print = false;
      }
    }
  }
}
