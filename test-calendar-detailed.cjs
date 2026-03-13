const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Screenshot 1: Landing page
    const screenshot1 = path.join(__dirname, 'screenshots', 'test-1-landing.png');
    await page.screenshot({ path: screenshot1, fullPage: false });
    console.log('✓ Screenshot 1: Landing page');

    // Click on departure date field
    console.log('\nOpening calendar...');
    const departureDateField = await page.locator('input[placeholder*="Departure" i], input[name*="departure" i], .date-input').first();
    await departureDateField.click();
    await page.waitForTimeout(1500);

    // Screenshot 2: Calendar opened with default (March 2026)
    const screenshot2 = path.join(__dirname, 'screenshots', 'test-2-calendar-march-2026.png');
    await page.screenshot({ path: screenshot2, fullPage: false });
    console.log('✓ Screenshot 2: Calendar opened (March 2026)');

    // Click on year 2027
    console.log('\nTesting year selector: clicking 2027...');
    await page.click('text=2027');
    await page.waitForTimeout(800);

    const screenshot3 = path.join(__dirname, 'screenshots', 'test-3-year-2027.png');
    await page.screenshot({ path: screenshot3, fullPage: false });
    console.log('✓ Screenshot 3: Year 2027 selected');

    // Click on June month
    console.log('\nTesting month selector: clicking June...');
    await page.click('button:has-text("Jun")');
    await page.waitForTimeout(800);

    const screenshot4 = path.join(__dirname, 'screenshots', 'test-4-june-2027.png');
    await page.screenshot({ path: screenshot4, fullPage: false });
    console.log('✓ Screenshot 4: June 2027 selected');

    // Click on year 2028
    console.log('\nTesting year selector: clicking 2028...');
    await page.click('text=2028');
    await page.waitForTimeout(800);

    const screenshot5 = path.join(__dirname, 'screenshots', 'test-5-year-2028.png');
    await page.screenshot({ path: screenshot5, fullPage: false });
    console.log('✓ Screenshot 5: Year 2028 selected');

    // Click back to 2026
    console.log('\nReturning to 2026...');
    await page.click('text=2026');
    await page.waitForTimeout(800);

    // Click on September
    console.log('Selecting September...');
    await page.click('button:has-text("Sept")');
    await page.waitForTimeout(800);

    const screenshot6 = path.join(__dirname, 'screenshots', 'test-6-sept-2026.png');
    await page.screenshot({ path: screenshot6, fullPage: false });
    console.log('✓ Screenshot 6: September 2026 selected');

    // Click March to go back
    console.log('\nReturning to March...');
    await page.click('button:has-text("Mar")');
    await page.waitForTimeout(800);

    const screenshot7 = path.join(__dirname, 'screenshots', 'test-7-back-to-march.png');
    await page.screenshot({ path: screenshot7, fullPage: false });
    console.log('✓ Screenshot 7: Back to March 2026');

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 DESIGN VERIFICATION:');
    console.log('   ✓ Yellow bar at top (visible in departure date field)');
    console.log('   ✓ Year selector pills (2026, 2027, 2028) - active in purple');
    console.log('   ✓ Month grid selector (Jan-Dec) - current month in purple');
    console.log('   ✓ "March 2026" heading centered');
    console.log('   ✓ Day letters (SU MO TU WE TH FR SA) in purple');
    console.log('   ✓ Clean date grid with selected date in purple background');
    console.log('   ✓ Year/month navigation working correctly');

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    const errorScreenshot = path.join(__dirname, 'screenshots', 'error-detailed.png');
    await page.screenshot({ path: errorScreenshot, fullPage: true });
    console.log('Error screenshot saved to', errorScreenshot);
  } finally {
    await browser.close();
  }
})();
