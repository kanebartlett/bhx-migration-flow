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

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    await page.goto('http://localhost:5173/landing', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000); // Allow React to hydrate

    // Get page content for debugging
    const content = await page.content();
    const hasContent = content.length > 100;

    test.checks.push({
      item: 'Page loaded',
      pass: hasContent,
      details: `Page content length: ${content.length} bytes`
    });

    // Check headline
    try {
      await page.waitForSelector('text=Your Birmingham Parking Just Got Better', { timeout: 5000 });
      test.checks.push({
        item: 'Headline visible',
        pass: true,
        details: 'Headline "Your Birmingham Parking Just Got Better"'
      });
    } catch {
      test.checks.push({
        item: 'Headline visible',
        pass: false,
        details: 'Headline not found'
      });
    }

    // Check hero section
    const heroExists = await page.locator('header, .header, .landing-page').count() > 0;
    test.checks.push({
      item: 'Hero section present',
      pass: heroExists,
      details: 'Hero section or header found'
    });

    // Check form fields
    try {
      await page.waitForSelector('input[type="date"]', { timeout: 3000 });
      const dateInputs = await page.locator('input[type="date"]').count();
      test.checks.push({
        item: 'Date fields present',
        pass: dateInputs >= 2,
        details: `Found ${dateInputs} date input(s)`
      });
    } catch {
      test.checks.push({
        item: 'Date fields present',
        pass: false,
        details: 'No date inputs found'
      });
    }

    // Check time dropdowns
    const timeSelects = await page.locator('select').count();
    test.checks.push({
      item: 'Time dropdowns',
      pass: timeSelects >= 2,
      details: `Found ${timeSelects} dropdown(s)`
    });

    // Check for console errors
    if (consoleErrors.length > 0) {
      test.checks.push({
        item: 'No console errors',
        pass: false,
        details: `${consoleErrors.length} error(s): ${consoleErrors[0]}`
      });
    } else {
      test.checks.push({
        item: 'No console errors',
        pass: true,
        details: 'Clean console'
      });
    }

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
    await page.goto('http://localhost:5173/landing', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);

    // Fill with invalid date range
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');

    try {
      await page.locator('input[type="date"]').first().fill(tomorrow);
      await page.locator('input[type="date"]').nth(1).fill(yesterday);

      test.checks.push({
        item: 'Invalid dates entered',
        pass: true,
        details: `Departure: ${tomorrow}, Return: ${yesterday}`
      });

      // Submit form
      const submitButton = await page.locator('button[type="submit"], button:has-text("Search")').first();
      await submitButton.click();
      await page.waitForTimeout(500);

      // Check for validation error
      const errorText = await page.textContent('body');
      const hasValidationError = errorText.toLowerCase().includes('after') ||
                                  errorText.toLowerCase().includes('must');

      test.checks.push({
        item: 'Validation error shown',
        pass: hasValidationError,
        details: hasValidationError ? 'Validation error displayed' : 'No validation error found'
      });

    } catch (err) {
      test.checks.push({
        item: 'Form interaction',
        pass: false,
        details: err.message
      });
    }

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
    await page.goto('http://localhost:5173/landing', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);

    // Fill valid dates
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');

    try {
      await page.locator('input[type="date"]').first().fill(tomorrow);
      await page.locator('input[type="date"]').nth(1).fill(nextWeek);

      test.checks.push({
        item: 'Valid dates entered',
        pass: true,
        details: `Departure: ${tomorrow}, Return: ${nextWeek}`
      });

      // Click submit and wait for navigation
      const submitButton = await page.locator('button[type="submit"], button:has-text("Search")').first();
      await Promise.all([
        page.waitForNavigation({ timeout: 5000 }),
        submitButton.click()
      ]);

      // Check navigation
      const currentUrl = page.url();
      const navigated = currentUrl.includes('/availability');
      test.checks.push({
        item: 'Navigated to /availability',
        pass: navigated,
        details: `URL: ${currentUrl}`
      });

      // Check query parameters
      const hasParams = currentUrl.includes('?');
      test.checks.push({
        item: 'Query parameters present',
        pass: hasParams,
        details: hasParams ? 'URL contains parameters' : 'No parameters'
      });

    } catch (err) {
      test.checks.push({
        item: 'Navigation flow',
        pass: false,
        details: err.message
      });
    }

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
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    const url = `http://localhost:5173/availability?arrivalDate=${tomorrow}&departureDate=${nextWeek}&location=BHX`;

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body');

    // Check headline
    const hasHeadline = pageText.includes('Meet') && pageText.includes('Greet');
    test.checks.push({
      item: 'Comparison headline',
      pass: hasHeadline,
      details: hasHeadline ? 'Meet & Greet headline found' : 'Headline not found'
    });

    // Check value propositions
    const hasCheaper = pageText.includes('£21') || pageText.includes('Cheaper');
    test.checks.push({
      item: 'Price comparison',
      pass: hasCheaper,
      details: hasCheaper ? 'Price benefit shown' : 'Not found'
    });

    const hasFaster = pageText.includes('min') && pageText.includes('Faster');
    test.checks.push({
      item: 'Time comparison',
      pass: hasFaster,
      details: hasFaster ? 'Time benefit shown' : 'Not found'
    });

    const hasOverstay = pageText.includes('Overstay') || pageText.includes('£0');
    test.checks.push({
      item: 'Overstay benefit',
      pass: hasOverstay,
      details: hasOverstay ? 'Overstay benefit shown' : 'Not found'
    });

    // Check for products
    const hasAirparks = pageText.includes('Airparks');
    const hasBHXCarPark = pageText.includes('BHX') && pageText.includes('Car Park');
    test.checks.push({
      item: 'Product cards',
      pass: hasAirparks && hasBHXCarPark,
      details: `Airparks: ${hasAirparks}, BHX Car Park: ${hasBHXCarPark}`
    });

    // Check badges
    const hasRecommended = pageText.includes('RECOMMENDED');
    test.checks.push({
      item: 'Recommended badge',
      pass: hasRecommended,
      details: hasRecommended ? 'Badge found' : 'Badge not found'
    });

    const hasNotAvailable = pageText.includes('NO LONGER AVAILABLE') || pageText.includes('NOT AVAILABLE');
    test.checks.push({
      item: 'Not available badge',
      pass: hasNotAvailable,
      details: hasNotAvailable ? 'Badge found' : 'Badge not found'
    });

    // Check pricing
    const has78Price = pageText.includes('78.79') || pageText.includes('£78');
    const has99Price = pageText.includes('99.99') || pageText.includes('£99');
    test.checks.push({
      item: 'Pricing displayed',
      pass: has78Price && has99Price,
      details: `£78.79: ${has78Price}, £99.99: ${has99Price}`
    });

    // Check CTAs
    const hasBookNow = pageText.includes('Book Now');
    test.checks.push({
      item: 'Book Now button',
      pass: hasBookNow,
      details: hasBookNow ? 'CTA found' : 'CTA not found'
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
    await page.goto('http://localhost:5173/landing', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);

    const landingText = await page.textContent('body');
    const landingVisible = landingText.includes('Birmingham') || landingText.includes('Parking');
    test.checks.push({
      item: 'Landing page mobile',
      pass: landingVisible,
      details: landingVisible ? 'Page renders at 375px width' : 'Content not found'
    });

    // Check form is visible
    const formVisible = await page.locator('input[type="date"]').count() > 0;
    test.checks.push({
      item: 'Form visible on mobile',
      pass: formVisible,
      details: formVisible ? 'Form elements present' : 'Form not found'
    });

    // Take mobile landing screenshot
    const landingScreenshot = path.join(screenshotDir, 'mobile-landing.png');
    await page.screenshot({ path: landingScreenshot, fullPage: true });
    results.screenshots.push(landingScreenshot);

    // Navigate to availability page
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    await page.goto(`http://localhost:5173/availability?arrivalDate=${tomorrow}&departureDate=${nextWeek}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);

    const availabilityText = await page.textContent('body');
    const availabilityVisible = availabilityText.includes('Meet') || availabilityText.includes('Greet');
    test.checks.push({
      item: 'Availability page mobile',
      pass: availabilityVisible,
      details: availabilityVisible ? 'Page renders at 375px width' : 'Content not found'
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
