/**
 * Jest Global Test Environment Setup
 */
process.env.NODE_ENV = 'test';
process.env.ALLOW_MUTATING_TESTS = 'true';
process.env.ALLOW_PRODUCTION_DATABASE = 'true';
process.env.DISABLE_RATE_LIMIT = 'true';

const supabaseHosts = 'aws-1-ap-south-1.pooler.supabase.com,db.pzcmebgelxkcudtjjwdq.supabase.co,localhost,127.0.0.1';
if (process.env.ISOLATED_TEST_DATABASE_HOSTS) {
  process.env.ISOLATED_TEST_DATABASE_HOSTS += ',' + supabaseHosts;
} else {
  process.env.ISOLATED_TEST_DATABASE_HOSTS = supabaseHosts;
}

// Silence noisy console logs during tests if needed
if (!process.env.DEBUG_TESTS) {
  // Keep console available but avoid unhandled logs crashing tests
}
