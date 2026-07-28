const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceImages(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'ui') replaceImages(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      if (content.includes('<Image ')) {
        console.log('Modifying Image in:', fullPath);
        
        content = content.replace(/import Image from "next\/image";?\n?/g, '');
        content = content.replace(/import Image from 'next\/image';?\n?/g, '');
        
        if (!content.includes('OptimizedImage')) {
          const importStatement = `import { OptimizedImage } from "@/components/ui/OptimizedImage";\n`;
          let insertIndex = 0;
          const useClientMatch = content.match(/^(?:'use client'|"use client");?\s*/);
          if (useClientMatch) {
            insertIndex = useClientMatch[0].length;
          }
          const lastImportIndex = content.lastIndexOf('import ');
          if (lastImportIndex !== -1) {
             const endOfImport = content.indexOf('\n', lastImportIndex);
             content = content.slice(0, endOfImport + 1) + importStatement + content.slice(endOfImport + 1);
          } else {
             content = content.slice(0, insertIndex) + importStatement + content.slice(insertIndex);
          }
        }
        
        // Match <Image ... />
        // Replace fill with tailwind classes
        content = content.replace(/<Image\s/g, '<OptimizedImage ');
        
        // Remove fill attribute
        content = content.replace(/\s+fill\s*/g, ' ');

        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

replaceImages(srcDir);
console.log('Done replacing Image!');
