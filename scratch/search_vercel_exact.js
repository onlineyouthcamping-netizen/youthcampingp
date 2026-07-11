const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\os';
const excludeDirs = ['node_modules', '.next', 'dist', '.git', 'scratch'];
const patterns = [/patelparth3315/i, /ssr-git-main/i, /ctrls-projects/i];
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
      if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip'].includes(ext)) continue;
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          for (const pattern of patterns) {
            if (pattern.test(line)) {
              results.push({
                file: fullPath.replace('d:\\os\\', ''),
                line: idx + 1,
                content: line.trim()
              });
              break;
            }
          }
        });
      } catch (e) {}
    }
  }
}

searchDir(rootDir);
console.log('Search Results for Vercel preview URL:', results);
