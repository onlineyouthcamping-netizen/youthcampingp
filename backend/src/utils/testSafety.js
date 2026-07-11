const { nodeEnv, isApprovedLocalDatabaseHost } = require('../lib/env');

const requireEnvironmentValue = (name) => {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required for isolated test execution.`);
  return value;
};

const getDatabaseHost = (name) => {
  const value = requireEnvironmentValue(name);
  try {
    return new URL(value).hostname.toLowerCase();
  } catch (_error) {
    throw new Error(`${name} must be a valid database URL.`);
  }
};

const assertIsolatedTestDatabase = () => {
  if (nodeEnv !== 'test') {
    throw new Error('Test scripts require NODE_ENV=test.');
  }

  for (const name of ['DATABASE_URL', 'DIRECT_URL']) {
    const host = getDatabaseHost(name);
    if (!isApprovedLocalDatabaseHost(host)) {
      throw new Error(`${name} must use an approved local or explicitly isolated test database host.`);
    }
  }
};

const assertSafeApiTarget = (apiUrl) => {
  let parsed;
  try {
    parsed = new URL(apiUrl);
  } catch (_error) {
    throw new Error('TEST_API_URL must be a valid URL.');
  }

  const allowedHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
  if (parsed.protocol !== 'http:' || !allowedHosts.has(parsed.hostname.toLowerCase())) {
    throw new Error('Test scripts may target only an HTTP localhost API URL.');
  }

  return parsed.toString().replace(/\/$/, '');
};

const assertReadOnlyTestSafety = ({ apiUrl } = {}) => {
  assertIsolatedTestDatabase();
  return apiUrl ? assertSafeApiTarget(apiUrl) : null;
};

const assertMutatingTestSafety = ({ apiUrl } = {}) => {
  assertIsolatedTestDatabase();
  if (process.env.ALLOW_MUTATING_TESTS !== 'true') {
    throw new Error('Mutating tests require ALLOW_MUTATING_TESTS=true.');
  }
  return apiUrl ? assertSafeApiTarget(apiUrl) : null;
};

module.exports = {
  assertMutatingTestSafety,
  assertReadOnlyTestSafety,
  assertSafeApiTarget,
  requireEnvironmentValue,
};
