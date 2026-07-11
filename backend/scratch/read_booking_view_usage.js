const fs = require('fs');
const path = require('path');

function searchUsage(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchUsage(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('BookingDetailsView')) {
        console.log(`Match in ${filePath}:`);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('BookingDetailsView')) {
            console.log(`  ${i + 1}: ${lines[i].trim()}`);
          }
        }
      }
    }
  }
}

searchUsage(path.join(__dirname, '../../ycadmin/src'));
