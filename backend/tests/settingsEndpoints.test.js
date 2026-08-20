const {
  getSessions,
  logoutSession,
  logoutAllExcept,
  getActivityLogs,
  exportAuditLog,
  getAPIKeys,
  generateAPIKey,
  deleteAPIKey,
  getIntegrations
} = require('../src/controllers/settingsController');

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

describe('Settings Endpoints Controller', () => {
  it('getSessions returns session list', async () => {
    const req = createMockReq();
    const res = createMockRes();
    await getSessions(req, res, (e) => { throw e; });
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.sessions)).toBe(true);
  });

  it('logoutSession revokes inactive session', async () => {
    const req = createMockReq({ params: { sessionId: 'sess_backup_2' } });
    const res = createMockRes();
    await logoutSession(req, res, (e) => { throw e; });
    expect(res.body?.success).toBe(true);
  });

  it('logoutAllExcept closes all other sessions', async () => {
    const req = createMockReq();
    const res = createMockRes();
    await logoutAllExcept(req, res, (e) => { throw e; });
    expect(res.body?.success).toBe(true);
  });

  it('getActivityLogs returns paginated logs', async () => {
    const req = createMockReq({ query: { page: '1', limit: '10' } });
    const res = createMockRes();
    await getActivityLogs(req, res, (e) => { throw e; });
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.logs)).toBe(true);
  });

  it('exportAuditLog generates CSV attachment', async () => {
    const req = createMockReq();
    const res = createMockRes();
    await exportAuditLog(req, res, (e) => { throw e; });
    expect(res.headers['Content-Type']).toBe('text/csv');
    expect(typeof res.body).toBe('string');
  });

  it('generateAPIKey, getAPIKeys, and deleteAPIKey workflow', async () => {
    const genReq = createMockReq({ body: { name: 'Test Key', permissions: ['read', 'write'] } });
    const genRes = createMockRes();
    await generateAPIKey(genReq, genRes, (e) => { throw e; });
    expect(genRes.body?.keySecret).toBeDefined();

    const keyId = genRes.body?.keyId;

    const getReq = createMockReq();
    const getRes = createMockRes();
    await getAPIKeys(getReq, getRes, (e) => { throw e; });
    expect(Array.isArray(getRes.body?.keys)).toBe(true);

    if (keyId) {
      const delReq = createMockReq({ params: { keyId } });
      const delRes = createMockRes();
      await deleteAPIKey(delReq, delRes, (e) => { throw e; });
      expect(delRes.body?.success).toBe(true);
    }
  });

  it('getIntegrations returns connected integrations', async () => {
    const req = createMockReq();
    const res = createMockRes();
    await getIntegrations(req, res, (e) => { throw e; });
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.integrations)).toBe(true);
  });
});
