import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

/**
 * Scrape parking prices from Birmingham Airport website
 * @param {Object} params
 * @param {string} params.entryDate - Format: dd/mm/yyyy
 * @param {string} params.entryTime - Format: HH:MM
 * @param {string} params.exitDate - Format: dd/mm/yyyy
 * @param {string} params.exitTime - Format: HH:MM
 * @param {string} params.promoCode - Optional promo code
 * @returns {Promise<Array>} Array of products with pricing
 */
export async function scrapeBHXPrices({ entryDate, entryTime = '12:00', exitDate, exitTime = '12:00', promoCode = '' }) {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };

    // Step 1: Prime the session cookies
    console.log('Step 1: Priming session...');
    await client.get('https://prebook.birminghamairport.co.uk/', { headers });

    // Small delay to mimic human behavior
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 2: POST the search
    const params = new URLSearchParams({
      'data[entry-date]': entryDate,
      'data[entry-time]': entryTime,
      'data[exit-date]': exitDate,
      'data[exit-time]': exitTime,
      'data[promo-code]': promoCode,
    });

    console.log('Step 2: Posting search...');
    const { data: html } = await client.post(
      'https://prebook.birminghamairport.co.uk/parking/results',
      params.toString(),
      {
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': 'https://prebook.birminghamairport.co.uk',
          'Referer': 'https://prebook.birminghamairport.co.uk/',
        }
      }
    );

    // Step 3: Extract GTM_Product_items from the HTML
    console.log('Received HTML response, length:', html.length);
    console.log('Searching for GTM_Product_items...');

    const match = html.match(/var\s+GTM_Product_items\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) {
      console.error('Could not find GTM_Product_items in response');

      // Check if we got a valid HTML page
      if (html.includes('<!DOCTYPE') || html.includes('<html')) {
        console.error('Got HTML page but no GTM_Product_items variable');
        // Log a snippet to see what we got
        const snippet = html.substring(0, 500);
        console.error('HTML snippet:', snippet);
      } else {
        console.error('Response does not appear to be HTML');
      }

      return [];
    }

    console.log('Found GTM_Product_items, parsing...');
    console.log('Matched string (first 200 chars):', match[1].substring(0, 200));

    const products = JSON.parse(match[1]);
    console.log('Parsed', products.length, 'products');

    if (products.length > 0) {
      console.log('First product:', products[0]);
    } else {
      console.log('Empty products array - checking if there are any parking results in the HTML...');
      const hasResults = html.includes('parking') || html.includes('Car Park');
      console.log('HTML contains parking references:', hasResults);
    }

    // Step 4: Normalize and return
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
