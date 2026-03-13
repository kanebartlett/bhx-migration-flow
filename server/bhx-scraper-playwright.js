import { chromium } from 'playwright';

/**
 * Scrape parking prices from Birmingham Airport website using Playwright
 * @param {Object} params
 * @param {string} params.entryDate - Format: dd/mm/yyyy
 * @param {string} params.entryTime - Format: HH:MM
 * @param {string} params.exitDate - Format: dd/mm/yyyy
 * @param {string} params.exitTime - Format: HH:MM
 * @param {string} params.promoCode - Optional promo code
 * @returns {Promise<Array>} Array of products with pricing
 */
export async function scrapeBHXPrices({ entryDate, entryTime = '12:00', exitDate, exitTime = '12:00', promoCode = '' }) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-GB',
  });
  const page = await context.newPage();

  try {
    // Step 1: Visit homepage to establish session
    console.log('Step 1: Visiting homepage to establish session...');
    await page.goto('https://prebook.birminghamairport.co.uk/', { waitUntil: 'domcontentloaded' });

    // Step 2: Submit form via JavaScript (POST request)
    console.log('Step 2: Submitting form via JavaScript...');
    await page.evaluate((params) => {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://prebook.birminghamairport.co.uk/parking/results';

      const fields = [
        ['data[entry-date]', params.entryDate],
        ['data[entry-time]', params.entryTime],
        ['data[exit-date]', params.exitDate],
        ['data[exit-time]', params.exitTime],
        ['data[promo-code]', params.promoCode],
      ];

      fields.forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    }, { entryDate, entryTime, exitDate, exitTime, promoCode });

    // Wait for navigation to complete
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });

    // Wait for GTM_Product_items to be populated
    console.log('Waiting for products to load...');
    await page.waitForFunction(() => {
      return typeof window.GTM_Product_items !== 'undefined' &&
             Array.isArray(window.GTM_Product_items) &&
             window.GTM_Product_items.length > 0;
    }, { timeout: 10000 });

    // Extract the products
    const products = await page.evaluate(() => {
      return window.GTM_Product_items;
    });

    console.log('Found', products.length, 'products');

    await browser.close();

    // Normalize and return
    return products.map(p => ({
      id: p.item_id,
      name: p.item_name.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' '),
      price: parseFloat(p.price),
      transferType: p.item_category3, // 'walk' | 'bus'
      transferTime: p.item_category4,
      discount: p.discount ? parseFloat(p.discount) : null,
      brand: p.item_brand,
      index: p.index,
    }));
  } catch (error) {
    await browser.close();
    console.error('BHX scraping error:', error.message);
    throw error;
  }
}

/**
 * Find Car Park 1 product from BHX results
 * @param {Array} products - Array of BHX products
 * @returns {Object|null} Car Park 1 product or null if not found
 */
export function findCarPark1(products) {
  return products.find(p =>
    p.name.toLowerCase().includes('car park 1')
  ) || null;
}
