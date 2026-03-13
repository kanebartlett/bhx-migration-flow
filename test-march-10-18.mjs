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
    path: join(__dirname, 'screenshots', 'march-10-18-landing.png'),
    fullPage: true
  });
  console.log('📸 Landing page screenshot saved');

  // Use the specific dates requested: March 10-18, 2026
  const departureDate = '10/03/2026';
  const departureTime = '12:00';
  const returnDate = '18/03/2026';
  const returnTime = '12:00';

  console.log(`📅 Using dates:`);
  console.log(`   Departure: ${departureDate} at ${departureTime}`);
  console.log(`   Return: ${returnDate} at ${returnTime}`);

  // Fill out the form
  console.log('\n📝 Filling out the search form...');

  // Wait a moment for page to be fully interactive
  await page.waitForTimeout(1000);

  // Try to find and fill the date inputs
  const dateInputs = await page.$$('input[type="text"]');
  console.log(`   Found ${dateInputs.length} text inputs`);

  if (dateInputs.length >= 4) {
    console.log('   Filling departure date...');
    await dateInputs[0].fill(departureDate);

    console.log('   Filling departure time...');
    await dateInputs[1].fill(departureTime);

    console.log('   Filling return date...');
    await dateInputs[2].fill(returnDate);

    console.log('   Filling return time...');
    await dateInputs[3].fill(returnTime);
  } else {
    console.log('⚠️  Expected 4 date/time inputs not found. Trying alternative approach...');

    // Try to find inputs by placeholder or label
    const allInputs = await page.$$('input');
    console.log(`   Total inputs on page: ${allInputs.length}`);

    for (let i = 0; i < allInputs.length; i++) {
      const placeholder = await allInputs[i].getAttribute('placeholder');
      const type = await allInputs[i].getAttribute('type');
      console.log(`   Input ${i}: type="${type}", placeholder="${placeholder}"`);
    }
  }

  // Wait a moment for any auto-complete or validation
  await page.waitForTimeout(1000);

  // Take screenshot of filled form
  await page.screenshot({
    path: join(__dirname, 'screenshots', 'march-10-18-form-filled.png'),
    fullPage: true
  });
  console.log('📸 Filled form screenshot saved');

  // Click the search button
  console.log('\n🔍 Clicking "Search Parking →" button...');
  try {
    await page.click('button:has-text("Search Parking")', { timeout: 5000 });
    console.log('✅ Search button clicked');
  } catch (e) {
    console.log('⚠️  Could not find search button by text, trying alternative...');
    try {
      await page.click('button[type="submit"]');
      console.log('✅ Submit button clicked');
    } catch (e2) {
      console.log('❌ Could not find submit button');
      const buttons = await page.$$('button');
      console.log(`   Found ${buttons.length} buttons on page`);
    }
  }

  // Wait for navigation or results
  console.log('\n⏳ Waiting for results to load...');
  await page.waitForTimeout(5000);

  // Take screenshot of results page
  await page.screenshot({
    path: join(__dirname, 'screenshots', 'march-10-18-results.png'),
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
      console.log(`\n   Response ${idx + 1}:`);
      console.log(`      URL: ${resp.url}`);
      console.log(`      Status: ${resp.status}`);

      if (resp.body) {
        // Check if response contains BHI5
        const responseStr = JSON.stringify(resp.body);
        const containsBHI5 = responseStr.includes('BHI5');
        console.log(`      Contains BHI5: ${containsBHI5 ? '✅ YES' : '❌ NO'}`);

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
            console.log(`         ${i + 1}. Code: ${product.code}, Name: ${product.name}, Price: ${product.price}`);
          });
        } else {
          console.log(`      No products array found in response structure`);
        }
      }
    });
  } else {
    console.log('   ⚠️  No API calls detected - possibly using mock data or API not called yet');
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
      requests: apiRequests,
      responses: apiResponses.map(r => ({
        url: r.url,
        status: r.status,
        containsBHI5: r.body ? JSON.stringify(r.body).includes('BHI5') : false,
        responseBodySample: r.body ? JSON.stringify(r.body).substring(0, 500) : null
      }))
    },
    screenshots: [
      'screenshots/march-10-18-landing.png',
      'screenshots/march-10-18-form-filled.png',
      'screenshots/march-10-18-results.png'
    ]
  };

  // Save detailed report
  writeFileSync(
    join(__dirname, 'MARCH_10_18_TEST_REPORT.json'),
    JSON.stringify(report, null, 2)
  );
  console.log('\n📄 Detailed report saved to MARCH_10_18_TEST_REPORT.json');

  // Generate summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY - MARCH 10-18, 2026');
  console.log('='.repeat(60));

  if (apiResponses.length === 0) {
    console.log('\n⚠️  WARNING: No API calls detected!');
    console.log('   This suggests the app may be using:');
    console.log('   - Mock/fallback data');
    console.log('   - Cached data');
    console.log('   - Or API calls haven\'t been triggered yet');
  } else {
    const bhi5InResponse = apiResponses.some(r =>
      r.body && JSON.stringify(r.body).includes('BHI5')
    );

    console.log(`\n🔍 BHI5 in API Response: ${bhi5InResponse ? '✅ YES' : '❌ NO'}`);
    console.log(`🔍 BHI5 on Page: ${hasBHI5 ? '✅ YES' : '❌ NO'}`);

    if (products.length > 0) {
      console.log('\n📦 Products Available:');
      products.forEach(p => {
        console.log(`   - ${p.code}: ${p.name} - ${p.price}`);
      });
    }

    if (bhi5InResponse && !hasBHI5) {
      console.log('\n❌ ISSUE: BHI5 is in API response but NOT displayed on page');
      console.log('   Possible causes:');
      console.log('   - Filtering logic removing BHI5');
      console.log('   - Display logic not rendering BHI5');
      console.log('   - Wrong product being selected');
    } else if (bhi5InResponse && hasBHI5) {
      console.log('\n✅ SUCCESS: BHI5 is in API response AND displayed on page');
    } else if (!bhi5InResponse && hasBHI5) {
      console.log('\n⚠️  INTERESTING: BHI5 shown but not in API (using fallback?)');
    } else {
      console.log('\n❌ BHI5 not found in API response or on page');
    }
  }

  console.log('='.repeat(60));
  console.log('\n✅ Test complete! Check screenshots folder and MARCH_10_18_TEST_REPORT.json for details.');

  await browser.close();
}

// Run the test
testMarch10to18().catch(console.error);
