import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/brand';
import type { CarParkProduct, ParkingSearchParams } from '../types';
import { fetchCarParkAvailability, generateBookingURL } from '../api/client';

// No longer filtering by specific codes - showing all meet & greet products

// BHX API configuration
const BHX_API_URL = `${import.meta.env.VITE_BHX_API_URL || 'http://localhost:3001'}/api/bhx-prices`;

// Fallback data if BHX API fails
const OLD_PRODUCT_DATA = {
  name: 'BHX Car Park 1',
  price: 99.99,
  timeToTerminal: 10,
};

// Convert YYYY-MM-DD to dd/mm/yyyy for BHX API
function convertDateFormat(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function ProductSelectionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<CarParkProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bhxCarPark1, setBhxCarPark1] = useState<{ name: string; price: number; timeToTerminal: number; isLive: boolean }>({
    ...OLD_PRODUCT_DATA,
    isLive: false,
  });
  const [bhxLoading, setBhxLoading] = useState(false);

  const loadBHXPrices = async (params: ParkingSearchParams) => {
    try {
      setBhxLoading(true);

      const queryParams = new URLSearchParams({
        entryDate: convertDateFormat(params.arrivalDate),
        entryTime: params.arrivalTime,
        exitDate: convertDateFormat(params.departureDate),
        exitTime: params.departureTime,
      });

      const response = await fetch(`${BHX_API_URL}?${queryParams.toString()}`);
      const data = await response.json();

      if (data.success && data.carPark1) {
        setBhxCarPark1({
          name: data.carPark1.name,
          price: data.carPark1.price,
          timeToTerminal: 10,
          isLive: true,
        });
      } else {
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

  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Extract search parameters
        const arrivalDate = searchParams.get('arrivalDate');
        const arrivalTime = searchParams.get('arrivalTime');
        const departureDate = searchParams.get('departureDate');
        const departureTime = searchParams.get('departureTime');
        const location = searchParams.get('location');

        if (!arrivalDate || !arrivalTime || !departureDate || !departureTime || !location) {
          setError('Missing required search parameters');
          setLoading(false);
          return;
        }

        // Construct API params
        const params: ParkingSearchParams = {
          arrivalDate,
          arrivalTime,
          departureDate,
          departureTime,
          location,
        };

        // Fetch all products
        const response = await fetchCarParkAvailability(params);

        if (!response.success || !response.products) {
          setError('Failed to load products');
          setLoading(false);
          return;
        }

        // Filter for Airparks meet & greet products only
        const airparksMeetAndGreet = response.products.filter(
          p => p.productType === 'meet-and-greet' &&
               (p.name.toLowerCase().includes('airparks') || p.supplier?.toLowerCase().includes('airparks'))
        );

        // Debug logging
        console.log('Total API products:', response.products.length);
        console.log('All meet & greet products:', response.products.filter(p => p.productType === 'meet-and-greet').length);
        console.log('Airparks meet & greet found:', airparksMeetAndGreet.length);
        console.log('Airparks product names:', airparksMeetAndGreet.map(p => p.name));
        console.log('First product data:', airparksMeetAndGreet[0]);

        if (airparksMeetAndGreet.length === 0) {
          setError('No Airparks Meet & Greet parking available for these dates. Please try different dates.');
          setLoading(false);
          return;
        }

        // Take up to 3 Airparks meet & greet products
        setProducts(airparksMeetAndGreet.slice(0, 3));
        setLoading(false);

        // Fetch BHX prices for comparison (non-blocking)
        loadBHXPrices(params);
      } catch (err) {
        console.error('Error loading products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
        setLoading(false);
      }
    };

    loadProducts();
  }, [searchParams]);

  const handleSelectProduct = (product: CarParkProduct) => {
    // Extract search params for booking URL
    const params: ParkingSearchParams = {
      arrivalDate: searchParams.get('arrivalDate') || '',
      arrivalTime: searchParams.get('arrivalTime') || '',
      departureDate: searchParams.get('departureDate') || '',
      departureTime: searchParams.get('departureTime') || '',
      location: searchParams.get('location') || '',
    };

    // Preserve URL params
    const urlParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (!['arrivalDate', 'arrivalTime', 'departureDate', 'departureTime', 'location'].includes(key)) {
        urlParams[key] = value;
      }
    });

    // Generate booking URL and navigate
    const bookingURL = generateBookingURL(product.code, params, urlParams);
    window.location.href = bookingURL;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.gray[50],
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        background: colors.primary,
        color: colors.white,
        padding: `${spacing[4]} ${spacing[6]}`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[4],
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          <img
            src="https://brand.holidayextras.com/assets/downloads/02-logos/web-svg/holiday-extras-horizontal-web.svg"
            alt="Holiday Extras"
            style={{ height: '60px', width: 'auto' }}
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

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: `${spacing[8]} ${spacing[6]}`,
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: typography.fontSize['4xl'],
          fontWeight: typography.fontWeight.extrabold,
          color: colors.primary,
          marginBottom: spacing[4],
          textAlign: 'center',
        }}>
          Choose Your Premium Parking
        </h1>


        {/* Loading State */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: spacing[12],
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: `4px solid ${colors.gray[200]}`,
              borderTopColor: colors.primary,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto',
            }} />
            <p style={{
              marginTop: spacing[4],
              color: colors.gray[600],
              fontSize: typography.fontSize.lg,
            }}>
              Loading your parking options...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            background: colors.error,
            color: colors.white,
            padding: spacing[6],
            borderRadius: borderRadius.lg,
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              marginBottom: spacing[2],
            }}>
              Oops! Something went wrong
            </p>
            <p style={{ marginBottom: spacing[4] }}>{error}</p>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: colors.white,
                color: colors.error,
                border: 'none',
                padding: `${spacing[3]} ${spacing[6]}`,
                borderRadius: borderRadius.base,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.bold,
                cursor: 'pointer',
              }}
            >
              Go Back
            </button>
          </div>
        )}

        {/* Product Cards */}
        {!loading && !error && products.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: spacing[4],
          }}>
            {products.map((product) => (
              <div
                key={product.code}
                style={{
                  background: colors.white,
                  borderRadius: borderRadius.xl,
                  overflow: 'hidden',
                  boxShadow: shadows.lg,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = shadows['2xl'];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = shadows.lg;
                }}
              >
                {/* Product Image */}
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '220px',
                      objectFit: 'cover',
                    }}
                  />
                )}

                {/* Product Details */}
                <div style={{ padding: spacing[5] }}>
                  <h3 style={{
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.primary,
                    marginBottom: spacing[2],
                  }}>
                    {product.name}
                  </h3>

                  {/* Key Selling Points */}
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    marginBottom: spacing[4],
                    fontSize: typography.fontSize.sm,
                  }}>
                    {/* Always show these core meet & greet benefits */}
                    <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                      <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                      <span>{product.timeToTerminal ? `Just ${product.timeToTerminal} mins walk to terminal` : 'Quick walk to terminal'}</span>
                    </li>
                    <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                      <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                      <span>Car cleaned while you're away</span>
                    </li>
                    <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                      <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                      <span>No overstay charges</span>
                    </li>
                    <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                      <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                      <span>Online check-in available</span>
                    </li>
                    {product.evFacilities && (
                      <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                        <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                        <span>EV charging available</span>
                      </li>
                    )}
                    {product.trustPilotRating && (
                      <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                        <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                        <span>Trustpilot {product.trustPilotRating}/5 rating</span>
                      </li>
                    )}
                  </ul>

                  {/* Price and CTA */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: `1px solid ${colors.gray[200]}`,
                    paddingTop: spacing[3],
                  }}>
                    <div>
                      <p style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.gray[500],
                        textTransform: 'uppercase',
                        marginBottom: spacing[1],
                      }}>
                        Total Price
                      </p>
                      <p style={{
                        fontSize: typography.fontSize['2xl'],
                        fontWeight: typography.fontWeight.extrabold,
                        color: colors.primary,
                      }}>
                        £{product.price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectProduct(product)}
                      style={{
                        background: colors.secondary,
                        color: colors.white,
                        border: 'none',
                        padding: `${spacing[2]} ${spacing[4]}`,
                        borderRadius: borderRadius.base,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.bold,
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                      onMouseLeave={(e) => e.currentTarget.style.background = colors.secondary}
                    >
                      Select →
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Car Park 1 - NO LONGER AVAILABLE */}
            <div style={{
              background: colors.gray[50],
              borderRadius: borderRadius.xl,
              overflow: 'hidden',
              boxShadow: shadows.lg,
              border: `2px solid ${colors.gray[300]}`,
              opacity: 0.8,
            }}>
              {/* Not Available Badge */}
              <div style={{
                background: '#000000',
                color: '#ffffff',
                padding: `${spacing[3]} ${spacing[4]}`,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                height: '220px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `3px solid #ffd412`,
              }}>
                No Longer Available
              </div>

              {/* Product Details */}
              <div style={{ padding: spacing[5] }}>
                  <h3 style={{
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.gray[600],
                    marginBottom: spacing[2],
                  }}>
                    {bhxCarPark1.name}
                  </h3>

                  {bhxLoading && (
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.gray[500],
                      marginBottom: spacing[2],
                    }}>
                      Loading live prices...
                    </div>
                  )}

                  {/* Missing Features */}
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    marginBottom: spacing[4],
                    fontSize: typography.fontSize.sm,
                  }}>
                    <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                      <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                      <span>No car cleaning included</span>
                    </li>
                    <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                      <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                      <span><strong>£64/day overstay charges</strong></span>
                    </li>
                    <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                      <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                      <span>No online check-in</span>
                    </li>
                    <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                      <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                      <span>No EV charging available</span>
                    </li>
                  </ul>

                  {/* Price */}
                  <div style={{
                    borderTop: `1px solid ${colors.gray[200]}`,
                    paddingTop: spacing[3],
                  }}>
                    {bhxCarPark1.isLive && !bhxLoading ? (
                      <p style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.success,
                        fontWeight: typography.fontWeight.semibold,
                        marginBottom: spacing[1],
                      }}>
                        ✓ Live pricing from Birmingham Airport
                      </p>
                    ) : !bhxLoading && !bhxCarPark1.isLive ? (
                      <p style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.gray[500],
                        marginBottom: spacing[1],
                      }}>
                        Using estimated pricing
                      </p>
                    ) : null}
                    <div style={{
                      fontSize: typography.fontSize['2xl'],
                      fontWeight: typography.fontWeight.extrabold,
                      color: colors.error,
                    }}>
                      £{bhxCarPark1.price.toFixed(2)}
                    </div>
                  </div>
                </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: colors.gray[600],
        color: colors.white,
        padding: `${spacing[6]} ${spacing[4]}`,
        textAlign: 'center',
        fontSize: typography.fontSize.sm,
      }}>
        <p>&copy; {new Date().getFullYear()} Holiday Extras. All rights reserved.</p>
      </footer>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
