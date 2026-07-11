import { test, expect } from '@playwright/test';
import path from 'path';

const ADMIN_URL = 'http://localhost:8080';
const FRONTEND_URL = 'http://localhost:3000';
const ADMIN_STORAGE = path.join(__dirname, 'admin-auth.json');

// ─── ADMIN TESTS (require auth via storageState) ───────────────────────────

test.describe('Admin Panel – Dashboard', () => {
  test.use({ storageState: ADMIN_STORAGE });

  test('should show dashboard after login', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('header').first()).toBeVisible();
  });
});

test.describe('Admin Panel – Trips', () => {
  test.use({ storageState: ADMIN_STORAGE });

  test('should load trips page and show content', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/trips`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 });
    // Some heading must render
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin Panel – Inquiries', () => {
  test.use({ storageState: ADMIN_STORAGE });

  test('should load inquiries page', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/inquiries`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Admin Panel – Bookings', () => {
  test.use({ storageState: ADMIN_STORAGE });

  test('should load bookings page', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/bookings`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Admin Panel – Page Builder', () => {
  test.use({ storageState: ADMIN_STORAGE });

  test('should load page builder', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/page-builder`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 });
  });
});

// ─── FRONTEND TESTS ────────────────────────────────────────────────────────

test.describe('Frontend – Homepage', () => {
  test('should load without TypeError crashes', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('Cannot read') || e.includes('is not a function')
    );
    if (criticalErrors.length > 0) {
      console.error('JS Errors on homepage:', criticalErrors);
    }
    expect(criticalErrors, 'Critical JS errors detected on homepage').toHaveLength(0);
  });

  test('should render trip links', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    const tripLinks = page.locator('a[href*="/trips/"]');
    await expect(tripLinks.first()).toBeVisible({ timeout: 15000 });
    const count = await tripLinks.count();
    console.log(`Trip links found: ${count}`);
    expect(count).toBeGreaterThan(0);
  });
});
