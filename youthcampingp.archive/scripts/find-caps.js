const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const allCapsRegex = />\s*([A-Z][A-Z\s,.'-]{3,})\s*</g;

walkDir('d:/os/frontend/src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let matches;
    while ((matches = allCapsRegex.exec(content)) !== null) {
      // Check if it actually contains letters and no lowercase letters
      const str = matches[1];
      if (/[A-Z]/.test(str) && !/[a-z]/.test(str)) {
        console.log(`${filePath}: "${str}"`);
      }
    }
  }
});
