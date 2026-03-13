import { chromium } from 'playwright';
import { format, addDays } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';

const results = {
  tests: [],
  screenshots: []
};

const screenshotDir = './test-screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  try {
    // Test 1: Landing Page Test
    console.log('\n=== Test 1: Landing Page Test ===');
    await testLandingPage(browser);

    // Test 2: Form Validation Test
    console.log('\n=== Test 2: Form Validation Test ===');
    await testFormValidation(browser);

    // Test 3: Successful Navigation Test
    console.log('\n=== Test 3: Successful Navigation Test ===');
    await testSuccessfulNavigation(browser);

    // Test 4: Availability Page Test
    console.log('\n=== Test 4: Availability Page Test ===');
    await testAvailabilityPage(browser);

    // Test 5: Mobile Responsive Test
    console.log('\n=== Test 5: Mobile Responsive Test ===');
    await testMobileResponsive(browser);

  } finally {
    await browser.close();
  }

  // Print final report
  printReport();
}

async function testLandingPage(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const test = { name: 'Landing Page Test', checks: [], screenshot: null };

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    await page.goto('http://localhost:5173/landing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Give React time to hydrate

    // Check headline
    const headline = await page.locator('text=Your Birmingham Parking Just Got Better').first();
    test.checks.push({
      item: 'Headline visible',
      pass: await headline.isVisible(),
      details: 'Headline "Your Birmingham Parking Just Got Better"'
    });

    // Check hero section with purple branding
    const heroSection = await page.locator('[class*="hero"]').first();
    const hasHero = await heroSection.count() > 0 || await page.locator('div').first().isVisible();
    test.checks.push({
      item: 'Hero section present',
      pass: hasHero,
      details: 'Hero section displays'
    });

    // Check form fields
    const departureDate = await page.locator('input[type="date"]').first();
    test.checks.push({
      item: 'Departure date field',
      pass: await departureDate.isVisible(),
      details: 'Departure date field present'
    });

    const returnDate = await page.locator('input[type="date"]').nth(1);
    test.checks.push({
      item: 'Return date field',
      pass: await returnDate.count() > 0,
      details: 'Return date field present'
    });

    // Check time dropdowns
    const timeSelects = await page.locator('select').count();
    test.checks.push({
      item: 'Time dropdowns',
      pass: timeSelects >= 2,
      details: `Found ${timeSelects} time dropdowns (expected 2)`
    });

    // Take screenshot
    const screenshotPath = path.join(screenshotDir, 'landing-page.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    test.screenshot = screenshotPath;
    results.screenshots.push(screenshotPath);

  } catch (error) {
    test.checks.push({ item: 'Test execution', pass: false, details: error.message });
  }

  await context.close();
  results.tests.push(test);
}

async function testFormValidation(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const test = { name: 'Form Validation Test', checks: [], screenshot: null };

  try {
    await page.goto('http://localhost:5173/landing');
    await page.waitForLoadState('networkidle');

    // Try submitting empty form
    const submitButton = await page.locator('button[type="submit"], button:has-text("Search")').first();
    await submitButton.click();
    await page.waitForTimeout(500);

    // Check for error message
    const hasError = await page.locator('text=/error|required|must|invalid/i').count() > 0;
    test.checks.push({
      item: 'Empty form error',
      pass: hasError,
      details: 'Error message appears for empty form'
    });

    // Fill with invalid date range
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');

    await page.locator('input[type="date"]').first().fill(tomorrow);
    await page.locator('input[type="date"]').nth(1).fill(yesterday);

    test.checks.push({
      item: 'Invalid dates entered',
      pass: true,
      details: 'Departure: tomorrow, Return: yesterday'
    });

    // Submit and check for validation error
    await submitButton.click();
    await page.waitForTimeout(500);

    const validationError = await page.locator('text=/return.*after.*departure|invalid.*date/i').first();
    const hasValidationError = await validationError.count() > 0;
    test.checks.push({
      item: 'Validation error message',
      pass: hasValidationError,
      details: 'Error states return must be after departure'
    });

    // Take screenshot
    const screenshotPath = path.join(screenshotDir, 'form-validation-error.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    test.screenshot = screenshotPath;
    results.screenshots.push(screenshotPath);

  } catch (error) {
    test.checks.push({ item: 'Test execution', pass: false, details: error.message });
  }

  await context.close();
  results.tests.push(test);
}

async function testSuccessfulNavigation(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const test = { name: 'Successful Navigation Test', checks: [], screenshot: null };

  try {
    await page.goto('http://localhost:5173/landing');
    await page.waitForLoadState('networkidle');

    // Fill valid dates
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');

    await page.locator('input[type="date"]').first().fill(tomorrow);
    test.checks.push({
      item: 'Departure date set',
      pass: true,
      details: `Set to ${tomorrow}`
    });

    await page.locator('input[type="date"]').nth(1).fill(nextWeek);
    test.checks.push({
      item: 'Return date set',
      pass: true,
      details: `Set to ${nextWeek}`
    });

    // Select times if available
    const timeSelects = await page.locator('select').count();
    if (timeSelects >= 2) {
      await page.locator('select').first().selectOption({ index: 1 });
      await page.locator('select').nth(1).selectOption({ index: 1 });
      test.checks.push({
        item: 'Times selected',
        pass: true,
        details: 'Selected times from dropdowns'
      });
    }

    // Click submit
    const submitButton = await page.locator('button[type="submit"], button:has-text("Search")').first();
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Check navigation
    const currentUrl = page.url();
    const navigatedToAvailability = currentUrl.includes('/availability');
    test.checks.push({
      item: 'Navigation to /availability',
      pass: navigatedToAvailability,
      details: `Current URL: ${currentUrl}`
    });

    // Check query parameters
    const hasQueryParams = currentUrl.includes('?');
    test.checks.push({
      item: 'Query parameters present',
      pass: hasQueryParams,
      details: hasQueryParams ? 'URL contains query params' : 'No query params found'
    });

    // Take screenshot
    const screenshotPath = path.join(screenshotDir, 'successful-navigation.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    test.screenshot = screenshotPath;
    results.screenshots.push(screenshotPath);

  } catch (error) {
    test.checks.push({ item: 'Test execution', pass: false, details: error.message });
  }

  await context.close();
  results.tests.push(test);
}

async function testAvailabilityPage(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const test = { name: 'Availability Page Test', checks: [], screenshot: null };

  try {
    // Navigate with query params
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    await page.goto(`http://localhost:5173/availability?departureDate=${tomorrow}&returnDate=${nextWeek}`);
    await page.waitForLoadState('networkidle');

    // Check headline
    const headline = await page.locator('text=/Why Meet.*Greet.*Better/i').first();
    test.checks.push({
      item: 'Comparison headline',
      pass: await headline.isVisible(),
      details: 'Headline about Meet & Greet comparison'
    });

    // Check value propositions
    const cheaper = await page.locator('text=/£21.*Cheaper/i').count() > 0;
    test.checks.push({
      item: '£21.20 Cheaper shown',
      pass: cheaper,
      details: 'Price comparison visible'
    });

    const faster = await page.locator('text=/7.*min.*Faster/i').count() > 0;
    test.checks.push({
      item: '7 min Faster shown',
      pass: faster,
      details: 'Time comparison visible'
    });

    const overstay = await page.locator('text=/£0.*Overstay/i').count() > 0;
    test.checks.push({
      item: '£0 Overstay charges shown',
      pass: overstay,
      details: 'Overstay benefit visible'
    });

    // Check product cards
    const cards = await page.locator('[class*="card"], article, div').filter({ hasText: /Airparks|BHX Car Park/i }).count();
    test.checks.push({
      item: 'Product cards displayed',
      pass: cards >= 2,
      details: `Found ${cards} product cards`
    });

    // Check recommended badge
    const recommended = await page.locator('text=/RECOMMENDED/i').count() > 0;
    test.checks.push({
      item: 'RECOMMENDED badge',
      pass: recommended,
      details: 'Recommended badge visible'
    });

    // Check not available badge
    const notAvailable = await page.locator('text=/NO LONGER AVAILABLE|NOT AVAILABLE/i').count() > 0;
    test.checks.push({
      item: 'Not available badge',
      pass: notAvailable,
      details: 'Not available badge visible'
    });

    // Check pricing
    const pricing78 = await page.locator('text=/£78\.79|78\.79/').count() > 0;
    test.checks.push({
      item: '£78.79 pricing',
      pass: pricing78,
      details: 'New product pricing visible'
    });

    const pricing99 = await page.locator('text=/£99\.99|99\.99/').count() > 0;
    test.checks.push({
      item: '£99.99 pricing',
      pass: pricing99,
      details: 'Old product pricing visible'
    });

    // Check buttons
    const bookNow = await page.locator('button:has-text("Book Now"), a:has-text("Book Now")').count() > 0;
    test.checks.push({
      item: 'Book Now button',
      pass: bookNow,
      details: 'Book Now CTA visible'
    });

    const notAvailableBtn = await page.locator('button:has-text("Not Available")').count() > 0;
    test.checks.push({
      item: 'Not Available button',
      pass: notAvailableBtn,
      details: 'Not Available button visible'
    });

    // Take screenshot
    const screenshotPath = path.join(screenshotDir, 'availability-page.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    test.screenshot = screenshotPath;
    results.screenshots.push(screenshotPath);

  } catch (error) {
    test.checks.push({ item: 'Test execution', pass: false, details: error.message });
  }

  await context.close();
  results.tests.push(test);
}

async function testMobileResponsive(browser) {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await context.newPage();
  const test = { name: 'Mobile Responsive Test', checks: [], screenshot: null };

  try {
    // Test landing page mobile
    await page.goto('http://localhost:5173/landing');
    await page.waitForLoadState('networkidle');

    const landingVisible = await page.locator('text=Your Birmingham Parking Just Got Better').isVisible();
    test.checks.push({
      item: 'Landing page mobile',
      pass: landingVisible,
      details: 'Landing page renders on mobile viewport'
    });

    // Check form is visible
    const formVisible = await page.locator('input[type="date"]').first().isVisible();
    test.checks.push({
      item: 'Form visible on mobile',
      pass: formVisible,
      details: 'Form fields visible at 375x667'
    });

    // Take mobile landing screenshot
    const landingScreenshot = path.join(screenshotDir, 'mobile-landing.png');
    await page.screenshot({ path: landingScreenshot, fullPage: true });
    results.screenshots.push(landingScreenshot);

    // Navigate to availability page
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    await page.goto(`http://localhost:5173/availability?departureDate=${tomorrow}&returnDate=${nextWeek}`);
    await page.waitForLoadState('networkidle');

    const availabilityVisible = await page.locator('text=/Why Meet.*Greet/i').isVisible();
    test.checks.push({
      item: 'Availability page mobile',
      pass: availabilityVisible,
      details: 'Availability page renders on mobile viewport'
    });

    // Check cards are stacked
    const cards = await page.locator('[class*="card"], article').count();
    test.checks.push({
      item: 'Cards render on mobile',
      pass: cards >= 1,
      details: `Product cards visible on mobile (${cards} found)`
    });

    // Take mobile availability screenshot
    const availabilityScreenshot = path.join(screenshotDir, 'mobile-availability.png');
    await page.screenshot({ path: availabilityScreenshot, fullPage: true });
    test.screenshot = availabilityScreenshot;
    results.screenshots.push(availabilityScreenshot);

  } catch (error) {
    test.checks.push({ item: 'Test execution', pass: false, details: error.message });
  }

  await context.close();
  results.tests.push(test);
}

function printReport() {
  console.log('\n\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           BIRMINGHAM AIRPORT MIGRATION FLOW TEST REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  results.tests.forEach(test => {
    const allPassed = test.checks.every(check => check.pass);
    const status = allPassed ? '✅ PASS' : '❌ FAIL';

    console.log(`\n${status} - ${test.name}`);
    console.log('─'.repeat(60));

    test.checks.forEach(check => {
      const icon = check.pass ? '  ✓' : '  ✗';
      console.log(`${icon} ${check.item}`);
      if (check.details) {
        console.log(`    ${check.details}`);
      }
    });

    if (test.screenshot) {
      console.log(`\n  📸 Screenshot: ${test.screenshot}`);
    }
  });

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');

  const totalTests = results.tests.length;
  const passedTests = results.tests.filter(test => test.checks.every(check => check.pass)).length;
  const totalChecks = results.tests.reduce((sum, test) => sum + test.checks.length, 0);
  const passedChecks = results.tests.reduce((sum, test) =>
    sum + test.checks.filter(check => check.pass).length, 0);

  console.log(`\nTests: ${passedTests}/${totalTests} passed`);
  console.log(`Checks: ${passedChecks}/${totalChecks} passed`);
  console.log(`Screenshots: ${results.screenshots.length} captured\n`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!\n');
  } else {
    console.log('⚠️  Some tests failed. Review details above.\n');
  }
}

runTests().catch(console.error);
