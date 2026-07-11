try {
  const env = require('../src/lib/env');
  console.log('Loaded env successfully. NODE_ENV:', env.nodeEnv);
  console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL);
} catch (err) {
  console.error('Error importing env:', err);
}
