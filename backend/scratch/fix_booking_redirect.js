const fs = require('fs');
const file = 'frontend/src/app/book/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /router\.push\(`\/book\/confirmation\?bookingId=\$\{bId\}&tripName=\$\{encodeURIComponent\(initialParams\.tripName \|\| ''\)\}&date=\$\{encodeURIComponent\(initialParams\.date \|\| ''\)\}&city=\$\{encodeURIComponent\(selectedCity\?\.cityName \|\| 'Delhi'\)\}`\);/,
  "router.push(`/book/confirmation?bookingId=${bId}&tripName=${encodeURIComponent(initialParams.tripName || '')}&date=${encodeURIComponent(initialParams.date || '')}&city=${encodeURIComponent(selectedCity?.cityName || 'Delhi')}&name=${encodeURIComponent(formData.name || formData.fullName || '')}`);"
);

fs.writeFileSync(file, content);
console.log("Updated redirect URL to include name");
