const http = require('http');

const ENDPOINTS = [
  '/api/trips',
  '/api/reviews',
  '/api/blogs',
  '/api/page-builder/home',
  '/api/settings',
  '/api/theme'
];

function testEndpoint(path) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          path,
          status: res.statusCode,
          size: body.length,
          duration,
          success: res.statusCode === 200
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        status: null,
        size: 0,
        duration: Date.now() - start,
        success: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        path,
        status: null,
        size: 0,
        duration: Date.now() - start,
        success: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function run() {
  console.log('=== Benchmarking Backend API Response Times on Port 3001 ===');
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    if (result.success) {
      console.log(`✅ ${result.path} - HTTP ${result.status} - ${result.size} bytes - ${result.duration}ms`);
    } else {
      console.log(`❌ ${result.path} - ERROR: ${result.error || 'HTTP ' + result.status} - took ${result.duration}ms`);
    }
  }
}

run();
