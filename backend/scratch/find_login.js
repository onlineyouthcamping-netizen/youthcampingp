const fs = require('fs');
const path = require('path');

function searchFile(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchFile(filePath, pattern);
    } else if (file.toLowerCase().includes(pattern.toLowerCase())) {
      console.log(`Found: ${filePath}`);
    }
  }
}

searchFile(path.join(__dirname, '../../ycadmin/src'), 'InquiriesPage');
