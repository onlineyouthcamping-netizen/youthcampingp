const fs = require('fs');
const path = require('path');

const searchDirs = [
  'd:\\os\\ADMIN-PANEL\\dist',
  'd:\\os\\frontend\\.next'
];

const patterns = [
  /localhost/i,
  /127\.0\.0\.1/,
  /onrender\.com/i,
  /vercel\.app/i,
  /youthcamping\.in/i
];

const results = [];

function searchDir(dir) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (err) {
    return;
  }

  for (const file of files) {
    const fullPath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (err) {
      continue;
    }

    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (stat.isFile()) {
      const ext = path.extname(file).toLowerCase();
      // Only search code/markup compiled assets
      if (!['.js', '.css', '.html', '.json'].includes(ext)) {
        continue;
      }

      // Avoid searching lockfiles or very large package lists if accidentally copied
      if (file.includes('package-lock') || file.includes('manifest.json') || file.includes('react-loadable-manifest.json')) {
        continue;
      }

      let content;
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch (err) {
        continue;
      }

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          // Highlight specific match
          results.push({
            file: fullPath.replace('d:\\os\\', ''),
            pattern: pattern.toString()
          });
          break;
        }
      }
    }
  }
}

console.log('Searching build outputs for local/outdated domains...');
searchDirs.forEach(searchDir);
console.log(`Found ${results.length} matches in compiled production assets:`);
console.log(JSON.stringify(results, null, 2));
