const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, '../src/controllers/emailComposerController.js');
const emailLibPath = path.join(__dirname, '../src/lib/email.js');

if (fs.existsSync(controllerPath)) {
  const content = fs.readFileSync(controllerPath, 'utf8');
  const lines = content.split('\n');
  console.log("MATCH IN emailComposerController.js:");
  for (let i = 390; i < 430; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

if (fs.existsSync(emailLibPath)) {
  const content = fs.readFileSync(emailLibPath, 'utf8');
  const lines = content.split('\n');
  console.log("\nMATCH IN email.js:");
  for (let i = 420; i < 460; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
