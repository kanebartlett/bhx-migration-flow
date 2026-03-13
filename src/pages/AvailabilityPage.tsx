import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/brand';
import type { CarParkProduct, ParkingSearchParams } from '../types';
import { fetchCarParkAvailability, generateBookingURL, getMockMeetAndGreetProduct, HolidayExtrasAPIError } from '../api/client';
import '../styles/AvailabilityPage.css';
import '../styles/LandingPage.css';

// BHX API configuration
const BHX_API_URL = 'http://localhost:3001/api/bhx-prices';

// Old product comparison data (Car Park 1) - fallback if API fails
const OLD_PRODUCT_DATA = {
  name: 'BHX Car Park 1',
  price: 99.99,
  timeToTerminal: 10, // minutes
  features: [] as string[], // No features
};

// Convert YYYY-MM-DD to dd/mm/yyyy for BHX API
function convertDateFormat(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Fallback image if API doesn't provide one
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80';

export function AvailabilityPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [product, setProduct] = useState<CarParkProduct | null>(null);
  const [bhxCarPark1, setBhxCarPark1] = useState<{ name: string; price: number; timeToTerminal: number; isLive: boolean } | null>(null);
  const [bhxLoading, setBhxLoading] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [searchParams]);

  const loadBHXPrices = async (params: ParkingSearchParams) => {
    try {
      setBhxLoading(true);

      const queryParams = new URLSearchParams({
        entryDate: convertDateFormat(params.arrivalDate),
        entryTime: params.arrivalTime,
        exitDate: convertDateFormat(params.departureDate),
        exitTime: params.departureTime,
      });

      console.log('Fetching BHX prices for:', queryParams.toString());

      const response = await fetch(`${BHX_API_URL}?${queryParams.toString()}`);
      const data = await response.json();

      console.log('BHX API response:', data);

      if (data.success && data.carPark1) {
        console.log('Found Car Park 1:', data.carPark1.name, '£' + data.carPark1.price);
        setBhxCarPark1({
          name: data.carPark1.name,
          price: data.carPark1.price,
          timeToTerminal: 10, // BHX Car Park 1 is approximately 10 minutes
          isLive: true, // Mark as live data
        });
      } else {
        console.log('Car Park 1 not found in API response, using fallback');
        // Use fallback data if API doesn't return Car Park 1
        setBhxCarPark1({
          ...OLD_PRODUCT_DATA,
          isLive: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch BHX prices:', error);
      // Use fallback data on error
      setBhxCarPark1({
        ...OLD_PRODUCT_DATA,
        isLive: false,
      });
    } finally {
      setBhxLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      setLoading(true);
      setError('');

      // Extract search parameters
      const params: ParkingSearchParams = {
        arrivalDate: searchParams.get('arrivalDate') || '',
        arrivalTime: searchParams.get('arrivalTime') || '',
        departureDate: searchParams.get('departureDate') || '',
        departureTime: searchParams.get('departureTime') || '',
        location: searchParams.get('location') || 'BHX',
      };

      // Validate parameters
      if (!params.arrivalDate || !params.departureDate) {
        setError('Missing search parameters. Please return to search.');
        setLoading(false);
        return;
      }

      // Fetch from API - using live data
      const useMockData = false; // Set to true for development/testing

      if (useMockData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockProduct = getMockMeetAndGreetProduct();
        setProduct(mockProduct);
      } else {
        const response = await fetchCarParkAvailability(params);

        // Look for specific product: BHI5 (Airparks Premium Meet and Greet)
        const targetProduct = response.products.find(
          p => p.code === 'BHI5'
        );

        if (targetProduct) {
          setProduct(targetProduct);
        } else {
          // Fallback: try to find any meet-and-greet product
          const meetAndGreetProducts = response.products.filter(
            p => p.productType === 'meet-and-greet'
          );

          if (meetAndGreetProducts.length === 0) {
            setError('No Meet & Greet parking available for these dates. Please try different dates.');
            setLoading(false);
            return;
          }

          setProduct(meetAndGreetProducts[0]);
        }
      }

      // Fetch BHX prices for comparison (non-blocking)
      loadBHXPrices(params);

      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err instanceof HolidayExtrasAPIError) {
        setError(err.message);
      } else {
        setError('Failed to load parking options. Please try again.');
      }
    }
  };

  const handleBookNow = () => {
    if (!product) return;

    const params: ParkingSearchParams = {
      arrivalDate: searchParams.get('arrivalDate') || '',
      arrivalTime: searchParams.get('arrivalTime') || '',
      departureDate: searchParams.get('departureDate') || '',
      departureTime: searchParams.get('departureTime') || '',
      location: 'BHX',
    };

    const urlParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (!['arrivalDate', 'arrivalTime', 'departureDate', 'departureTime', 'location'].includes(key)) {
        urlParams[key] = value;
      }
    });

    const bookingURL = generateBookingURL(product.code, params, urlParams);
    window.location.href = bookingURL;
  };

  // Use live BHX data if available, otherwise use fallback
  const comparisonData = bhxCarPark1 || { ...OLD_PRODUCT_DATA, isLive: false };

  const savings = {
    price: comparisonData.price - (product?.price || 0),
    time: comparisonData.timeToTerminal - (product?.timeToTerminal || 0),
    percentage: Math.round(((comparisonData.price - (product?.price || 0)) / comparisonData.price) * 100),
    isLive: comparisonData.isLive, // Flag to show if using live data
  };

  if (loading) {
    return (
      <div className="availability-page loading-state" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: colors.gray[50],
      }}>
        <div style={{
          textAlign: 'center',
          padding: spacing[8],
        }}>
          <div className="spinner" style={{
            width: '64px',
            height: '64px',
            border: `4px solid ${colors.gray[200]}`,
            borderTop: `4px solid ${colors.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
            marginBottom: spacing[4],
          }}></div>
          <p style={{
            fontSize: typography.fontSize.lg,
            color: colors.gray[500],
            fontWeight: typography.fontWeight.semibold,
          }}>
            Finding your perfect parking...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="availability-page error-state" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: colors.gray[50],
        padding: spacing[6],
      }}>
        <div style={{
          maxWidth: '600px',
          background: colors.white,
          padding: spacing[8],
          borderRadius: borderRadius.lg,
          boxShadow: shadows.lg,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: spacing[4],
          }}>⚠️</div>
          <h2 style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.error,
            marginBottom: spacing[4],
          }}>
            {error}
          </h2>
          <button
            onClick={() => window.history.back()}
            style={{
              background: colors.primary,
              color: colors.white,
              border: 'none',
              padding: `${spacing[3]} ${spacing[6]}`,
              borderRadius: borderRadius.base,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
            }}
          >
            ← Back to Search
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="availability-page">
      {/* Header */}
      <header className="header" style={{
        background: colors.primary,
        color: colors.white,
        padding: `${spacing[4]} ${spacing[6]}`
      }}>
        <div className="header-content" style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[4]
        }}>
          <img
            src="https://brand.holidayextras.com/assets/downloads/02-logos/web-svg/holiday-extras-horizontal-web.svg"
            alt="Holiday Extras"
            style={{
              height: '60px',
              width: 'auto'
            }}
          />
          <p style={{
            fontSize: typography.fontSize.base,
            margin: 0,
            fontWeight: typography.fontWeight.normal,
            whiteSpace: 'nowrap'
          }}>
            Less hassle. More holiday.
          </p>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, #6b3eb8 100%)`,
        color: colors.white,
        padding: `${spacing[8]} ${spacing[6]}`,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.extrabold,
            marginBottom: spacing[4],
          }}>
            Why Meet & Greet Is Better Than Car Park 1
          </h2>

          {/* Key Value Props */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spacing[6],
            flexWrap: 'wrap',
            marginTop: spacing[6],
          }}>
            <div className="value-prop">
              <div style={{
                fontSize: typography.fontSize['3xl'],
                fontWeight: typography.fontWeight.extrabold,
                color: colors.secondary,
              }}>
                £{savings.price.toFixed(2)}
              </div>
              <div>Cheaper per week</div>
            </div>
            <div className="value-prop">
              <div style={{
                fontSize: typography.fontSize['3xl'],
                fontWeight: typography.fontWeight.extrabold,
                color: colors.secondary,
              }}>
                {savings.time} min
              </div>
              <div>Faster to terminal</div>
            </div>
            <div className="value-prop">
              <div style={{
                fontSize: typography.fontSize['3xl'],
                fontWeight: typography.fontWeight.extrabold,
                color: colors.secondary,
              }}>
                £0
              </div>
              <div>Overstay charges</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: `${spacing[8]} ${spacing[6]}`,
      }}>
        {/* Comparison Cards */}
        <div className="comparison-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: spacing[6],
          marginBottom: spacing[8],
        }}>
          {/* Meet & Greet Card - RECOMMENDED */}
          <div className="product-card recommended" style={{
            background: colors.white,
            borderRadius: borderRadius.lg,
            boxShadow: shadows.xl,
            overflow: 'hidden',
            border: `3px solid ${colors.success}`,
            position: 'relative',
          }}>
            {/* Recommended Badge */}
            <div style={{
              background: colors.success,
              color: colors.white,
              padding: `${spacing[2]} ${spacing[4]}`,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              ✓ Recommended
            </div>

            {/* Product Image */}
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '240px',
                  objectFit: 'cover',
                  display: 'block',
                  backgroundColor: colors.gray[100],
                }}
                onError={(e) => {
                  console.error('Image failed to load:', product.imageUrl);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', product.imageUrl);
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '240px',
                background: colors.gray[200],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  textAlign: 'center',
                  color: colors.gray[500],
                }}>
                  <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[2] }}>🚗</div>
                  <div style={{ fontSize: typography.fontSize.sm }}>No image available</div>
                </div>
              </div>
            )}

            <div style={{ padding: spacing[6] }}>
              <h3 style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.primary,
                marginBottom: spacing[2],
              }}>
                {product.name}
              </h3>


              {/* Price */}
              <div style={{
                marginBottom: spacing[6],
              }}>
                <div style={{
                  fontSize: typography.fontSize['3xl'],
                  fontWeight: typography.fontWeight.extrabold,
                  color: colors.primary,
                }}>
                  £{product.price.toFixed(2)}
                </div>
                <div style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.gray[500],
                }}>
                  per week
                </div>
                <div style={{
                  fontSize: typography.fontSize.base,
                  color: colors.success,
                  fontWeight: typography.fontWeight.semibold,
                  marginTop: spacing[2],
                }}>
                  Save {savings.percentage}% vs Car Park 1
                </div>
              </div>

              {/* Features */}
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                marginBottom: spacing[6],
              }}>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                  <span>Trust Pilot Excellent rating</span>
                </li>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                  <span><strong>No overstay charges</strong></span>
                </li>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                  <span>Online check-in - faster to terminal</span>
                </li>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                  <span>Full car and bus tracking</span>
                </li>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                  <span>Car cleaning and EV facilities</span>
                </li>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                  <span>Premium parking bays</span>
                </li>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                  <span>Toilet facilities on site</span>
                </li>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                  <span><strong>3 minutes from entering site to terminal</strong></span>
                </li>
              </ul>

              {/* Book Now Button */}
              <button
                onClick={handleBookNow}
                style={{
                  width: '100%',
                  background: colors.success,
                  color: colors.white,
                  border: 'none',
                  padding: spacing[4],
                  borderRadius: borderRadius.base,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#45a049'}
                onMouseOut={(e) => e.currentTarget.style.background = colors.success}
              >
                Book Now →
              </button>
            </div>
          </div>

          {/* Old Product Card - NO LONGER AVAILABLE */}
          <div className="product-card old-product" style={{
            background: colors.gray[50],
            borderRadius: borderRadius.lg,
            boxShadow: shadows.base,
            overflow: 'hidden',
            border: `2px solid ${colors.gray[300]}`,
            opacity: 0.8,
          }}>
            {/* Not Available Badge */}
            <div style={{
              background: colors.gray[400],
              color: colors.white,
              padding: `${spacing[2]} ${spacing[4]}`,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              No Longer Available
            </div>

            <div style={{ padding: spacing[6] }}>
              <h3 style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.gray[600],
                marginBottom: spacing[2],
              }}>
                {comparisonData.name}
              </h3>

              {bhxLoading && (
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.gray[500],
                  marginBottom: spacing[4],
                }}>
                  Loading live prices...
                </div>
              )}

              {savings.isLive && !bhxLoading && (
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.success,
                  fontWeight: typography.fontWeight.semibold,
                  marginBottom: spacing[4],
                }}>
                  ✓ Live pricing from Birmingham Airport
                </div>
              )}

              {!bhxLoading && !savings.isLive && (
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.gray[500],
                  marginBottom: spacing[4],
                }}>
                  Using estimated pricing
                </div>
              )}

              {/* Price */}
              <div style={{
                marginBottom: spacing[6],
              }}>
                <div style={{
                  fontSize: typography.fontSize['3xl'],
                  fontWeight: typography.fontWeight.extrabold,
                  color: colors.gray[600],
                  textDecoration: 'line-through',
                }}>
                  £{comparisonData.price.toFixed(2)}
                </div>
                <div style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.gray[500],
                }}>
                  per week
                </div>
              </div>

              {/* Missing Features */}
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                marginBottom: spacing[6],
              }}>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                  <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                  <span>No Trust Pilot rating</span>
                </li>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                  <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                  <span><strong>£64/day overstay charges</strong></span>
                </li>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                  <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                  <span>No online check-in</span>
                </li>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                  <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                  <span>No car tracking</span>
                </li>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                  <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                  <span>No car cleaning or EV facilities</span>
                </li>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                  <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                  <span>No premium bays</span>
                </li>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                  <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                  <span>No toilet on site</span>
                </li>
                <li style={{ padding: `${spacing[2]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                  <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                  <span><strong>10 minutes from entering site to terminal</strong></span>
                </li>
              </ul>

              {/* Unavailable Button */}
              <button
                disabled
                style={{
                  width: '100%',
                  background: colors.gray[300],
                  color: colors.gray[600],
                  border: 'none',
                  padding: spacing[4],
                  borderRadius: borderRadius.base,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  cursor: 'not-allowed',
                }}
              >
                Not Available
              </button>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{
          textAlign: 'center',
          background: colors.primary,
          color: colors.white,
          padding: spacing[8],
          borderRadius: borderRadius.lg,
        }}>
          <h3 style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing[4],
          }}>
            Ready to Save £{savings.price.toFixed(2)} This Week?
          </h3>
          <p style={{
            fontSize: typography.fontSize.lg,
            marginBottom: spacing[6],
            opacity: 0.9,
          }}>
            Book your Meet & Greet parking now and enjoy a better, faster, cheaper experience.
          </p>
          <button
            onClick={handleBookNow}
            style={{
              background: colors.secondary,
              color: colors.black,
              border: 'none',
              padding: `${spacing[4]} ${spacing[8]}`,
              borderRadius: borderRadius.base,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.extrabold,
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Book Now - Save {savings.percentage}% →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: colors.gray[600],
        color: colors.white,
        padding: `${spacing[6]} ${spacing[4]}`,
        textAlign: 'center',
        fontSize: typography.fontSize.sm,
        marginTop: spacing[8],
      }}>
        <p>&copy; {new Date().getFullYear()} Holiday Extras. All rights reserved.</p>
      </footer>
    </div>
  );
}
