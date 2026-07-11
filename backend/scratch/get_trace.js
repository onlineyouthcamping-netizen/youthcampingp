const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('pageerror', exception => {
    console.log(`Page error: ${exception.message}`);
    console.log(exception.stack);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Console error: ${msg.text()}`);
    }
  });

  try {
    // Navigate to admin
    await page.goto('http://localhost:8080/admin/login');
    // Login
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Go to departures hub
    await page.goto('http://localhost:8080/admin/departure-workspace?tripId=SPT-1&date=2027-06-15');
    await page.waitForTimeout(3000);
  } catch (err) {
    console.error("Navigation error:", err);
  } finally {
    await browser.close();
  }
})();
