const fs = require('fs');
const path = require('path');

function searchVal(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === '.antigravity') continue;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchVal(filePath);
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.toLowerCase().includes('vatsal') || content.toLowerCase().includes('jeel')) {
          console.log(`Found match in JSON file: ${filePath}`);
        }
      } catch(e) {}
    }
  }
}

searchVal('d:\\os');
