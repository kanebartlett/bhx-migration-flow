import express from 'express';
import cors from 'cors';
import { scrapeBHXPrices, findCarPark1 } from './bhx-scraper-playwright.js';

const app = express();
const PORT = 3001;

// Enable CORS for the frontend
app.use(cors({
  origin: 'http://localhost:5173' // Vite dev server
}));

app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'bhx-pricing-api' });
});

/**
 * Get BHX parking prices
 * Query params:
 * - entryDate: dd/mm/yyyy
 * - entryTime: HH:MM (optional, defaults to 12:00)
 * - exitDate: dd/mm/yyyy
 * - exitTime: HH:MM (optional, defaults to 12:00)
 * - promoCode: string (optional)
 */
app.get('/api/bhx-prices', async (req, res) => {
  try {
    const { entryDate, entryTime, exitDate, exitTime, promoCode } = req.query;

    if (!entryDate || !exitDate) {
      return res.status(400).json({
        error: 'Missing required parameters: entryDate and exitDate'
      });
    }

    console.log(`Fetching BHX prices for ${entryDate} to ${exitDate}`);

    const products = await scrapeBHXPrices({
      entryDate,
      entryTime: entryTime || '12:00',
      exitDate,
      exitTime: exitTime || '12:00',
      promoCode: promoCode || '',
    });

    // Find Car Park 1 specifically
    const carPark1 = findCarPark1(products);

    res.json({
      success: true,
      products,
      carPark1,
      count: products.length,
    });
  } catch (error) {
    console.error('Error fetching BHX prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing data',
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`BHX Pricing API running on http://localhost:${PORT}`);
  console.log(`Frontend should be at http://localhost:5173`);
});
