const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log("DATABASE_URL in .env:");
  envContent.split('\n').forEach(line => {
    if (line.includes('DATABASE_URL')) {
      console.log(line.trim());
    }
  });
} else {
  console.log(".env file not found at " + envPath);
}
