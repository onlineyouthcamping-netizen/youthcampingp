const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../ycadmin/src/pages/admin/AccountingPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace table data with empty array mapping.
// We'll just replace the specific hardcoded array
content = content.replace(
  /\{\[\s*\{\s*date:\s*"03 Jul 2024 10:30 AM"[\s\S]*?desc:\s*"Opening Balance"[\s\S]*?\}\s*\]\.map/m,
  "{[].map"
);

// Replace summary stats
content = content.replace(/₹ 88,374\.60/g, '₹ 0.00');
content = content.replace(/₹ 1,24,560\.00/g, '₹ 0.00');
content = content.replace(/₹ 45,150\.00/g, '₹ 0.00');
content = content.replace(/₹ 8,450\.00/g, '₹ 0.00');
content = content.replace(/₹ 50,000\.00/g, '₹ 0.00');
content = content.replace(/₹ 25,625\.60/g, '₹ 0.00');
content = content.replace(/₹ 9,000\.00/g, '₹ 0.00');
content = content.replace(/₹ 5,299\.00/g, '₹ 0.00');

// Replace pie chart data
content = content.replace(
  /data=\{\[\s*\{\s*name:\s*"Office Rent"[\s\S]*?\{\s*name:\s*"Others",\s*value:\s*5299\s*\}\s*\]\}/m,
  "data={[{ name: 'No Data', value: 1 }]}"
);

// Replace top categories list below pie chart
content = content.replace(
  /<div className="space-y-2 text-\[11px\] font-semibold text-slate-650">[\s\S]*?<\/div>\s*<\/Card>/m,
  '<div className="space-y-2 text-[11px] font-semibold text-slate-650 flex items-center justify-center h-24 text-slate-400">No categories to display</div>\n              </Card>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Replaced hardcoded data in AccountingPage.tsx");
