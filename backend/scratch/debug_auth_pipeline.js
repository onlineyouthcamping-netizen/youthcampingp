/**
 * Auth Pipeline End-to-End Debugger
 */
require('../src/lib/env');
const { prisma } = require('../src/lib/prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

async function testAuthPipeline() {
  console.log('--------------------------------------------------');
  console.log('1. Checking Superadmin User in DB...');
  const admin = await prisma.admin.findFirst({
    where: { isActive: true }
  });

  if (!admin) {
    console.error('❌ No active admin found in database!');
    process.exit(1);
  }

  console.log(`✓ Found Admin: ID=${admin.id}, Name=${admin.name}, Email=${admin.email}, Role=${admin.role}, TokenVersion=${admin.tokenVersion}`);

  console.log('\n2. Testing Token Generation...');
  const secret = process.env.JWT_SECRET;
  console.log(`✓ JWT_SECRET length: ${secret ? secret.length : 0}`);

  const token = jwt.sign(
    { id: admin.id, role: admin.role, tenantId: admin.tenantId, tokenVersion: admin.tokenVersion || 0 },
    secret,
    { expiresIn: '7d' }
  );

  console.log(`✓ Generated JWT Token: ${token.substring(0, 30)}...`);

  console.log('\n3. Testing Token Verification...');
  const decoded = jwt.verify(token, secret);
  console.log(`✓ Decoded Payload:`, decoded);

  console.log('\n4. Testing Express App Route Invocations with Token...');
  const app = require('../src/app');
  const http = require('http');
  const server = http.createServer(app);

  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

  const endpoints = [
    '/api/admin/me',
    '/api/knowledge/nav-state',
    '/api/erp/notifications',
    '/api/announcements',
    '/api/admin/stats?dateFilter=all',
    '/api/bookings?balanceOnly=false&page=1&limit=25',
    '/api/admin/users/sales-executives'
  ];

  const makeRequest = (path, token) => new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });

  for (const ep of endpoints) {
    const { status, body } = await makeRequest(ep, token);
    let data;
    try { data = JSON.parse(body); } catch(e) { data = body; }

    if (status === 200) {
      console.log(`  ✓ GET ${ep} => HTTP ${status} OK`);
    } else {
      console.error(`  ✗ GET ${ep} => HTTP ${status} FAILED:`, JSON.stringify(data));
    }
  }

  server.close();
  console.log('--------------------------------------------------');
}

testAuthPipeline().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
