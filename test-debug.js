import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: false }); // Run with visible browser
  const page = await browser.newPage();

  // Capture all console messages
  page.on('console', msg => {
    console.log(`BROWSER [${msg.type()}]:`, msg.text());
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  // Capture request failures
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  try {
    console.log('Navigating to http://localhost:5173/landing...');
    await page.goto('http://localhost:5173/landing', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('\nWaiting 5 seconds for React to render...');
    await page.waitForTimeout(5000);

    console.log('\nPage title:', await page.title());
    console.log('Page URL:', page.url());

    const html = await page.content();
    console.log('\nPage HTML length:', html.length);

    const bodyText = await page.textContent('body');
    console.log('\nBody text content:', bodyText.substring(0, 200));

    const rootHtml = await page.innerHTML('#root');
    console.log('\n#root innerHTML:', rootHtml.substring(0, 500));

    await page.screenshot({ path: 'test-screenshots/debug.png', fullPage: true });
    console.log('\nScreenshot saved to test-screenshots/debug.png');

    console.log('\nPress Ctrl+C to exit...');
    await page.waitForTimeout(60000); // Keep browser open for 60 seconds

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debug().catch(console.error);
