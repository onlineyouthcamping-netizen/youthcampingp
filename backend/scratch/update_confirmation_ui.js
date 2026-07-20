const fs = require('fs');
const file = 'frontend/src/app/book/confirmation/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add queryName extraction
content = content.replace(
  /const queryCity = searchParams\.get\('city'\);/,
  "const queryCity = searchParams.get('city');\n  const queryName = searchParams.get('name');"
);

// Add name to displayBooking
content = content.replace(
  /pickupCity: queryCity \|\| 'Selected Location',/,
  "pickupCity: queryCity || 'Selected Location',\n    name: queryName || 'Lead Traveler',"
);

// Style changes
// bg-slate-950 -> bg-slate-50
content = content.replace(/bg-slate-950/g, 'bg-slate-50');
// text-white -> text-slate-900 (for main body and headings)
content = content.replace(/text-white/g, 'text-slate-900');
// text-slate-300 -> text-slate-600
content = content.replace(/text-slate-300/g, 'text-slate-600');
// bg-slate-900 -> bg-white
content = content.replace(/bg-slate-900/g, 'bg-white');
// border-white\/10 -> border-slate-200
content = content.replace(/border-white\/10/g, 'border-slate-200');
// border-white\/5 -> border-slate-100
content = content.replace(/border-white\/5/g, 'border-slate-100');
// bg-white\/5 -> bg-slate-100
content = content.replace(/bg-white\/5/g, 'bg-slate-100');
// bg-gradient-to-r from-slate-900 to-slate-800 -> bg-slate-50
content = content.replace(/bg-gradient-to-r from-slate-900 to-slate-800/g, 'bg-slate-50');
// bg-white\/\[0\.02\] -> bg-white
content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-white');
// bg-slate-800 -> bg-slate-200
content = content.replace(/bg-slate-800/g, 'bg-slate-200');

fs.writeFileSync(file, content);
console.log("Updated confirmation page UI");
