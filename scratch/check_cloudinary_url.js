const http = require('https');

const url = "https://res.cloudinary.com/ddkndagvp/image/upload/v1780478627/youthcamping/trips/a2jrxnzuhvxatpj22dix.jpg";

const req = http.request(url, { method: 'HEAD' }, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  process.exit(0);
});

req.on('error', (e) => {
  console.error('Error:', e);
  process.exit(1);
});

req.end();
