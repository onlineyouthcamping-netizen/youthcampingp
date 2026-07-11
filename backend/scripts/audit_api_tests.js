const axios = require('axios');
const {
  assertMutatingTestSafety,
  requireEnvironmentValue,
} = require('./src/utils/testSafety');

const BASE_URL = assertMutatingTestSafety({
  apiUrl: requireEnvironmentValue('TEST_API_URL')
});

async function runAudit() {
  console.log('=== API ENDPOINTS AUDIT ===');
  
  const endpoints = [
    { name: 'Health Check', url: '/health', method: 'GET' },
    { name: 'Trips List', url: '/trips', method: 'GET' },
    { name: 'Reviews List', url: '/reviews', method: 'GET' },
    { name: 'Blogs List', url: '/blogs', method: 'GET' },
    { name: 'Settings', url: '/settings', method: 'GET' },
    { name: 'Theme', url: '/theme', method: 'GET' },
    { name: 'Attractions', url: '/attractions', method: 'GET' }
  ];

  for (const ep of endpoints) {
    try {
      const start = Date.now();
      const res = await axios({
        method: ep.method,
        url: `${BASE_URL}${ep.url}`,
        timeout: 5000
      });
      const latency = Date.now() - start;
      console.log(`[PASS] ${ep.name} (${ep.method} ${ep.url}) - Status: ${res.status}, Latency: ${latency}ms, Data Size: ${JSON.stringify(res.data).length} bytes`);
    } catch (err) {
      console.log(`[FAIL] ${ep.name} (${ep.method} ${ep.url}) - Error: ${err.message}`);
      if (err.response) {
        console.log(`       Response Status: ${err.response.status}`);
        console.log(`       Response Data:`, err.response.data);
      }
    }
  }

  // Test submitting a test inquiry
  try {
    console.log('\nTesting Inquiry Submission...');
    const inqRes = await axios.post(`${BASE_URL}/inquiries`, {
      name: 'Truth Mode Auditor',
      phone: '9999999999',
      email: 'auditor@truthmode.com',
      message: 'This is a verified audit inquiry submission.',
      date: '2026-07-01',
      count: 2
    });
    console.log(`[PASS] Inquiry Submission - Status: ${inqRes.status}`);
    console.log(`       Response:`, inqRes.data);
  } catch (err) {
    console.log(`[FAIL] Inquiry Submission - Error: ${err.message}`);
    if (err.response) {
      console.log(`       Response Data:`, err.response.data);
    }
  }
}

runAudit();
