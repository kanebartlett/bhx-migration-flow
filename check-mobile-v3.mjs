import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500); // Extra wait for React rendering

  // Take initial screenshot
  await page.screenshot({
    path: '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/mobile-full-form.png',
    fullPage: true
  });

  // The DatePicker uses a custom class, and time uses a select
  const fields = [
    { selector: '.date-input-custom >> nth=0', label: 'Departure Date', type: 'datepicker' },
    { selector: '.time-select >> nth=0', label: 'Departure Time', type: 'select' },
    { selector: '.date-input-custom >> nth=1', label: 'Return Date', type: 'datepicker' },
    { selector: '.time-select >> nth=1', label: 'Return Time', type: 'select' }
  ];

  const measurements = [];

  for (const field of fields) {
    try {
      const element = await page.locator(field.selector);
      const count = await element.count();
      if (count > 0) {
        await element.scrollIntoViewIfNeeded();
        const box = await element.boundingBox();

        // Also get computed styles
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            width: computed.width,
            minWidth: computed.minWidth,
            maxWidth: computed.maxWidth,
            boxSizing: computed.boxSizing
          };
        });

        measurements.push({
          label: field.label,
          type: field.type,
          boundingBox: {
            width: box ? Math.round(box.width * 100) / 100 : 'not visible',
            height: box ? Math.round(box.height * 100) / 100 : 'not visible',
            x: box ? Math.round(box.x * 100) / 100 : 'not visible',
            y: box ? Math.round(box.y * 100) / 100 : 'not visible'
          },
          computedStyles: styles
        });
      } else {
        measurements.push({
          label: field.label,
          type: field.type,
          error: 'element not found',
          count: count
        });
      }
    } catch (error) {
      measurements.push({
        label: field.label,
        type: field.type,
        error: error.message
      });
    }
  }

  console.log(JSON.stringify(measurements, null, 2));

  await browser.close();
})();
