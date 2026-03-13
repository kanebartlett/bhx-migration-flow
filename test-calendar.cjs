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
    const screenshot1 = path.join(__dirname, 'screenshots', 'landing-page.png');
    await page.screenshot({ path: screenshot1, fullPage: false });
    console.log('Screenshot 1: Landing page saved to', screenshot1);

    // Click on departure date field
    console.log('Looking for departure date field...');
    const departureDateField = await page.locator('input[placeholder*="Departure" i], input[name*="departure" i], .date-input').first();
    await departureDateField.waitFor({ state: 'visible', timeout: 5000 });
    await departureDateField.click();
    await page.waitForTimeout(1500); // Wait for calendar to open and animate

    // Screenshot 2: Calendar opened
    const screenshot2 = path.join(__dirname, 'screenshots', 'calendar-opened.png');
    await page.screenshot({ path: screenshot2, fullPage: false });
    console.log('Screenshot 2: Calendar opened saved to', screenshot2);

    // Click on a date in the calendar
    console.log('Clicking on a date...');
    const dateButton = await page.locator('.react-datepicker__day:not(.react-datepicker__day--disabled)').nth(10);
    await dateButton.waitFor({ state: 'visible', timeout: 5000 });
    await dateButton.click();
    await page.waitForTimeout(500);

    // Click another date to show selection
    const anotherDate = await page.locator('.react-datepicker__day:not(.react-datepicker__day--disabled)').nth(15);
    if (await anotherDate.isVisible()) {
      await anotherDate.click();
      await page.waitForTimeout(500);
    }

    // Screenshot 3: Calendar with selections
    const screenshot3 = path.join(__dirname, 'screenshots', 'calendar-with-selection.png');
    await page.screenshot({ path: screenshot3, fullPage: false });
    console.log('Screenshot 3: Calendar with selection saved to', screenshot3);

    // Get computed styles to verify colors
    console.log('\nVerifying calendar styling...');
    const headerStyle = await page.locator('.react-datepicker__header').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        background: styles.background,
        backgroundColor: styles.backgroundColor,
        backgroundImage: styles.backgroundImage
      };
    });
    console.log('Header styles:', JSON.stringify(headerStyle, null, 2));

    const dayNameStyle = await page.locator('.react-datepicker__day-name').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color
      };
    });
    console.log('Day name color:', dayNameStyle.color);

    const selectedDayStyle = await page.locator('.react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color
      };
    });
    console.log('Selected day styles:', JSON.stringify(selectedDayStyle, null, 2));

    console.log('\n✅ Test completed successfully');

  } catch (error) {
    console.error('Error during test:', error.message);
    const errorScreenshot = path.join(__dirname, 'screenshots', 'error.png');
    await page.screenshot({ path: errorScreenshot, fullPage: true });
    console.log('Error screenshot saved to', errorScreenshot);
  } finally {
    await browser.close();
  }
})();
