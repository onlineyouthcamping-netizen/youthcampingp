const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

function replaceImages(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'ui') replaceImages(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('<img ')) {
        console.log('Modifying:', fullPath);
        
        // Need to add import
        if (!content.includes('OptimizedImage')) {
          const importStatement = `import { OptimizedImage } from "@/components/ui/OptimizedImage";\n`;
          
          // Check if "use client" is at the top
          let insertIndex = 0;
          const useClientMatch = content.match(/^(?:'use client'|"use client");?\s*/);
          if (useClientMatch) {
            insertIndex = useClientMatch[0].length;
          }
          
          // insert after last import if possible, else after "use client"
          const lastImportIndex = content.lastIndexOf('import ');
          if (lastImportIndex !== -1) {
             const endOfImport = content.indexOf('\n', lastImportIndex);
             content = content.slice(0, endOfImport + 1) + importStatement + content.slice(endOfImport + 1);
          } else {
             content = content.slice(0, insertIndex) + importStatement + content.slice(insertIndex);
          }
        }
        
        // Remove standard onError handlers
        content = content.replace(/onError=\{[^}]+\}/g, '');
        
        // Replace <img with <OptimizedImage
        content = content.replace(/<img\s/g, '<OptimizedImage ');
        
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

replaceImages(componentsDir);
console.log('Done!');
