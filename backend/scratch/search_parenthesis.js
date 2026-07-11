const fs = require('fs');
const path = require('path');

function searchParenthesis(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchParenthesis(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('(') && content.includes(')') && (content.includes('trainClass') || content.includes('roomType') || content.includes('pickupCity'))) {
        console.log(`Match in ${filePath}:`);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('(') && line.includes(')') && (line.includes('train') || line.includes('sharing') || line.includes('pickup') || line.includes('Sleeper'))) {
            console.log(`  ${i + 1}: ${line.trim()}`);
          }
        }
      }
    }
  }
}

searchParenthesis(path.join(__dirname, '../../ycadmin/src'));
