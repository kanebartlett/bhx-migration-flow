import type { AvailabilityResponse, CarParkProduct, ParkingSearchParams } from '../types';

const API_BASE_URL = 'https://api.holidayextras.co.uk/v1';
const ABTA_NUMBER = 'WEB1';
const API_KEY = 'foo';
const API_TOKEN = 'TOKEN';
const TIMEOUT_MS = 3000;
const IMAGE_CDN_BASE = 'https://d1xcii4rs5n6co.cloudfront.net';

export class HolidayExtrasAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public isTimeout?: boolean
  ) {
    super(message);
    this.name = 'HolidayExtrasAPIError';
  }
}

/**
 * Fetch car park availability from Holiday Extras API
 */
export async function fetchCarParkAvailability(
  params: ParkingSearchParams
): Promise<AvailabilityResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const queryParams = new URLSearchParams({
      ABTANumber: ABTA_NUMBER,
      key: API_KEY,
      token: API_TOKEN,
      ArrivalDate: params.arrivalDate,
      ArrivalTime: params.arrivalTime.replace(':', ''), // API expects HHMM format
      DepartDate: params.departureDate,
      DepartTime: params.departureTime.replace(':', ''), // API expects HHMM format
      NumberOfPax: '2',
      fields: 'tripappimages',
    });

    const url = `${API_BASE_URL}/carpark/${params.location}.js?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new HolidayExtrasAPIError(
          'No parking available for the selected dates. Please try different dates.',
          404
        );
      }
      if (response.status === 401 || response.status === 403) {
        throw new HolidayExtrasAPIError(
          'Authentication failed. Please contact support.',
          response.status
        );
      }
      throw new HolidayExtrasAPIError(
        `API request failed with status ${response.status}`,
        response.status
      );
    }

    const data = await response.json();


    // Transform API response to our format
    // Note: The actual API response structure may differ - this is a placeholder
    const products = transformAPIResponse(data);

    return {
      success: true,
      products,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof HolidayExtrasAPIError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new HolidayExtrasAPIError(
        'Request timed out. Please check your connection and try again.',
        undefined,
        true
      );
    }

    throw new HolidayExtrasAPIError(
      'An unexpected error occurred. Please try again.',
      undefined
    );
  }
}

/**
 * Transform API response to our CarParkProduct format
 * Note: This is a placeholder - actual API structure needs to be verified
 */
function transformAPIResponse(data: any): CarParkProduct[] {
  // TODO: Update this based on actual API response structure
  // For now, returning mock data structure

  if (!data || !data.API_Reply || !data.API_Reply.CarPark) {
    return [];
  }

  const carParks = Array.isArray(data.API_Reply.CarPark)
    ? data.API_Reply.CarPark
    : [data.API_Reply.CarPark];

  return carParks.map((carPark: any) => ({
    code: carPark.Code || carPark.code || '',
    name: carPark.Name || carPark.name || '',
    description: carPark.Description || carPark.description || '',
    price: parseFloat(carPark.TotalPrice || carPark.total_price || '0'),
    currency: carPark.Currency || 'GBP',
    transferTime: carPark.transfer_time || carPark.TransferTime,
    distance: carPark.Distance || carPark.distance,
    productType: determineProductType(carPark),
    // Extract image URLs from API response
    imageUrl: extractImageUrl(carPark),
    images: extractImages(carPark),
    // Additional features based on product type
    ...extractFeatures(carPark),
  }));
}

/**
 * Determine product type from API response
 */
function determineProductType(carPark: any): 'meet-and-greet' | 'park-and-ride' | 'on-airport' {
  const name = (carPark.Name || carPark.name || '').toLowerCase();
  const code = (carPark.Code || carPark.code || '').toLowerCase();

  if (name.includes('meet') && name.includes('greet') || code.includes('meet')) {
    return 'meet-and-greet';
  }
  if (name.includes('park') && name.includes('ride')) {
    return 'park-and-ride';
  }
  return 'on-airport';
}

/**
 * Convert API image path to full CDN URL
 */
function convertImagePath(path: string): string {
  if (!path) return '';
  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Convert API path format to CDN URL format
  // API returns: /imageLibrary/Images/169/13407_BHX_APS_Premium_Meet_and_Greet.png
  // CDN expects: /libraryimages/169/13407_BHX_APS_Premium_Meet_and_Greet.png
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  cleanPath = cleanPath.replace('/imageLibrary/Images/', '/libraryimages/');
  return `${IMAGE_CDN_BASE}${cleanPath}`;
}

/**
 * Extract main image URL from API response
 */
function extractImageUrl(carPark: any): string | undefined {
  // Try all possible field name variations for tripappimages (case-insensitive)
  const imageField = carPark.tripappimages || carPark.tripAppImages || carPark.TripAppImages;

  if (imageField && typeof imageField === 'string') {
    const images = imageField.split(';').filter((img: string) => img.trim());
    if (images.length > 0) {
      return convertImagePath(images[0].trim());
    }
  }

  // Fallback to other possible image field locations
  if (carPark.MoreInfo?.Image) {
    return convertImagePath(carPark.MoreInfo.Image);
  }
  if (carPark.Image || carPark.image) {
    return convertImagePath(carPark.Image || carPark.image);
  }
  if (carPark.MoreInfo?.Images && Array.isArray(carPark.MoreInfo.Images) && carPark.MoreInfo.Images.length > 0) {
    return convertImagePath(carPark.MoreInfo.Images[0]);
  }
  if (carPark.Images && Array.isArray(carPark.Images) && carPark.Images.length > 0) {
    return convertImagePath(carPark.Images[0]);
  }
  if (carPark.images && Array.isArray(carPark.images) && carPark.images.length > 0) {
    return convertImagePath(carPark.images[0]);
  }

  return undefined;
}

/**
 * Extract all images from API response
 */
function extractImages(carPark: any): string[] | undefined {
  // First try tripappimages field (semicolon-separated list)
  if (carPark.tripappimages) {
    const images = carPark.tripappimages.split(';')
      .filter((img: string) => img.trim())
      .map((img: string) => convertImagePath(img.trim()));
    if (images.length > 0) {
      return images;
    }
  }

  // Fallback to other possible image array locations
  if (carPark.MoreInfo?.Images && Array.isArray(carPark.MoreInfo.Images)) {
    return carPark.MoreInfo.Images.map(convertImagePath);
  }
  if (carPark.Images && Array.isArray(carPark.Images)) {
    return carPark.Images.map(convertImagePath);
  }
  return undefined;
}

/**
 * Extract features from API response
 */
function extractFeatures(carPark: any) {
  const features: any = {};

  // These would be mapped from actual API fields
  if (carPark.Features) {
    features.noOverstayCharges = carPark.Features.NoOverstayCharges || false;
    features.onlineCheckin = carPark.Features.OnlineCheckin || false;
    features.carTracking = carPark.Features.CarTracking || false;
    features.carCleaning = carPark.Features.CarCleaning || false;
    features.evFacilities = carPark.Features.EVFacilities || false;
    features.premiumBays = carPark.Features.PremiumBays || false;
    features.toiletOnSite = carPark.Features.ToiletOnSite || false;
  }

  return features;
}

/**
 * Filter products to get meet and greet options
 */
export function filterMeetAndGreetProducts(products: CarParkProduct[]): CarParkProduct[] {
  return products.filter(product => product.productType === 'meet-and-greet');
}

/**
 * Mock data for development/testing
 */
export function getMockMeetAndGreetProduct(): CarParkProduct {
  return {
    code: 'BHI5',
    name: 'Airparks Premium Meet & Greet',
    description: 'Premium meet and greet service at Birmingham Airport',
    price: 78.79,
    currency: 'GBP',
    transferTime: 0,
    productType: 'meet-and-greet',
    trustPilotRating: 4.5,
    noOverstayCharges: true,
    onlineCheckin: true,
    carTracking: true,
    carCleaning: true,
    evFacilities: true,
    premiumBays: true,
    toiletOnSite: true,
    timeToTerminal: 3, // minutes
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
  };
}

/**
 * Generate booking URL from product code and search params
 */
export function generateBookingURL(
  productCode: string,
  searchParams: ParkingSearchParams,
  urlParams?: Record<string, string>
): string {
  const params = new URLSearchParams({
    agent: urlParams?.agent || 'BD047',
    lang: 'en',
    depart: searchParams.location,
    in: searchParams.arrivalDate,
    out: searchParams.departureDate,
    park_from: searchParams.arrivalTime,
    park_to: searchParams.departureTime,
    ...urlParams,
  });

  return `https://www.holidayextras.com/static/?selectProduct=cp&#/carpark/${productCode}/payment/detailsConfirm?${params.toString()}`;
}
