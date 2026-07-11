const fs = require('fs');

const raw = fs.readFileSync('C:\\Users\\Dell\\.gemini\\antigravity\\brain\\63e81a66-f03d-4b40-bff8-36ea2b2adc2e\\scratch\\search_results.json', 'utf8');
const results = JSON.parse(raw);

const vercelUrls = results.filter(item => {
  return /vercel\.app/i.test(item.content) || /vercel\.app/i.test(item.file);
});

console.log(`Found ${vercelUrls.length} occurrences of vercel.app:`);
console.log(JSON.stringify(vercelUrls, null, 2));
