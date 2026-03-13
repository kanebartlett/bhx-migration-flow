import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  // Take initial screenshot
  await page.screenshot({
    path: '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/mobile-full-form.png',
    fullPage: true
  });

  // Measure each date/time input field
  const fields = [
    { selector: 'input[name="departureDate"]', label: 'Departure Date' },
    { selector: 'input[name="departureTime"]', label: 'Departure Time' },
    { selector: 'input[name="returnDate"]', label: 'Return Date' },
    { selector: 'input[name="returnTime"]', label: 'Return Time' }
  ];

  const measurements = [];

  for (const field of fields) {
    const element = await page.locator(field.selector).first();
    if (await element.count() > 0) {
      const box = await element.boundingBox();
      measurements.push({
        label: field.label,
        width: box ? box.width : 'not found',
        height: box ? box.height : 'not found',
        x: box ? box.x : 'not found',
        y: box ? box.y : 'not found'
      });
    } else {
      measurements.push({
        label: field.label,
        width: 'element not found',
        height: 'element not found'
      });
    }
  }

  console.log(JSON.stringify(measurements, null, 2));

  await browser.close();
})();
