#!/usr/bin/env node

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testBHI5Availability() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Track network requests
  const apiRequests = [];
  const apiResponses = [];

  page.on('request', request => {
    if (request.url().includes('holidayextras.co.uk')) {
      apiRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('response', async response => {
    if (response.url().includes('holidayextras.co.uk')) {
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
    path: join(__dirname, 'screenshots', 'bhi5-test-landing.png'),
    fullPage: true
  });
  console.log('📸 Landing page screenshot saved');

  // Calculate dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + 8);

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const departureDate = formatDate(tomorrow);
  const returnDateStr = formatDate(returnDate);

  console.log(`📅 Using dates:`);
  console.log(`   Departure: ${departureDate} at 12:00`);
  console.log(`   Return: ${returnDateStr} at 12:00`);

  // Fill out the form
  console.log('\n📝 Filling out the search form...');

  // Click departure date field
  await page.click('[placeholder="Select date"]', { timeout: 5000 }).catch(() => {
    console.log('⚠️  Could not click date field by placeholder, trying alternative selector');
  });

  // Wait a moment for calendar to potentially open
  await page.waitForTimeout(500);

  // Try to type the date directly into the first date field
  const dateInputs = await page.$$('input[type="text"]');
  if (dateInputs.length >= 4) {
    console.log('   Filling departure date...');
    await dateInputs[0].fill(departureDate);

    console.log('   Filling departure time...');
    await dateInputs[1].fill('12:00');

    console.log('   Filling return date...');
    await dateInputs[2].fill(returnDateStr);

    console.log('   Filling return time...');
    await dateInputs[3].fill('12:00');
  } else {
    console.log('⚠️  Expected date/time inputs not found. Found:', dateInputs.length);
    const allInputs = await page.$$('input');
    console.log('   Total inputs on page:', allInputs.length);
  }

  // Take screenshot of filled form
  await page.screenshot({
    path: join(__dirname, 'screenshots', 'bhi5-test-form-filled.png'),
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
    await page.click('button[type="submit"]').catch(() => {
      console.log('❌ Could not find submit button');
    });
  }

  // Wait for navigation or results
  console.log('\n⏳ Waiting for results to load...');
  await page.waitForTimeout(3000);

  // Take screenshot of results page
  await page.screenshot({
    path: join(__dirname, 'screenshots', 'bhi5-test-results.png'),
    fullPage: true
  });
  console.log('📸 Results page screenshot saved');

  // Check what's displayed on the page
  console.log('\n🔎 Analyzing page content...');
  const pageContent = await page.content();
  const bodyText = await page.textContent('body');

  // Check for product code on page
  const hasBHI5 = bodyText.includes('BHI5') || pageContent.includes('BHI5');
  const hasMeetGreet = bodyText.toLowerCase().includes('meet') && bodyText.toLowerCase().includes('greet');
  const hasAirparks = bodyText.toLowerCase().includes('airparks');
  const hasPrice = bodyText.includes('£') || bodyText.includes('78.79');

  console.log('\n📊 Page Content Analysis:');
  console.log(`   Contains "BHI5": ${hasBHI5 ? '✅ YES' : '❌ NO'}`);
  console.log(`   Contains "Meet & Greet": ${hasMeetGreet ? '✅ YES' : '❌ NO'}`);
  console.log(`   Contains "Airparks": ${hasAirparks ? '✅ YES' : '❌ NO'}`);
  console.log(`   Contains Price: ${hasPrice ? '✅ YES' : '❌ NO'}`);

  // Extract product info from page
  const productElements = await page.$$('[data-testid*="product"], .product, [class*="product"]');
  console.log(`\n   Found ${productElements.length} potential product elements`);

  // Check for headings that might contain product names
  const headings = await page.$$eval('h1, h2, h3, h4', elements =>
    elements.map(el => el.textContent?.trim()).filter(Boolean)
  );
  console.log('\n📋 Headings on page:');
  headings.slice(0, 10).forEach(h => console.log(`   - ${h}`));

  // Analyze API responses
  console.log('\n🌐 Network Activity Analysis:');
  console.log(`   Total API Requests: ${apiRequests.length}`);
  console.log(`   Total API Responses: ${apiResponses.length}`);

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

        // Try to extract products
        if (resp.body.API_Reply && resp.body.API_Reply.CarPark) {
          const carParks = Array.isArray(resp.body.API_Reply.CarPark)
            ? resp.body.API_Reply.CarPark
            : [resp.body.API_Reply.CarPark];

          console.log(`      Products in response: ${carParks.length}`);
          carParks.forEach((cp, i) => {
            console.log(`         ${i + 1}. Code: ${cp.Code || cp.code || 'N/A'}, Name: ${cp.Name || cp.name || 'N/A'}, Price: ${cp.TotalPrice || cp.total_price || 'N/A'}`);
          });
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
      departureDate,
      departureTime: '12:00',
      returnDate: returnDateStr,
      returnTime: '12:00'
    },
    pageAnalysis: {
      hasBHI5Code: hasBHI5,
      hasMeetGreetText: hasMeetGreet,
      hasAirparksText: hasAirparks,
      hasPriceInfo: hasPrice,
      headings: headings
    },
    networkActivity: {
      totalRequests: apiRequests.length,
      totalResponses: apiResponses.length,
      requests: apiRequests,
      responses: apiResponses.map(r => ({
        url: r.url,
        status: r.status,
        containsBHI5: r.body ? JSON.stringify(r.body).includes('BHI5') : false,
        body: r.body
      }))
    },
    screenshots: [
      'screenshots/bhi5-test-landing.png',
      'screenshots/bhi5-test-form-filled.png',
      'screenshots/bhi5-test-results.png'
    ]
  };

  // Save detailed report
  writeFileSync(
    join(__dirname, 'BHI5_TEST_REPORT.json'),
    JSON.stringify(report, null, 2)
  );
  console.log('\n📄 Detailed report saved to BHI5_TEST_REPORT.json');

  // Generate summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
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

  await browser.close();
}

// Run the test
testBHI5Availability().catch(console.error);
