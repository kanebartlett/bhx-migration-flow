#!/usr/bin/env node

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMarch10to18() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Track network requests
  const apiRequests = [];
  const apiResponses = [];

  page.on('request', request => {
    if (request.url().includes('holidayextras.co.uk') || request.url().includes('localhost')) {
      apiRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('response', async response => {
    if (response.url().includes('holidayextras.co.uk') ||
        response.url().includes('/api/') ||
        response.url().includes('availability')) {
      try {
        const body = await response.json();
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          body: body,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          error: 'Could not parse JSON',
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  console.log('🚀 Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  // Take screenshot of landing page
  await page.screenshot({
    path: join(__dirname, 'screenshots', 'march-10-18-v2-landing.png'),
    fullPage: true
  });
  console.log('📸 Landing page screenshot saved');

  console.log('\n📝 Filling out the search form...');
  console.log('   Target dates: Departure 10/03/2026 12:00, Return 18/03/2026 12:00');

  // Wait a moment for page to be fully interactive
  await page.waitForTimeout(1000);

  // STEP 1: Click the departure date field to open the calendar
  console.log('\n📅 Step 1: Opening departure date calendar...');
  const departureDateInput = await page.locator('input[placeholder="Select departure date"]');
  await departureDateInput.click();
  await page.waitForTimeout(500);

  // Take screenshot of calendar
  await page.screenshot({
    path: join(__dirname, 'screenshots', 'march-10-18-v2-calendar-open.png'),
    fullPage: true
  });
  console.log('📸 Calendar opened screenshot saved');

  // STEP 2: Make sure we're on March 2026
  // First, check if year buttons are visible and click 2026
  console.log('\n📅 Step 2: Selecting year 2026...');
  const year2026Button = await page.locator('button:has-text("2026")').first();
  await year2026Button.click();
  await page.waitForTimeout(300);

  // STEP 3: Click March in the month selector
  console.log('\n📅 Step 3: Selecting March...');
  const marchButton = await page.locator('button:has-text("Mar")').first();
  await marchButton.click();
  await page.waitForTimeout(500);

  // Take screenshot after selecting March 2026
  await page.screenshot({
    path: join(__dirname, 'screenshots', 'march-10-18-v2-march-2026.png'),
    fullPage: true
  });
  console.log('📸 March 2026 calendar screenshot saved');

  // STEP 4: Click on day 10
  console.log('\n📅 Step 4: Clicking day 10...');

  // Find the day 10 within the calendar
  // Look for a div or element with text "10" that's not disabled
  const day10 = await page.locator('.react-datepicker__day:has-text("10"):not(.react-datepicker__day--outside-month)').first();
  await day10.click();
  await page.waitForTimeout(500);

  console.log('   ✅ Departure date set to 10/03/2026');

  // STEP 5: Set departure time to 12:00
  console.log('\n⏰ Step 5: Setting departure time to 12:00...');
  const departureTimeSelect = await page.locator('select#departure-time');
  await departureTimeSelect.selectOption('12:00');
  await page.waitForTimeout(300);

  // STEP 6: Click the return date field to open calendar
  console.log('\n📅 Step 6: Opening return date calendar...');
  const returnDateInput = await page.locator('input[placeholder="Select return date"]');
  await returnDateInput.click();
  await page.waitForTimeout(500);

  // STEP 7: Make sure we're still on March 2026
  console.log('\n📅 Step 7: Ensuring March 2026 for return date...');
  const year2026ButtonReturn = await page.locator('button:has-text("2026")').first();
  await year2026ButtonReturn.click();
  await page.waitForTimeout(300);

  const marchButtonReturn = await page.locator('button:has-text("Mar")').first();
  await marchButtonReturn.click();
  await page.waitForTimeout(500);

  // STEP 8: Click on day 18
  console.log('\n📅 Step 8: Clicking day 18...');
  const day18 = await page.locator('.react-datepicker__day:has-text("18"):not(.react-datepicker__day--outside-month)').first();
  await day18.click();
  await page.waitForTimeout(500);

  console.log('   ✅ Return date set to 18/03/2026');

  // STEP 9: Set return time to 12:00
  console.log('\n⏰ Step 9: Setting return time to 12:00...');
  const returnTimeSelect = await page.locator('select#return-time');
  await returnTimeSelect.selectOption('12:00');
  await page.waitForTimeout(300);

  // Take screenshot of filled form
  await page.screenshot({
    path: join(__dirname, 'screenshots', 'march-10-18-v2-form-filled.png'),
    fullPage: true
  });
  console.log('📸 Filled form screenshot saved');

  // Verify what's in the form fields
  const depDateValue = await departureDateInput.inputValue();
  const retDateValue = await returnDateInput.inputValue();
  console.log(`\n✅ Form verification:`);
  console.log(`   Departure Date: ${depDateValue}`);
  console.log(`   Return Date: ${retDateValue}`);

  // STEP 10: Click the search button
  console.log('\n🔍 Step 10: Clicking "Search Parking →" button...');
  const searchButton = await page.locator('button:has-text("Search Parking")');
  await searchButton.click();
  console.log('   ✅ Search button clicked');

  // Wait for navigation or results
  console.log('\n⏳ Waiting for results to load...');
  await page.waitForTimeout(5000);

  // Take screenshot of results page
  await page.screenshot({
    path: join(__dirname, 'screenshots', 'march-10-18-v2-results.png'),
    fullPage: true
  });
  console.log('📸 Results page screenshot saved');

  // Check what's displayed on the page
  console.log('\n🔎 Analyzing page content...');
  const pageContent = await page.content();
  const bodyText = await page.textContent('body');

  // Check for product codes
  const hasBHI5 = bodyText.includes('BHI5') || pageContent.includes('BHI5');
  const hasMeetGreet = bodyText.toLowerCase().includes('meet') && bodyText.toLowerCase().includes('greet');
  const hasAirparks = bodyText.toLowerCase().includes('airparks');
  const hasPrice = bodyText.includes('£');

  console.log('\n📊 Page Content Analysis:');
  console.log(`   Contains "BHI5": ${hasBHI5 ? '✅ YES' : '❌ NO'}`);
  console.log(`   Contains "Meet & Greet": ${hasMeetGreet ? '✅ YES' : '❌ NO'}`);
  console.log(`   Contains "Airparks": ${hasAirparks ? '✅ YES' : '❌ NO'}`);
  console.log(`   Contains Price: ${hasPrice ? '✅ YES' : '❌ NO'}`);

  // Extract all visible text that looks like product codes or prices
  const textMatches = bodyText.match(/BH[A-Z0-9]{2,4}|£[\d.]+/g);
  if (textMatches && textMatches.length > 0) {
    console.log('\n🏷️  Product codes/prices found on page:');
    textMatches.forEach(match => console.log(`   - ${match}`));
  }

  // Check for headings that might contain product names
  const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
    elements.map(el => el.textContent?.trim()).filter(Boolean)
  );
  console.log('\n📋 Headings on page:');
  headings.forEach(h => console.log(`   - ${h}`));

  // Analyze API responses
  console.log('\n🌐 Network Activity Analysis:');
  console.log(`   Total API Requests: ${apiRequests.length}`);
  console.log(`   Total API Responses: ${apiResponses.length}`);

  const products = [];

  if (apiResponses.length > 0) {
    apiResponses.forEach((resp, idx) => {
      if (!resp.body) return;

      console.log(`\n   Response ${idx + 1}:`);
      console.log(`      URL: ${resp.url}`);
      console.log(`      Status: ${resp.status}`);

      // Check if response contains BHI5
      const responseStr = JSON.stringify(resp.body);
      const containsBHI5 = responseStr.includes('BHI5');
      console.log(`      Contains BHI5: ${containsBHI5 ? '✅ YES' : '❌ NO'}`);

      // Extract dates from API URL
      const urlMatch = resp.url.match(/ArrivalDate=([\d-]+)&.*DepartDate=([\d-]+)/);
      if (urlMatch) {
        console.log(`      API Arrival Date: ${urlMatch[1]}`);
        console.log(`      API Depart Date: ${urlMatch[2]}`);
      }

      // Try to extract products from various possible response structures
      let carParks = [];

      if (resp.body.API_Reply && resp.body.API_Reply.CarPark) {
        carParks = Array.isArray(resp.body.API_Reply.CarPark)
          ? resp.body.API_Reply.CarPark
          : [resp.body.API_Reply.CarPark];
      } else if (resp.body.products) {
        carParks = resp.body.products;
      } else if (resp.body.carParks) {
        carParks = resp.body.carParks;
      } else if (Array.isArray(resp.body)) {
        carParks = resp.body;
      }

      if (carParks.length > 0) {
        console.log(`      Products in response: ${carParks.length}`);
        carParks.forEach((cp, i) => {
          const product = {
            code: cp.Code || cp.code || cp.productCode || 'N/A',
            name: cp.Name || cp.name || cp.productName || 'N/A',
            price: cp.TotalPrice || cp.total_price || cp.price || 'N/A'
          };
          products.push(product);
          console.log(`         ${i + 1}. Code: ${product.code}, Name: ${product.name}, Price: £${product.price}`);
        });
      }
    });
  } else {
    console.log('   ⚠️  No API calls detected');
  }

  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    testParams: {
      departureDate: '10/03/2026',
      departureTime: '12:00',
      returnDate: '18/03/2026',
      returnTime: '12:00'
    },
    formValues: {
      departureDateInput: depDateValue,
      returnDateInput: retDateValue
    },
    pageAnalysis: {
      hasBHI5Code: hasBHI5,
      hasMeetGreetText: hasMeetGreet,
      hasAirparksText: hasAirparks,
      hasPriceInfo: hasPrice,
      headings: headings,
      textMatches: textMatches
    },
    productsFound: products,
    networkActivity: {
      totalRequests: apiRequests.length,
      totalResponses: apiResponses.length,
      apiCalls: apiRequests.filter(r => r.url.includes('holidayextras.co.uk')),
      responses: apiResponses.map(r => ({
        url: r.url,
        status: r.status,
        containsBHI5: r.body ? JSON.stringify(r.body).includes('BHI5') : false,
        fullBody: r.body
      }))
    },
    screenshots: [
      'screenshots/march-10-18-v2-landing.png',
      'screenshots/march-10-18-v2-calendar-open.png',
      'screenshots/march-10-18-v2-march-2026.png',
      'screenshots/march-10-18-v2-form-filled.png',
      'screenshots/march-10-18-v2-results.png'
    ]
  };

  // Save detailed report
  const reportPath = join(__dirname, 'MARCH_10_18_V2_REPORT.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to MARCH_10_18_V2_REPORT.json`);

  // Generate summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY - MARCH 10-18, 2026');
  console.log('='.repeat(70));

  if (apiResponses.length === 0) {
    console.log('\n⚠️  WARNING: No API calls detected!');
  } else {
    const bhi5InResponse = apiResponses.some(r =>
      r.body && JSON.stringify(r.body).includes('BHI5')
    );

    console.log(`\n🔍 BHI5 in API Response: ${bhi5InResponse ? '✅ YES' : '❌ NO'}`);
    console.log(`🔍 BHI5 on Page: ${hasBHI5 ? '✅ YES' : '❌ NO'}`);

    if (products.length > 0) {
      console.log('\n📦 Products Available for March 10-18, 2026:');
      const uniqueProducts = [...new Map(products.map(p => [p.code, p])).values()];
      uniqueProducts.forEach(p => {
        console.log(`   - ${p.code}: ${p.name} - £${p.price}`);
      });
    }

    if (bhi5InResponse && !hasBHI5) {
      console.log('\n❌ ISSUE: BHI5 is in API response but NOT displayed on page');
    } else if (bhi5InResponse && hasBHI5) {
      console.log('\n✅ SUCCESS: BHI5 is in API response AND displayed on page');
    } else if (!bhi5InResponse) {
      console.log('\n❌ BHI5 NOT AVAILABLE for March 10-18, 2026');
      console.log('   The API did not return BHI5 as an available product for these dates.');
    }
  }

  console.log('='.repeat(70));

  await browser.close();
}

// Run the test
testMarch10to18().catch(console.error);
