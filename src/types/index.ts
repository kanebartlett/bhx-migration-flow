// Holiday Extras API Types

export interface ParkingSearchParams {
  arrivalDate: string; // YYYY-MM-DD
  arrivalTime: string; // HH:MM
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // HH:MM
  location: string; // e.g., 'BHX'
}

export interface CarParkProduct {
  code: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  transferTime?: number;
  distance?: string;
  trustPilotRating?: number;
  features?: ProductFeature[];
  productType?: 'meet-and-greet' | 'park-and-ride' | 'on-airport';
  noOverstayCharges?: boolean;
  onlineCheckin?: boolean;
  carTracking?: boolean;
  carCleaning?: boolean;
  evFacilities?: boolean;
  premiumBays?: boolean;
  toiletOnSite?: boolean;
  timeToTerminal?: number; // minutes
  imageUrl?: string; // Main product image
  images?: string[]; // Additional images from tripappimages
}

export interface ProductFeature {
  name: string;
  available: boolean;
  icon?: string;
}

export interface AvailabilityResponse {
  success: boolean;
  products: CarParkProduct[];
  error?: string;
}

export interface ComparisonData {
  meetAndGreet: CarParkProduct;
  oldProduct: {
    name: string;
    price: number;
    timeToTerminal: number;
    features: string[];
  };
  savings: {
    price: number;
    time: number; // minutes
    percentage: number;
  };
  benefits: string[];
}

export interface URLParams {
  agent?: string;
  location?: string;
  user_ext_id?: string;
  CampaignID?: string;
  launch_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  image?: string;
  successfulLogin?: string;
  err?: string;
  migration?: string;
}
