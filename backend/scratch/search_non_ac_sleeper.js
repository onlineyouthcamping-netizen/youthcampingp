const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchDir(filePath, query);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
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

console.log("SEARCHING FOR 'NON-AC SLEEPER':");
searchDir(path.join(__dirname, '../../ycadmin/src'), 'NON-AC SLEEPER');
