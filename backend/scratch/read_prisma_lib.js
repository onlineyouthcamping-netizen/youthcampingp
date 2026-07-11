const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/prisma.js');
const content = fs.readFileSync(filePath, 'utf8');
console.log("PRISMA.JS CONTENT:\n", content);
