const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/.gitignore');
if (fs.existsSync(filePath)) {
  console.log(".GITIGNORE CONTENT:\n", fs.readFileSync(filePath, 'utf8'));
} else {
  console.log(".gitignore does not exist in ycadmin");
}
