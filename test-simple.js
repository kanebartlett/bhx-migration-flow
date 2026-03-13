import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const logs = [];

  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    logs.push(`[ERROR] ${error.message}`);
  });

  try {
    await page.goto('http://localhost:5173/landing', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(3000);

    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        innerHTML: root ? root.innerHTML : 'NO ROOT',
        childCount: root ? root.children.length : 0,
        hasText: root ? root.textContent.length : 0
      };
    });

    console.log('Root element status:');
    console.log(JSON.stringify(rootContent, null, 2));

    console.log('\nConsole logs:');
    logs.forEach(log => console.log(log));

    console.log('\nChecking for specific elements...');
    const checks = await page.evaluate(() => {
      return {
        hasHeader: !!document.querySelector('header'),
        hasH1: !!document.querySelector('h1'),
        hasForm: !!document.querySelector('form'),
        hasDateInput: !!document.querySelector('input[type="date"]'),
        bodyText: document.body.textContent.substring(0, 100)
      };
    });

    console.log(JSON.stringify(checks, null, 2));

    await page.screenshot({ path: 'test-screenshots/simple-test.png', fullPage: true });
    console.log('\nScreenshot saved.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

test().catch(console.error);
