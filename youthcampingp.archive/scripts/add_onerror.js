const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/components');
const fallback = 'https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=2070';

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      filelist = walkSync(filePath, filelist);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
      filelist.push(filePath);
    }
  });
  return filelist;
};

const files = walkSync(srcDir);
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Regex to find <img tags without onError
  // It looks for <img followed by anything except onError until the closing >
  // Using a replacer function to be safe
  const regex = /<img\s+(?![^>]*onError=)[^>]+>/g;
  
  let changed = false;
  const newContent = content.replace(regex, (match) => {
    if (match.includes('onError')) return match; // extra safety
    changed = true;
    return match.replace('<img ', `<img onError={(e) => { e.currentTarget.src = "${fallback}"; }} `);
  });

  if (changed) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${path.basename(file)}`);
    changedCount++;
  }
});

console.log(`Updated ${changedCount} files with onError handlers.`);
