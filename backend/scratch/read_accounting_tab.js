const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/components/admin/BookingDetailsView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let insideAccounting = false;
let braceCount = 0;
console.log("ACCOUNTING TAB RENDER BLOCK:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('value="accounting"') || line.includes('adminActiveTab === "accounting"')) {
    insideAccounting = true;
  }
  if (insideAccounting) {
    console.log(`${i + 1}: ${line}`);
    // Simple heuristic to print around 100 lines from where it starts
    if (line.includes('</TabsContent>') || line.includes('</div>') && braceCount > 50) {
      // we can stop after some lines
    }
    braceCount++;
    if (braceCount > 150) {
      break;
    }
  }
}
