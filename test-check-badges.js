import { chromium } from 'playwright';
import { format, addDays } from 'date-fns';

async function checkBadges() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    await page.goto(`http://localhost:5173/availability?arrivalDate=${tomorrow}&departureDate=${nextWeek}&location=BHX`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');

    console.log('Checking for "RECOMMENDED"...');
    console.log('Found:', bodyText.includes('RECOMMENDED'));
    console.log('Full search (case-insensitive):', /RECOMMENDED/i.test(bodyText));

    console.log('\nChecking for "NO LONGER AVAILABLE"...');
    console.log('Found:', bodyText.includes('NO LONGER AVAILABLE'));
    console.log('Full search (case-insensitive):', /NO LONGER AVAILABLE/i.test(bodyText));

    console.log('\nChecking element counts...');
    const recommendedCount = await page.locator('text=RECOMMENDED').count();
    const noLongerCount = await page.locator('text="NO LONGER AVAILABLE"').count();

    console.log('RECOMMENDED elements:', recommendedCount);
    console.log('NO LONGER AVAILABLE elements:', noLongerCount);

    // Check for partial matches
    console.log('\nPartial matches:');
    console.log('Contains "RECOMMENDED":', bodyText.includes('RECOMMENDED'));
    console.log('Contains "NO LONGER":', bodyText.includes('NO LONGER'));
    console.log('Contains "AVAILABLE":', bodyText.includes('AVAILABLE'));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

checkBadges().catch(console.error);
