# BHX Pricing API Server

This server scrapes live parking prices from Birmingham Airport's website and provides them via a REST API.

## Running the Server

### Start both frontend and backend:

**Terminal 1 - Backend API:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The backend runs on `http://localhost:3001`
The frontend runs on `http://localhost:5173`

## API Endpoints

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "service": "bhx-pricing-api"
}
```

### GET /api/bhx-prices
Get parking prices from Birmingham Airport

**Query Parameters:**
- `entryDate` (required): Format `dd/mm/yyyy` (e.g., `20/03/2026`)
- `entryTime` (optional): Format `HH:MM` (e.g., `12:00`, defaults to `12:00`)
- `exitDate` (required): Format `dd/mm/yyyy` (e.g., `27/03/2026`)
- `exitTime` (optional): Format `HH:MM` (e.g., `12:00`, defaults to `12:00`)
- `promoCode` (optional): Promo code if applicable

**Example:**
```bash
curl "http://localhost:3001/api/bhx-prices?entryDate=20/03/2026&exitDate=27/03/2026"
```

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "SKU_1-219",
      "name": "Car Park 1 - Flex Plus",
      "price": 120.97,
      "transferType": "walk",
      "transferTime": "1 [min]",
      "discount": null,
      "brand": "BHX",
      "index": 0
    }
  ],
  "carPark1": {
    "id": "SKU_1-219",
    "name": "Car Park 1 - Flex Plus",
    "price": 120.97,
    "transferType": "walk",
    "transferTime": "1 [min]",
    "discount": null,
    "brand": "BHX",
    "index": 0
  },
  "count": 7
}
```

## How It Works

1. **Session Priming**: The server first makes a GET request to `prebook.birminghamairport.co.uk` to establish session cookies
2. **Price Scraping**: It then POSTs the date/time parameters to the parking results endpoint
3. **Data Extraction**: The server extracts `GTM_Product_items` from the HTML response using regex
4. **Normalization**: Product data is normalized and returned as JSON

## Notes

- This is an **unofficial scraper** - the BHX website could change at any time
- Prices are **live and dynamic** - they may vary based on availability
- The scraper specifically looks for "Car Park 1" products for comparison
- CORS is enabled for `http://localhost:5173` (the Vite dev server)
