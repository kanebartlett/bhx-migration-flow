const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Listen to network requests
  const apiCalls = [];
  page.on('request', request => {
    if (request.url().includes('holidayextras.com')) {
      console.log('📡 API Request:', request.url());
      apiCalls.push({
        url: request.url(),
        method: request.method()
      });
    }
  });

  page.on('response', async response => {
    if (response.url().includes('holidayextras.com')) {
      console.log('📨 API Response:', response.status(), response.url());
      try {
        const body = await response.text();
        console.log('Response body:', body.substring(0, 500));
      } catch (e) {
        console.log('Could not read response body');
      }
    }
  });

  // Navigate to the app
  console.log('🌐 Navigating to http://localhost:5173');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  // Take initial screenshot
  const screenshotDir = '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/screenshots';
  await page.screenshot({ path: path.join(screenshotDir, '1-initial-page.png'), fullPage: true });
  console.log('📸 Screenshot: 1-initial-page.png');

  // Calculate dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + 9);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  console.log('📅 Departure date:', formatDate(tomorrow));
  console.log('📅 Return date:', formatDate(returnDate));

  // Fill the form
  console.log('📝 Filling form...');

  // Departure date
  await page.fill('#departure-date', formatDate(tomorrow));

  // Departure time (select dropdown)
  await page.selectOption('#departure-time', '12:00');

  // Return date
  await page.fill('#return-date', formatDate(returnDate));

  // Return time (select dropdown)
  await page.selectOption('#return-time', '12:00');

  // Take screenshot of filled form
  await page.screenshot({ path: path.join(screenshotDir, '2-form-filled.png'), fullPage: true });
  console.log('📸 Screenshot: 2-form-filled.png');

  // Click the search button
  console.log('🔍 Clicking search button...');
  await page.click('button:has-text("Search Parking")');

  // Wait for loading state
  try {
    await page.waitForSelector('text=Finding your perfect parking', { timeout: 2000 });
    await page.screenshot({ path: path.join(screenshotDir, '3-loading-state.png'), fullPage: true });
    console.log('📸 Screenshot: 3-loading-state.png');
  } catch (e) {
    console.log('⚠️  Loading state not detected or too fast');
  }

  // Wait for results or error
  await page.waitForTimeout(5000);

  // Take final screenshot
  await page.screenshot({ path: path.join(screenshotDir, '4-final-state.png'), fullPage: true });
  console.log('📸 Screenshot: 4-final-state.png');

  // Check for errors
  const errorElements = await page.locator('.error, [class*="error"], [role="alert"]').all();
  if (errorElements.length > 0) {
    console.log('❌ Error messages found:');
    for (const el of errorElements) {
      const text = await el.textContent();
      console.log('  -', text);
    }
  }

  // Report findings
  console.log('\n═══════════════════════════════════');
  console.log('📊 TEST REPORT');
  console.log('═══════════════════════════════════');
  console.log('API Calls Made:', apiCalls.length);
  apiCalls.forEach((call, i) => {
    console.log(`  ${i + 1}. ${call.method} ${call.url}`);
  });

  // Get page content to check for results
  const pageContent = await page.content();
  const hasResults = pageContent.includes('price') || pageContent.includes('£');
  console.log('Pricing Data Visible:', hasResults);

  console.log('\n✅ Test complete. Check screenshots folder for visual evidence.');
  console.log('═══════════════════════════════════\n');

  // Keep browser open for manual inspection
  console.log('Browser will remain open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
})();
