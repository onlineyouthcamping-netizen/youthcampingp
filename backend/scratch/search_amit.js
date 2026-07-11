const fs = require('fs');
const path = require('path');

function searchAmit(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchAmit(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.toLowerCase().includes('chanchad') || content.includes('coNames') || content.includes('Amit')) {
        console.log(`Match in ${filePath}:`);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('chanchad') || line.includes('coNames') || line.includes('Amit')) {
            console.log(`  ${i + 1}: ${line.trim()}`);
          }
        }
      }
    }
  }
}

searchAmit(path.join(__dirname, '../../ycadmin/src'));
