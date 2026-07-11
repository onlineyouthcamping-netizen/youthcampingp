/**
 * Global setup: Obtain admin JWT via API and inject into browser storageState.
 * This avoids flaky UI login across test runs.
 */
import { chromium } from '@playwright/test';
import path from 'path';
import http from 'http';

const ADMIN_URL = 'http://localhost:8080';
const {
  assertMutatingTestSafety,
  requireEnvironmentValue,
} = require('../../backend/src/utils/testSafety');
const API_URL = assertMutatingTestSafety({
  apiUrl: requireEnvironmentValue('TEST_API_URL')
});
const TEST_ADMIN_EMAIL = requireEnvironmentValue('TEST_ADMIN_EMAIL');
const TEST_ADMIN_PASSWORD = requireEnvironmentValue('TEST_ADMIN_PASSWORD');
export const ADMIN_STORAGE_STATE = path.join(__dirname, 'admin-auth.json');

/** POST to admin login API and return token */
function getAdminToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD });
    const target = new URL(API_URL);
    const req = http.request(
      { hostname: target.hostname, port: target.port, path: `${target.pathname}/admin/login`, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            // Response: { success: true, data: { token, admin } }
            const token = parsed?.data?.token || parsed?.token;
            if (token) resolve(token);
            else reject(new Error('No token in response: ' + data));
          } catch (e) { reject(e); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export default async function globalSetup() {
  console.log('\n🔐 Global Setup: Obtaining admin token via API...');
  
  let token: string;
  try {
    token = await getAdminToken();
    console.log('✅ Admin token obtained successfully');
  } catch (err) {
    console.error('❌ Failed to get admin token:', err);
    throw err;
  }

  // Inject token into browser storageState
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to admin panel so localStorage can be set for the correct origin
  await page.goto(`${ADMIN_URL}/admin/login`);
  await page.waitForLoadState('domcontentloaded');

  // Inject JWT into localStorage (same as what the app does after login)
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
  }, token);

  console.log('✅ Token injected into localStorage for origin:', ADMIN_URL);

  // Save the storage state
  await context.storageState({ path: ADMIN_STORAGE_STATE });
  console.log('✅ Storage state saved to:', ADMIN_STORAGE_STATE);

  await browser.close();
}
