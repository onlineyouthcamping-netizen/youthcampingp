const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/debug.log');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  console.log("LAST 100 LINES OF debug.log:");
  const start = Math.max(0, lines.length - 100);
  for (let i = start; i < lines.length; i++) {
    console.log(lines[i]);
  }
} else {
  console.log("debug.log not found");
}
