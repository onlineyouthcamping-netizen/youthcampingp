const {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  getSessions,
  logoutSession,
  logoutAllExcept,
  getActivityLogs,
  exportAuditLog,
  getAPIKeys,
  generateAPIKey,
  deleteAPIKey,
  exportUserData,
  deleteAccount,
  getIntegrations
} = require('../src/controllers/settingsController');

// Mock request and response helpers
function createMockReq(overrides = {}) {
  return {
    user: { id: 'admin_test_123', email: 'hemal.patel@youthcamping.online', role: 'superadmin' },
    headers: {},
    params: {},
    query: {},
    body: {},
    ip: '127.0.0.1',
    ...overrides
  };
}

function createMockRes() {
  const res = {};
  res.statusCode = 200;
  res.headers = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.setHeader = (key, val) => {
    res.headers[key] = val;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  res.send = (data) => {
    res.body = data;
    return res;
  };
  return res;
}

async function runTests() {
  console.log('🧪 Running Backend Settings Handlers Test Suite...\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  }

  // 1. getSessions
  await test('getSessions returns session list', async () => {
    const req = createMockReq();
    const res = createMockRes();
    await getSessions(req, res, (e) => { throw e; });
    if (!res.body?.success || !Array.isArray(res.body?.sessions)) {
      throw new Error('Invalid sessions response');
    }
  });

  // 2. logoutSession
  await test('logoutSession revokes inactive session', async () => {
    const req = createMockReq({ params: { sessionId: 'sess_backup_2' } });
    const res = createMockRes();
    await logoutSession(req, res, (e) => { throw e; });
    if (!res.body?.success) throw new Error('Failed to logout session');
  });

  // 3. logoutAllExcept
  await test('logoutAllExcept closes all other sessions', async () => {
    const req = createMockReq();
    const res = createMockRes();
    await logoutAllExcept(req, res, (e) => { throw e; });
    if (!res.body?.success) throw new Error('Failed to logout all except current');
  });

  // 4. getActivityLogs
  await test('getActivityLogs returns paginated logs', async () => {
    const req = createMockReq({ query: { page: '1', limit: '10' } });
    const res = createMockRes();
    await getActivityLogs(req, res, (e) => { throw e; });
    if (!res.body?.success || !Array.isArray(res.body?.logs)) throw new Error('Invalid activity logs');
  });

  // 5. exportAuditLog
  await test('exportAuditLog generates CSV attachment', async () => {
    const req = createMockReq();
    const res = createMockRes();
    await exportAuditLog(req, res, (e) => { throw e; });
    if (res.headers['Content-Type'] !== 'text/csv' || typeof res.body !== 'string') {
      throw new Error('Invalid CSV audit output');
    }
  });

  // 6. getAPIKeys & 7. generateAPIKey & 8. deleteAPIKey
  await test('generateAPIKey, getAPIKeys, and deleteAPIKey workflow', async () => {
    const genReq = createMockReq({ body: { name: 'Test Key', permissions: ['read', 'write'] } });
    const genRes = createMockRes();
    await generateAPIKey(genReq, genRes, (e) => { throw e; });
    if (!genRes.body?.keySecret || !genRes.body?.keySecret.startsWith('sk_prod_')) {
      throw new Error('Key generation failed or bad secret format');
    }

    const keyId = genRes.body.keyId;

    const getReq = createMockReq();
    const getRes = createMockRes();
    await getAPIKeys(getReq, getRes, (e) => { throw e; });
    if (!getRes.body?.keys || getRes.body.keys.length === 0) throw new Error('Failed to list API keys');

    const delReq = createMockReq({ params: { keyId } });
    const delRes = createMockRes();
    await deleteAPIKey(delReq, delRes, (e) => { throw e; });
    if (!delRes.body?.success) throw new Error('Failed to delete API key');
  });

  // 9. getIntegrations
  await test('getIntegrations returns connected integrations', async () => {
    const req = createMockReq();
    const res = createMockRes();
    await getIntegrations(req, res, (e) => { throw e; });
    if (!res.body?.success || !Array.isArray(res.body?.integrations)) throw new Error('Invalid integrations response');
  });

  console.log(`\n✅ Backend Settings Test Suite Finished: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runTests();
