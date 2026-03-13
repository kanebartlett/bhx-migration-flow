import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Extra wait for rendering

  // Take initial screenshot
  await page.screenshot({
    path: '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/mobile-full-form.png',
    fullPage: true
  });

  // Try different selector strategies
  const fields = [
    { selector: 'input[type="date"]:first-of-type', label: 'Departure Date' },
    { selector: 'input[type="time"]:first-of-type', label: 'Departure Time' },
    { selector: 'input[type="date"]:nth-of-type(2)', label: 'Return Date' },
    { selector: 'input[type="time"]:nth-of-type(2)', label: 'Return Time' }
  ];

  const measurements = [];

  for (const field of fields) {
    try {
      const element = await page.locator(field.selector).first();
      const count = await element.count();
      if (count > 0) {
        await element.scrollIntoViewIfNeeded();
        const box = await element.boundingBox();
        measurements.push({
          label: field.label,
          width: box ? Math.round(box.width * 100) / 100 : 'not visible',
          height: box ? Math.round(box.height * 100) / 100 : 'not visible',
          x: box ? Math.round(box.x * 100) / 100 : 'not visible',
          y: box ? Math.round(box.y * 100) / 100 : 'not visible'
        });
      } else {
        measurements.push({
          label: field.label,
          width: 'element not found',
          count: count
        });
      }
    } catch (error) {
      measurements.push({
        label: field.label,
        error: error.message
      });
    }
  }

  console.log(JSON.stringify(measurements, null, 2));

  await browser.close();
})();
