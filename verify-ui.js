import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();

  // Desktop screenshot
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktopPage.goto('http://localhost:5173');
  await desktopPage.waitForLoadState('networkidle');
  await desktopPage.screenshot({ path: '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/desktop-screenshot.png', fullPage: true });

  // Mobile screenshot
  const mobilePage = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await mobilePage.goto('http://localhost:5173');
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/mobile-screenshot.png', fullPage: true });

  await browser.close();
  console.log('Screenshots saved successfully');
})();
