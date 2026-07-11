const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '../../');
const envLocalPath = path.join(rootDir, '.env.local');
const envPath = path.join(rootDir, '.env');

console.log('__dirname:', __dirname);
console.log('rootDir:', rootDir);
console.log('envLocalPath:', envLocalPath);
console.log('envLocalPath exists:', fs.existsSync(envLocalPath));
console.log('DATABASE_URL before dotenv:', process.env.DATABASE_URL);

dotenv.config({ path: envLocalPath });
console.log('DATABASE_URL after dotenv:', process.env.DATABASE_URL);

const LOCAL_DATABASE_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '[::1]',
  '::1',
  'host.docker.internal'
]);

const parseDatabaseHost = (value) => {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch (_error) {
    return null;
  }
};

const value = String(process.env.DATABASE_URL || '').trim();
const host = parseDatabaseHost(value);
console.log('Parsed database host:', host);
console.log('Is host local/approved:', LOCAL_DATABASE_HOSTS.has(host));
