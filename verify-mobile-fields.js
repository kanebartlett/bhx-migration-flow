import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }
  });
  const page = await context.newPage();

  try {
    // Navigate to the page
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Take full page screenshot
    const screenshotPath = path.join(__dirname, 'mobile-form-full.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Full page screenshot saved to: ${screenshotPath}`);

    // Wait for form to be visible
    await page.waitForSelector('form', { state: 'visible', timeout: 5000 });

    // Measure each field width by finding the visible styled containers
    const measurements = [];

    // Define the field containers we're measuring
    const fieldConfigs = [
      { label: 'Departure Date', selector: '#departure-date' },
      { label: 'Departure Time', selector: '#departure-time' },
      { label: 'Return Date', selector: '#return-date' },
      { label: 'Return Time', selector: '#return-time' }
    ];

    for (const config of fieldConfigs) {
      const element = page.locator(config.selector);
      const count = await element.count();

      if (count > 0) {
        const box = await element.first().boundingBox();
        if (box) {
          measurements.push({
            field: config.label,
            width: Math.round(box.width * 10) / 10,
            height: Math.round(box.height * 10) / 10,
            x: Math.round(box.x * 10) / 10,
            y: Math.round(box.y * 10) / 10
          });
        } else {
          console.log(`⚠️  ${config.label}: Element found but no bounding box (possibly hidden)`);
        }
      } else {
        console.log(`⚠️  ${config.label}: Element not found with selector ${config.selector}`);
      }
    }

    console.log(`\nMeasured ${measurements.length} fields successfully`);

    console.log('\n=== FIELD MEASUREMENTS (Mobile 375px) ===');
    measurements.forEach(m => {
      console.log(`${m.field}: ${m.width}px wide (${m.height}px high) at position (${m.x}, ${m.y})`);
    });

    // Check if all widths are the same
    const widths = measurements.map(m => m.width);
    const allSame = widths.every(w => w === widths[0]);

    console.log('\n=== CONSISTENCY CHECK ===');
    if (allSame) {
      console.log(`✅ SUCCESS: All fields have consistent width of ${widths[0]}px`);
    } else {
      console.log(`❌ INCONSISTENT: Field widths vary`);
      const unique = [...new Set(widths)];
      console.log(`   Unique widths found: ${unique.join(', ')}px`);
    }

    // Take a close-up screenshot of the form fields
    const formElement = await page.locator('form').first();
    if (await formElement.count() > 0) {
      const closeupPath = path.join(__dirname, 'mobile-fields-closeup.png');
      await formElement.screenshot({ path: closeupPath });
      console.log(`\nClose-up screenshot saved to: ${closeupPath}`);
    }

    // Output as JSON for parsing
    console.log('\n=== JSON OUTPUT ===');
    console.log(JSON.stringify({
      session: 'mobile-field-verification',
      url: 'http://localhost:5173',
      viewport: { width: 375, height: 812 },
      result: allSame ? 'SUCCESS' : 'FAILURE',
      measurements,
      allFieldsSameWidth: allSame,
      screenshots: [screenshotPath, path.join(__dirname, 'mobile-fields-closeup.png')]
    }, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
