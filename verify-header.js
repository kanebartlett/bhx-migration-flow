import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();

  // Mobile test
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173');
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({
    path: '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/mobile-header.png',
    fullPage: false
  });

  // Check if tagline is visible on mobile
  const mobileTaglineVisible = await mobilePage.evaluate(() => {
    const tagline = document.querySelector('[class*="tagline"]') ||
                   document.evaluate("//text()[contains(., 'Less hassle')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.parentElement;
    if (!tagline) return false;
    const style = window.getComputedStyle(tagline);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  });

  await mobileContext.close();

  // Desktop test
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5173');
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({
    path: '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/desktop-header.png',
    fullPage: false
  });

  // Check if tagline is visible on desktop
  const desktopTaglineVisible = await desktopPage.evaluate(() => {
    const tagline = document.querySelector('[class*="tagline"]') ||
                   document.evaluate("//text()[contains(., 'Less hassle')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.parentElement;
    if (!tagline) return false;
    const style = window.getComputedStyle(tagline);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  });

  await desktopContext.close();
  await browser.close();

  console.log(JSON.stringify({
    mobile: {
      taglineVisible: mobileTaglineVisible,
      screenshotPath: '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/mobile-header.png'
    },
    desktop: {
      taglineVisible: desktopTaglineVisible,
      screenshotPath: '/Users/kane.bartlett/parking-merch-project/my-new-project/insurance-cross-sell/bhx-migration-flow/desktop-header.png'
    }
  }, null, 2));
})();
