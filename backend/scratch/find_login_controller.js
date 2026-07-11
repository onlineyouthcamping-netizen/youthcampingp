const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchDir(filePath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('login') || content.includes('auth')) {
        console.log(`Found in: ${filePath}`);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('email') || lines[i].includes('password') || lines[i].includes('admin')) {
            console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
          }
        }
      }
    }
  }
}

searchDir(path.join(__dirname, '../../backend/src'));
