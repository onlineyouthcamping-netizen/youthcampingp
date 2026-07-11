const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace room header
content = content.replace(
  '<th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">ROOM</th>',
  ''
);

// Replace room cell
content = content.replace(
  '<td className="p-3 font-mono font-bold text-slate-600">{p.roomNo}</td>',
  ''
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("ROOM column removed successfully!");
