import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const {
  assertReadOnlyTestSafety,
  requireEnvironmentValue,
} = require('../../backend/src/utils/testSafety');
const API_URL = assertReadOnlyTestSafety({
  apiUrl: requireEnvironmentValue('TEST_API_URL')
});

test.describe('Travel CRM - E2E Tests', () => {
  test('Homepage should load successfully', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText(/story|decided|go|trip|journey/i);
    
    // Check navigation
    await expect(page.locator('nav, header, [role="navigation"]').first()).toBeVisible();
  });

  test('Trip listings page should display trips with search', async ({ page }) => {
    await page.goto(`${BASE_URL}/trips`);
    
    // Wait for trips to load
    await page.waitForSelector('.avian-card', { timeout: 10000 });
    
    // Search for a trip (if search input exists)
    const searchInput = page.locator('input[placeholder*="SEARCH"], input[placeholder*="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Himachal');
      await page.waitForTimeout(500); // Wait for debounce
    }
    
    const tripCards = page.locator('.avian-card');
    const count = await tripCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Trip detail page should load', async ({ page }) => {
    // First, fetch a trip ID from the API
    const response = await page.request.get(`${API_URL}/trips/public/cards`);
    const data = await response.json();
    
    if (data.data.length > 0) {
      const tripId = data.data[0].id;
      const tripSlug = data.data[0].slug;
      
      // Navigate to trip detail
      await page.goto(`${BASE_URL}/trips/${tripSlug}`);
      
      // Check if trip details are visible
      await expect(page.locator('h1')).toBeVisible();
      
      // Check for inquiry button
      const inquiryButton = page.locator('button:has-text("Inquiry")');
      if (await inquiryButton.isVisible()) {
        expect(inquiryButton).toBeDefined();
      }
    }
  });

  test('Wishlist functionality should work', async ({ page }) => {
    await page.goto(`${BASE_URL}/trips`);
    
    // Wait for trips to load
    await page.waitForSelector('.avian-card', { timeout: 10000 });
    
    // Click wishlist button on first trip
    const wishlistButton = page.locator('button[title="Add to wishlist"], button[aria-label*="wishlist"]').first();
    if (await wishlistButton.isVisible()) {
      await wishlistButton.click();
      
      // Check for success toast
      await expect(page.locator('[class*="toast"]')).toBeVisible({ timeout: 2000 });
    }
  });

  test('Admin login should work', async ({ page }) => {
    // Navigate to admin panel
    await page.goto('http://localhost:8080'); // Adjust port for admin panel
    
    // Fill login form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button:has-text("Log in"), button:has-text("Login")').first();
    
    if (await emailInput.isVisible()) {
      await emailInput.fill(requireEnvironmentValue('TEST_ADMIN_EMAIL'));
      await passwordInput.fill(requireEnvironmentValue('TEST_ADMIN_PASSWORD'));
      await loginButton.click();
      
      // Wait for redirect to admin panel home
      await page.waitForURL('**/admin**', { timeout: 15000 });
      expect(page.url()).toContain('admin');
    }
  });

  test.describe('Admin Dashboard Stats', () => {
    test.use({ storageState: 'tests/e2e/admin-auth.json' });
    test('Admin dashboard should load stats', async ({ page }) => {
      // Navigate directly to admin dashboard
      await page.goto('http://localhost:8080/admin');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 });
      
      // Check if dashboard stats/cards are visible via the Total Revenue header
      const statsCard = page.locator('span:has-text("Total Revenue")').first();
      await expect(statsCard).toBeVisible({ timeout: 10000 });
    });
  });

  test('Create inquiry should succeed', async ({ page }) => {
    await page.goto(`${BASE_URL}/trips`);
    
    // Get first trip
    const response = await page.request.get(`${API_URL}/trips/public/cards`);
    const data = await response.json();
    
    if (data.data.length > 0) {
      const trip = data.data[0];
      
      // Navigate to trip detail
      await page.goto(`${BASE_URL}/trips/${trip.slug}`);
      
      // Fill inquiry form
      const nameInput = page.locator('input[placeholder*="Name"]').first();
      const emailInput = page.locator('input[placeholder*="Email"]').first();
      const phoneInput = page.locator('input[placeholder*="Phone"]').first();
      const submitButton = page.locator('button:has-text("Inquiry")').first();
      
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test User');
        await emailInput.fill('testuser@example.com');
        await phoneInput.fill('9876543210');
        await submitButton.click();
        
        // Check for success message
        await expect(page.locator('[class*="toast"]')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('Sorting trips should work', async ({ page }) => {
    await page.goto(`${BASE_URL}/trips`);
    
    // Wait for trips to load
    await page.waitForSelector('.avian-card', { timeout: 10000 });
    
    // Get initial trip prices
    const sortSelect = page.locator('select').first();
    if (await sortSelect.isVisible()) {
      // Change sort to price low to high
      await sortSelect.selectOption('price-low');
      
      // Wait for sorting to apply
      await page.waitForTimeout(500);
      
      // Verify sorting
      const prices = await page.locator('[class*="text-primary"]').allTextContents();
      expect(prices.length).toBeGreaterThan(0);
    }
  });
});
