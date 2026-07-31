/**
 * Production Authentication & Authorization System Integration Test Suite
 * YouthCamping OS
 */

require('../src/lib/env');
const jwt = require('jsonwebtoken');
const { hasPermission, ROLE_PERMISSIONS, PERMISSIONS } = require('../src/config/permissions');
const { authenticate, requirePermission } = require('../src/middleware/auth');
const express = require('express');
const http = require('http');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 RUNNING PRODUCTION AUTHENTICATION INTEGRATION SUITE');
  console.log('====================================================\n');

  // --- TEST GROUP 1: JWT SIGNING & VERIFICATION CONSISTENCY ---
  console.log('🔹 1. JWT Signing, Verification & Expiration Test');
  const secret = process.env.JWT_SECRET;
  assert(secret && secret.length >= 32, 'JWT_SECRET is securely set and >= 32 chars');

  const testPayload = { id: 'test_admin_id', role: 'admin', tenantId: 'default', tokenVersion: 1 };
  const token = jwt.sign(testPayload, secret, { expiresIn: '1h' });
  assert(typeof token === 'string' && token.split('.').length === 3, 'JWT token correctly generated with 3 parts');

  const decoded = jwt.verify(token, secret);
  assert(decoded.id === testPayload.id && decoded.role === testPayload.role, 'JWT payload verified accurately');

  // Test expiration handling
  const expiredToken = jwt.sign(testPayload, secret, { expiresIn: '-1s' });
  try {
    jwt.verify(expiredToken, secret);
    assert(false, 'Expired token should fail verification');
  } catch (err) {
    assert(err.name === 'TokenExpiredError', 'Expired token throws TokenExpiredError');
  }

  // --- TEST GROUP 2: ROLE-PERMISSION MAP & IMMUTABILITY (NO SHARED MUTATION) ---
  console.log('\n🔹 2. Role-Permission Integrity & Immutability Test');
  const originalAdminPermsCount = ROLE_PERMISSIONS.admin.length;
  
  // Simulate multiple calls to role-permission checks with custom permissions
  const mockUser1 = { role: 'admin', customPermissions: ['custom.perm1', 'custom.perm2'] };
  const mockUser2 = { role: 'admin', customPermissions: ['custom.perm3'] };

  hasPermission(mockUser1, 'custom.perm1');
  hasPermission(mockUser2, 'custom.perm3');

  assert(ROLE_PERMISSIONS.admin.length === originalAdminPermsCount, 'ROLE_PERMISSIONS.admin length remains untouched after user checks (No reference mutation)');
  assert(!ROLE_PERMISSIONS.admin.includes('custom.perm1'), 'Global ROLE_PERMISSIONS dictionary not polluted by custom user perms');

  // --- TEST GROUP 3: REQUIRED PERMISSIONS COVERAGE ---
  console.log('\n🔹 3. Mandatory Protected API Permission Coverage Test');
  const requiredAdminPermissions = [
    'notifications.view_own',
    'notifications.mark_read',
    'activity.view',
    'recurring_tasks.view',
    'customers.timeline.view',
    'dashboard.view',
    'bookings.view',
    'trips.view',
    'vendors.view',
    'accounting.view',
    'company_documents.view',
    'station_payments.view',
    'website.view'
  ];

  requiredAdminPermissions.forEach(perm => {
    assert(hasPermission('admin', perm), `Admin role has explicit access to '${perm}'`);
  });

  // --- TEST GROUP 4: STRUCTURED AUTHENTICATION & AUTHORIZATION MIDDLEWARE ---
  console.log('\n🔹 4. Express Auth Middleware & Structured Error Test');
  const app = express();
  app.use(express.json());

  app.get('/test-protected', authenticate, (req, res) => {
    res.json({ success: true, user: req.user });
  });

  app.get('/test-perm', authenticate, requirePermission('notifications.view_own'), (req, res) => {
    res.json({ success: true, message: 'Granted' });
  });

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  // Test 4.1: Missing Bearer Header -> 401 Unauthenticated
  const res1 = await fetch(`${baseUrl}/test-protected`);
  const data1 = await res1.json();
  assert(res1.status === 401 && data1.success === false, 'Missing Bearer token returns 401 Unauthenticated');

  // Test 4.2: Invalid Token -> 401 INVALID_TOKEN
  const res2 = await fetch(`${baseUrl}/test-protected`, {
    headers: { Authorization: 'Bearer invalid.jwt.token' }
  });
  const data2 = await res2.json();
  assert(res2.status === 401 && data2.code === 'INVALID_TOKEN', 'Invalid JWT token returns 401 with code: INVALID_TOKEN');

  // Test 4.3: Expired Token -> 401 TOKEN_EXPIRED
  const res3 = await fetch(`${baseUrl}/test-protected`, {
    headers: { Authorization: `Bearer ${expiredToken}` }
  });
  const data3 = await res3.json();
  assert(res3.status === 401 && data3.code === 'TOKEN_EXPIRED', 'Expired JWT token returns 401 with code: TOKEN_EXPIRED');

  server.close();

  // --- TEST GROUP 5: CORS PREFLIGHT & ORIGIN VALIDATION ---
  console.log('\n🔹 5. Production CORS Configuration Test');
  const { setupCORS } = require('../src/middleware/cors');
  const corsApp = express();
  setupCORS(corsApp);
  corsApp.get('/test-cors', (req, res) => res.json({ ok: true }));

  const corsServer = http.createServer(corsApp);
  await new Promise(resolve => corsServer.listen(0, resolve));
  const corsPort = corsServer.address().port;

  const corsRes = await fetch(`http://127.0.0.1:${corsPort}/test-cors`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://admin.youthcamping.online',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Authorization, Content-Type'
    }
  });

  assert(corsRes.status === 204 || corsRes.status === 200, 'CORS Preflight (OPTIONS) request returns HTTP 200/204');
  assert(corsRes.headers.get('access-control-allow-origin') === 'https://admin.youthcamping.online', 'CORS allows admin.youthcamping.online domain');
  assert(corsRes.headers.get('access-control-allow-credentials') === 'true', 'CORS allows credentials');

  corsServer.close();

  console.log('\n====================================================');
  console.log(`✅ TEST SUITE COMPLETE: ${passedTests}/${totalTests} ASSERTS PASSED`);
  console.log('====================================================\n');
}

runTestSuite().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err.message);
  process.exit(1);
});
