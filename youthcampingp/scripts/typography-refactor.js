const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

walkDir('d:/os/frontend/src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Replace uppercase utility class with capitalize (or remove it if already there)
    // Actually, replacing \buppercase\b with capitalize. But if there's already capitalize, we might get duplicates. 
    // Just replace ' uppercase ' with ' capitalize ', etc.
    content = content.replace(/(?<=["'\s`])uppercase(?=["'\s`])/g, 'capitalize');

    // 2. Replace font-black with font-bold
    content = content.replace(/(?<=["'\s`])font-black(?=["'\s`])/g, 'font-bold');

    // 3. For navbar specifically, replace font-bold with font-medium
    if (filePath.includes('Navbar.tsx')) {
      content = content.replace(/(?<=["'\s`])font-bold(?=["'\s`])/g, 'font-medium');
    }

    // 4. Convert obvious ALL CAPS strings inside JSX text nodes to Title Case
    // We use a regex that looks for typical ALL CAPS phrases
    const allCapsRegex = />\s*([A-Z][A-Z\s,.'-]{3,})\s*</g;
    content = content.replace(allCapsRegex, (match, p1) => {
      // Don't modify if it's completely without letters
      if (!/[A-Z]/.test(p1) || /[a-z]/.test(p1)) return match;
      return match.replace(p1, toTitleCase(p1));
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
