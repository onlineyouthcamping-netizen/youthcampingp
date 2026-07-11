const http = require('http');

const req = http.request("http://localhost:8080", { method: 'GET' }, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  process.exit(0);
});

req.on('error', (e) => {
  console.error('Error:', e);
  process.exit(1);
});

req.end();
