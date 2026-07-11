const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/package.json');
const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
console.log("BACKEND DEPENDENCIES:", content.dependencies);
