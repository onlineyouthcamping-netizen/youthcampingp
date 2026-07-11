const fs = require('fs');
const path = require('path');

function searchBackend(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchBackend(filePath, query);
    } else if (file.endsWith('.js') || file.endsWith('.json')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.toLowerCase().includes(query.toLowerCase())) {
        console.log(`Match in ${filePath}:`);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(query.toLowerCase())) {
            console.log(`  ${i + 1}: ${lines[i].trim()}`);
          }
        }
      }
    }
  }
}

console.log("SEARCHING BACKEND FOR 'NON-AC SLEEPER':");
searchBackend(path.join(__dirname, '../src'), 'NON-AC SLEEPER');
