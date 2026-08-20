describe('Unit Tests: Env Loader & Safety Guard', () => {
  let mockConsoleWarn: jest.SpyInstance;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    mockConsoleWarn.mockRestore();
    jest.resetModules();
  });

  it('Test 1: isApprovedLocalDatabaseHost recognizes local database hosts', () => {
    const { isApprovedLocalDatabaseHost } = require('../../backend/src/lib/env');
    expect(isApprovedLocalDatabaseHost('localhost')).toBe(true);
    expect(isApprovedLocalDatabaseHost('127.0.0.1')).toBe(true);
    expect(isApprovedLocalDatabaseHost('host.docker.internal')).toBe(true);
  });

  it('Test 2: Environment safety loader loads without crashing', () => {
    expect(() => {
      require('../../backend/src/lib/env');
    }).not.toThrow();
  });
});
