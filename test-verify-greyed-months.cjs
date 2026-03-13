const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    // Navigate to the app
    console.log('1. Navigating to http://localhost:5173');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click on departure date field
    console.log('2. Clicking on departure date field');
    const departureDateField = page.locator('[data-testid="departure-date-input"], input[placeholder*="Departure"], input[type="text"]').first();
    await departureDateField.click();
    await page.waitForTimeout(1000);

    // Take screenshot showing 2026 with Jan/Feb greyed out
    console.log('3. Taking screenshot of 2026 calendar (Jan/Feb should be greyed out)');
    await page.screenshot({ path: '/tmp/calendar-2026-greyed-out.png', fullPage: true });

    // Click on 2027 year pill
    console.log('4. Clicking on 2027 year pill');
    const year2027 = page.locator('text="2027"').first();
    await year2027.click();
    await page.waitForTimeout(1000);

    // Take screenshot showing 2027 with all months available
    console.log('5. Taking screenshot of 2027 calendar (all months available)');
    await page.screenshot({ path: '/tmp/calendar-2027-all-available.png', fullPage: true });

    // Click on 2026 again
    console.log('6. Clicking back on 2026 year pill');
    const year2026 = page.locator('text="2026"').first();
    await year2026.click();
    await page.waitForTimeout(1000);

    // Try clicking on January (should be greyed out and do nothing)
    console.log('7. Attempting to click on greyed out January');
    const janButton = page.locator('text="Jan"').first();

    // Get the current state before clicking
    const beforeClickState = await page.evaluate(() => {
      return {
        url: window.location.href,
        activeElement: document.activeElement?.tagName
      };
    });

    await janButton.click({ force: true }); // Force click even if disabled
    await page.waitForTimeout(500);

    // Get the state after clicking
    const afterClickState = await page.evaluate(() => {
      return {
        url: window.location.href,
        activeElement: document.activeElement?.tagName
      };
    });

    console.log('Before click:', beforeClickState);
    console.log('After click:', afterClickState);
    console.log('State unchanged:', JSON.stringify(beforeClickState) === JSON.stringify(afterClickState));

    // Take final screenshot
    console.log('8. Taking final screenshot confirming greyed out state');
    await page.screenshot({ path: '/tmp/calendar-final-state.png', fullPage: true });

    // Extract visual information about the calendar state
    console.log('9. Analyzing calendar month states');
    const monthStates = await page.evaluate(() => {
      const months = Array.from(document.querySelectorAll('[class*="month"], button:has-text("Jan"), button:has-text("Feb"), button:has-text("Mar")'));
      return months.map(el => ({
        text: el.textContent?.trim(),
        disabled: el.hasAttribute('disabled') || el.classList.contains('disabled') || el.getAttribute('aria-disabled') === 'true',
        opacity: window.getComputedStyle(el).opacity,
        cursor: window.getComputedStyle(el).cursor,
        pointerEvents: window.getComputedStyle(el).pointerEvents,
        className: el.className
      }));
    });

    console.log('\nMonth button states:');
    console.log(JSON.stringify(monthStates, null, 2));

    console.log('\n✅ Verification complete! Screenshots saved to /tmp/');

  } catch (error) {
    console.error('Error during verification:', error);
    await page.screenshot({ path: '/tmp/calendar-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
