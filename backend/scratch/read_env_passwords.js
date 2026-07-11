const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log("ENV CONTROLLERS OR PASSWORDS:");
  envContent.split('\n').forEach(line => {
    if (line.includes('PASS') || line.includes('KEY') || line.includes('SECRET') || line.includes('ADMIN')) {
      console.log(line.trim());
    }
  });
}
