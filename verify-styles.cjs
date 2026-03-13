const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Get the departure time select element
    const departureTimeSelect = page.locator('select#departure-time');

    // Check initial state
    console.log('\n📋 Style Analysis:\n');

    // Get styles before hover
    const beforeHover = await departureTimeSelect.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        border: computed.border,
        borderColor: computed.borderColor,
        outline: computed.outline,
        outlineColor: computed.outlineColor
      };
    });
    console.log('Before hover:', beforeHover);

    // Hover and check styles
    await departureTimeSelect.hover();
    await page.waitForTimeout(500);

    const afterHover = await departureTimeSelect.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        border: computed.border,
        borderColor: computed.borderColor,
        outline: computed.outline,
        outlineColor: computed.outlineColor
      };
    });
    console.log('After hover:', afterHover);

    // Check for yellow in computed styles
    const hasYellow =
      afterHover.borderColor?.includes('255, 255, 0') ||
      afterHover.outlineColor?.includes('255, 255, 0') ||
      afterHover.borderColor?.toLowerCase().includes('yellow') ||
      afterHover.outlineColor?.toLowerCase().includes('yellow');

    console.log('\n✓ Yellow detected on hover:', hasYellow ? 'YES ❌' : 'NO ✅');
    console.log('✓ Purple border on hover:', afterHover.borderColor?.includes('112, 48, 160') ? 'YES ✅' : 'UNKNOWN');

    // Take final screenshot
    await page.screenshot({
      path: '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/hover-verification.png',
      fullPage: false
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
  }
})();
