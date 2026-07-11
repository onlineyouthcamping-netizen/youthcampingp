const fs = require('fs');
const path = require('path');

const readEnv = (filename) => {
  const filePath = path.join(__dirname, '../../backend', filename);
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    console.log(`=== ${filename} ===`);
    lines.forEach(line => {
      if (line.includes('DATABASE_URL') || line.includes('PORT')) {
        console.log(line.trim());
      }
    });
  }
};

readEnv('.env');
readEnv('.env.local');
