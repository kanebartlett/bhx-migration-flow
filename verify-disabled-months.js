const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/screenshot-initial.png',
      fullPage: true
    });

    // Click on departure date field
    const departureDateField = page.locator('input[placeholder*="Departure" i], input[name*="departure" i]').first();
    await departureDateField.click();
    await page.waitForTimeout(1000); // Wait for calendar to open

    // Take screenshot with calendar open
    await page.screenshot({
      path: '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/screenshot-calendar-open.png',
      fullPage: true
    });

    console.log('✅ Screenshots captured successfully');
    console.log('📸 Initial: screenshot-initial.png');
    console.log('📸 Calendar: screenshot-calendar-open.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
