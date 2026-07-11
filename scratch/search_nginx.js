const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\os';
const excludeDirs = ['node_modules', '.next', 'dist', '.git', 'scratch'];
const results = [];

function searchDir(dir) {
  let files;
  try { files = fs.readdirSync(dir); } catch (e) { return; }
  for (const file of files) {
    const fullPath = path.join(dir, file);
    let stat;
    try { stat = fs.statSync(fullPath); } catch (e) { continue; }
    if (stat.isDirectory()) {
      if (excludeDirs.includes(file)) continue;
      searchDir(fullPath);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.conf' || ext === '.nginx' || file.includes('nginx')) {
        results.push(fullPath);
      } else if (['.md', '.txt', '.json', '.js', '.ts'].includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.toLowerCase().includes('nginx')) {
            results.push(fullPath + ' (contains "nginx")');
          }
        } catch (e) {}
      }
    }
  }
}

searchDir(rootDir);
console.log('NGINX Search Results:', results);
