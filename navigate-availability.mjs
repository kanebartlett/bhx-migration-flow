import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1500);
  
  // Click the Search Parking button
  await page.click('button:has-text("Search Parking")');
  await page.waitForTimeout(2000);
  
  // Take screenshot of availability page desktop
  await page.screenshot({ path: 'availability-desktop.png' });
  
  await browser.close();
  
  // Now mobile
  const browser2 = await chromium.launch();
  const context2 = await browser2.newContext({ viewport: { width: 375, height: 667 } });
  const page2 = await context2.newPage();
  
  await page2.goto('http://localhost:5173');
  await page2.waitForTimeout(1500);
  
  // Click the Search Parking button
  await page2.click('button:has-text("Search Parking")');
  await page2.waitForTimeout(2000);
  
  // Take screenshot of availability page mobile
  await page2.screenshot({ path: 'availability-mobile.png' });
  
  await browser2.close();
})();
