import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 10000 });

    // Wait a bit for React to render
    await page.waitForTimeout(2000);

    // Take full screenshot
    await page.screenshot({
      path: '/tmp/header-gap-verification.png',
      fullPage: false
    });

    // Measure the gap - get positions of header bottom and hero heading top
    const measurements = await page.evaluate(() => {
      // Find the header (logo/tagline area)
      const header = document.querySelector('header');
      const headerRect = header ? header.getBoundingClientRect() : null;

      // Get hero section
      const heroSection = document.querySelector('[class*="hero"], [class*="Hero"]');
      const heroSectionRect = heroSection ? heroSection.getBoundingClientRect() : null;

      // Find all headings in hero section
      const headings = heroSection ? Array.from(heroSection.querySelectorAll('h1, h2, h3')) : [];
      const firstHeading = headings[0];
      const firstHeadingRect = firstHeading ? firstHeading.getBoundingClientRect() : null;

      return {
        headerBottom: headerRect ? Math.round(headerRect.bottom) : null,
        heroSectionTop: heroSectionRect ? Math.round(heroSectionRect.top) : null,
        firstHeadingTop: firstHeadingRect ? Math.round(firstHeadingRect.top) : null,

        gapHeaderToHeroSection: (headerRect && heroSectionRect) ?
          Math.round(heroSectionRect.top - headerRect.bottom) : null,

        gapHeaderToHeading: (headerRect && firstHeadingRect) ?
          Math.round(firstHeadingRect.top - headerRect.bottom) : null,

        headerHeight: headerRect ? Math.round(headerRect.height) : null,
        firstHeadingText: firstHeading ? firstHeading.textContent.trim().substring(0, 50) : null,
        headingCount: headings.length,
        hasHeader: !!header,
        hasHeroSection: !!heroSection
      };
    });

    console.log(JSON.stringify(measurements, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
