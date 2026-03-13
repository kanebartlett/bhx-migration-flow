const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    // Navigate to the page
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Take initial screenshot
    await page.screenshot({ path: '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/form-layout.png', fullPage: false });
    console.log('✓ Screenshot 1: Initial form layout saved');

    // Find a time select dropdown and hover over it
    const timeSelects = await page.locator('select[id*="time"]').all();
    if (timeSelects.length > 0) {
      await timeSelects[0].hover();
      await page.waitForTimeout(500);

      // Take hover screenshot
      await page.screenshot({ path: '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/form-hover.png', fullPage: false });
      console.log('✓ Screenshot 2: Hover state saved');
    } else {
      console.log('⚠ No time select found');
    }

    // Get form field info - try multiple selectors
    const fields = await page.locator('input[type="date"], input[type="datetime-local"], select').all();
    console.log(`\n📊 Form Analysis:`);
    console.log(`   Fields found: ${fields.length}`);

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const box = await field.boundingBox();
      const tagName = await field.evaluate(el => el.tagName);
      const type = await field.getAttribute('type');
      const id = await field.getAttribute('id');
      if (box) {
        console.log(`   Field ${i+1} (${tagName}${type ? `[type=${type}]` : ''}#${id}): width=${Math.round(box.width)}px, y=${Math.round(box.y)}`);
      }
    }

    // Check if fields are on same line (similar y-coordinates within 5px tolerance)
    const yCoords = [];
    for (const field of fields) {
      const box = await field.boundingBox();
      if (box) yCoords.push(Math.round(box.y));
    }
    const tolerance = 5;
    const onSameLine = yCoords.length > 1 && Math.max(...yCoords) - Math.min(...yCoords) <= tolerance;
    console.log(`\n✓ Fields on same line: ${onSameLine ? 'YES' : 'NO'} (y-coords: ${yCoords.join(', ')})`);

    // Check for yellow arrows in CSS
    const styles = await page.evaluate(() => {
      const style = document.querySelector('style');
      return style ? style.textContent : '';
    });
    const hasYellow = styles.includes('yellow') || styles.includes('#ffff00') || styles.includes('rgb(255, 255, 0)');
    console.log(`✓ Yellow color in styles: ${hasYellow ? 'FOUND' : 'NOT FOUND'}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
