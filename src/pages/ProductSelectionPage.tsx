import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/brand';
import type { CarParkProduct, ParkingSearchParams } from '../types';
import { fetchCarParkAvailability, generateBookingURL, fetchProductDetails } from '../api/client';

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
  const [bhxCarPark1, setBhxCarPark1] = useState<{ name: string; price: number | null; timeToTerminal: number; isLive: boolean }>({
    name: 'BHX Car Park 1',
    price: null,
    timeToTerminal: 10,
    isLive: false,
  });
  const [bhxLoading, setBhxLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CarParkProduct | null>(null);
  const [productDetails, setProductDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'images' | 'videos'>('text');
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

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
        const agent = searchParams.get('agent');

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
          agent: agent || undefined,
        };

        // Fetch all products
        const response = await fetchCarParkAvailability(params);

        if (!response.success || !response.products) {
          setError('Failed to load products');
          setLoading(false);
          return;
        }

        // Filter for Airparks meet & greet products first
        const airparksMeetAndGreet = response.products.filter(
          p => p.productType === 'meet-and-greet' &&
               (p.name.toLowerCase().includes('airparks') || p.supplier?.toLowerCase().includes('airparks'))
        );

        // If no Airparks products, fall back to all meet & greet products
        const meetAndGreetProducts = response.products.filter(
          p => p.productType === 'meet-and-greet'
        );

        // Debug logging
        console.log('Total API products:', response.products.length);
        console.log('All meet & greet products:', meetAndGreetProducts.length);
        console.log('Airparks meet & greet found:', airparksMeetAndGreet.length);
        console.log('Product names:', meetAndGreetProducts.map(p => p.name));
        console.log('Product codes:', meetAndGreetProducts.map(p => ({ name: p.name, code: p.code })));

        // Prioritize Airparks products, fall back to any meet & greet if none available
        const productsToShow = airparksMeetAndGreet.length > 0
          ? airparksMeetAndGreet
          : meetAndGreetProducts;

        if (productsToShow.length === 0) {
          setError('No Meet & Greet parking available for these dates. Please try different dates.');
          setLoading(false);
          return;
        }

        console.log('Showing products:', productsToShow.length > 0 && airparksMeetAndGreet.length > 0 ? 'Airparks only' : 'All meet & greet');
        console.log('First product data:', productsToShow[0]);

        // Take up to 3 products
        setProducts(productsToShow.slice(0, 3));
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

  // Modal: Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  // Modal: Body scroll prevention
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  // Modal: Focus management
  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      // Reset to text tab when modal opens
      setActiveTab('text');
      // Move focus to modal
      modalRef.current.focus();
    } else if (!isModalOpen && lastFocusedElement.current) {
      // Return focus to the button that opened the modal
      lastFocusedElement.current.focus();
      lastFocusedElement.current = null;
    }
  }, [isModalOpen]);

  // Modal: Focus trap for Tab cycling
  useEffect(() => {
    if (!isModalOpen || !modalRef.current) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current!.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const focusableArray = Array.from(focusableElements);
      const firstElement = focusableArray[0];
      const lastElement = focusableArray[focusableArray.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: cycling backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: cycling forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isModalOpen]);

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

  const handleMoreInfo = async (product: CarParkProduct, event: React.MouseEvent<HTMLButtonElement>) => {
    lastFocusedElement.current = event.currentTarget;
    setSelectedProduct(product);
    setIsModalOpen(true);
    setLoadingDetails(true);
    setProductDetails(null);

    // Fetch detailed product information
    try {
      const details = await fetchProductDetails(product.code);
      setProductDetails(details);
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
          <p className="header-tagline" style={{
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
        padding: `${spacing[4]} ${spacing[6]}`,
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
      }}>
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
                  display: 'flex',
                  flexDirection: 'column',
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
                <div style={{
                  padding: spacing[5],
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                }}>
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
                    fontSize: typography.fontSize.base,
                  }}>
                    {/* Product-specific bullets based on product code */}
                    {product.code === 'BHI5' || product.code === 'HPBHI5' ? (
                      // Premium Meet and Greet
                      <>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>Quick walk to terminal</span>
                        </li>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>No overstay charges</span>
                        </li>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>No wait guarantee!</span>
                        </li>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>Fully insured by Airparks</span>
                        </li>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>Gold standard car cleaning</span>
                        </li>
                      </>
                    ) : product.code === 'BHI9' || product.code === 'HPBHI9' ? (
                      // Electric Meet and Greet
                      <>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>Quick walk to terminal</span>
                        </li>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>No overstay charges</span>
                        </li>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>Slick, speedy drop off</span>
                        </li>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>Fully insured by Airparks</span>
                        </li>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>Full EV charge included!</span>
                        </li>
                      </>
                    ) : product.code === 'BHI6' || product.code === 'HPBHI6' ? (
                      // Premium Electric Meet and Greet
                      <>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>Quick walk to terminal</span>
                        </li>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>No overstay charges</span>
                        </li>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>No wait guarantee!</span>
                        </li>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>Fully insured by Airparks</span>
                        </li>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>Full EV charge included!</span>
                        </li>
                        <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[700] }}>
                          <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                          <span>Gold standard car cleaning</span>
                        </li>
                      </>
                    ) : null}
                  </ul>

                  {/* More Info Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoreInfo(product, e);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: colors.primary,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      cursor: 'pointer',
                      padding: `${spacing[2]} 0`,
                      marginBottom: spacing[2],
                      textDecoration: 'underline',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#6b3eb8'}
                    onMouseLeave={(e) => e.currentTarget.style.color = colors.primary}
                  >
                    More Info
                  </button>

                  {/* Price and CTA */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: `1px solid ${colors.gray[200]}`,
                    paddingTop: spacing[3],
                    marginTop: 'auto',
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
                        background: colors.primary,
                        color: colors.white,
                        border: 'none',
                        padding: `${spacing[2]} ${spacing[4]}`,
                        borderRadius: borderRadius.base,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.bold,
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#6b3eb8'}
                      onMouseLeave={(e) => e.currentTarget.style.background = colors.primary}
                    >
                      Choose
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
              display: 'flex',
              flexDirection: 'column',
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
                border: `6px solid #ffd412`,
              }}>
                No Longer Available
              </div>

              {/* Product Details */}
              <div style={{
                padding: spacing[5],
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
              }}>
                  <h3 style={{
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.gray[600],
                    marginBottom: spacing[2],
                  }}>
                    {bhxCarPark1.name}
                  </h3>

                  {/* Missing Features */}
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    marginTop: spacing[10],
                    marginBottom: spacing[4],
                    fontSize: typography.fontSize.base,
                  }}>
                    <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                      <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                      <span>11 minute walk to terminal</span>
                    </li>
                    <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                      <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                      <span>£64/day overstay charges</span>
                    </li>
                    <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                      <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                      <span>Search for your own space</span>
                    </li>
                    <li style={{ padding: `${spacing[1]} 0`, display: 'flex', alignItems: 'center', gap: spacing[2], color: colors.gray[500] }}>
                      <span style={{ color: colors.error, fontWeight: typography.fontWeight.bold }}>✗</span>
                      <span>Relies on your own insurance</span>
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
                    marginTop: 'auto',
                  }}>
                    {bhxLoading || bhxCarPark1.price === null ? (
                      <div style={{
                        fontSize: typography.fontSize['2xl'],
                        fontWeight: typography.fontWeight.extrabold,
                        color: colors.gray[500],
                      }}>
                        Loading<span className="loading-dots"></span>
                      </div>
                    ) : (
                      <>
                        {bhxCarPark1.isLive ? (
                          <p style={{
                            fontSize: typography.fontSize.xs,
                            color: colors.success,
                            fontWeight: typography.fontWeight.semibold,
                            marginBottom: spacing[1],
                          }}>
                            ✓ Live pricing from Birmingham Airport
                          </p>
                        ) : (
                          <p style={{
                            fontSize: typography.fontSize.xs,
                            color: colors.gray[500],
                            marginBottom: spacing[1],
                          }}>
                            Using estimated pricing
                          </p>
                        )}
                        <div style={{
                          fontSize: typography.fontSize['2xl'],
                          fontWeight: typography.fontWeight.extrabold,
                          color: colors.error,
                        }}>
                          £{bhxCarPark1.price.toFixed(2)}
                        </div>
                      </>
                    )}
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

        .loading-dots::after {
          content: '.';
          animation: loading-dots 1.5s steps(3, end) infinite;
        }

        @keyframes loading-dots {
          0%, 25% {
            content: '.';
          }
          26%, 50% {
            content: '..';
          }
          51%, 75% {
            content: '...';
          }
          76%, 100% {
            content: '.';
          }
        }

        @media (max-width: 768px) {
          .header-tagline {
            display: none !important;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* Modal */}
      {isModalOpen && selectedProduct && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing[4],
          }}
        >
          {/* Backdrop */}
          <div
            onClick={handleCloseModal}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              animation: 'fadeIn 200ms ease-out',
            }}
          />

          {/* Modal Content */}
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            style={{
              position: 'relative',
              background: colors.white,
              borderRadius: borderRadius.xl,
              boxShadow: shadows['2xl'],
              maxWidth: '600px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'auto',
              zIndex: 1001,
              animation: 'scaleIn 200ms ease-out',
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                top: spacing[4],
                right: spacing[4],
                background: 'transparent',
                border: 'none',
                fontSize: typography.fontSize['2xl'],
                color: colors.gray[500],
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.gray[100]}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              ×
            </button>

            {/* Header */}
            <div style={{
              padding: spacing[6],
              borderBottom: `1px solid ${colors.gray[200]}`,
            }}>
              <h2
                id="modal-title"
                style={{
                  fontSize: typography.fontSize['2xl'],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.primary,
                  margin: 0,
                  paddingRight: spacing[8],
                }}
              >
                {selectedProduct.name}
              </h2>
            </div>

            {/* Tab Navigation */}
            <div style={{
              display: 'flex',
              borderBottom: `2px solid ${colors.gray[200]}`,
            }}>
              {(['text', 'images', 'videos'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: `${spacing[3]} ${spacing[4]}`,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab ? `3px solid ${colors.primary}` : '3px solid transparent',
                    color: activeTab === tab ? colors.primary : colors.gray[600],
                    fontSize: typography.fontSize.base,
                    fontWeight: activeTab === tab ? typography.fontWeight.bold : typography.fontWeight.normal,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.color = colors.gray[900];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.color = colors.gray[600];
                    }
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Body */}
            <div style={{
              padding: spacing[6],
            }}>
              {/* Text Tab */}
              {activeTab === 'text' && (
                <>
                  {/* Loading State */}
                  {loadingDetails && (
                    <div style={{
                      textAlign: 'center',
                      padding: spacing[8],
                      color: colors.gray[600],
                    }}>
                      <p>Loading product details...</p>
                    </div>
                  )}

                  {/* Description from API */}
                  {!loadingDetails && productDetails?.tripappintroduction && (
                    <div
                      style={{
                        marginBottom: spacing[4],
                        color: colors.gray[700],
                        fontSize: typography.fontSize.base,
                        lineHeight: '1.6',
                      }}
                      dangerouslySetInnerHTML={{ __html: productDetails.tripappintroduction }}
                    />
                  )}

                  {/* Fallback if no API data */}
                  {!loadingDetails && !productDetails?.tripappintroduction && (
                    <div style={{
                      marginBottom: spacing[4],
                    }}>
                      {productDetails?.tripappcarparksellpoint && (
                        <p style={{
                          color: colors.gray[700],
                          fontSize: typography.fontSize.base,
                          lineHeight: '1.6',
                          marginBottom: spacing[3],
                        }}>
                          {productDetails.tripappcarparksellpoint}
                        </p>
                      )}
                      {productDetails?.tripapptransfertip && (
                        <p style={{
                          color: colors.gray[700],
                          fontSize: typography.fontSize.sm,
                          lineHeight: '1.6',
                          fontStyle: 'italic',
                        }}>
                          {productDetails.tripapptransfertip}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  <div style={{
                    marginBottom: spacing[4],
                    padding: spacing[4],
                    background: colors.gray[50],
                    borderRadius: borderRadius.base,
                  }}>
                    <h3 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.gray[900],
                      marginBottom: spacing[2],
                    }}>
                      Pricing
                    </h3>
                    <p style={{
                      fontSize: typography.fontSize['3xl'],
                      fontWeight: typography.fontWeight.extrabold,
                      color: colors.primary,
                      margin: 0,
                    }}>
                      £{selectedProduct.price.toFixed(2)}
                    </p>
                    <p style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.gray[600],
                      margin: 0,
                      marginTop: spacing[1],
                    }}>
                      Total price for your stay
                    </p>
                  </div>

                  {/* Transfer Details */}
                  <div style={{
                    marginBottom: spacing[4],
                  }}>
                    <h3 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.gray[900],
                      marginBottom: spacing[2],
                    }}>
                      Location Details
                    </h3>
                    <p style={{
                      color: colors.gray[700],
                      fontSize: typography.fontSize.base,
                      marginBottom: spacing[1],
                    }}>
                      <strong>Service Type:</strong> Meet & Greet at terminal
                    </p>
                    <p style={{
                      color: colors.gray[700],
                      fontSize: typography.fontSize.base,
                      marginBottom: spacing[1],
                    }}>
                      <strong>Walking Time:</strong> 7 minutes to check-in
                    </p>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.gray[900],
                      marginBottom: spacing[2],
                    }}>
                      Features & Benefits
                    </h3>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                    }}>
                      {selectedProduct.code === 'BHI5' || selectedProduct.code === 'HPBHI5' ? (
                        // Premium Meet and Greet
                        <>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>Quick walk to terminal</span>
                          </li>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>No overstay charges</span>
                          </li>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>No wait guarantee!</span>
                          </li>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>Fully insured by Airparks</span>
                          </li>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>Gold standard car cleaning</span>
                          </li>
                        </>
                      ) : selectedProduct.code === 'BHI9' || selectedProduct.code === 'HPBHI9' ? (
                        // Electric Meet and Greet
                        <>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>Quick walk to terminal</span>
                          </li>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>No overstay charges</span>
                          </li>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>Slick, speedy drop off</span>
                          </li>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>Fully insured by Airparks</span>
                          </li>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>Full EV charge included!</span>
                          </li>
                        </>
                      ) : selectedProduct.code === 'BHI6' || selectedProduct.code === 'HPBHI6' ? (
                        // Premium Electric Meet and Greet
                        <>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>Quick walk to terminal</span>
                          </li>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>No overstay charges</span>
                          </li>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>No wait guarantee!</span>
                          </li>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>Fully insured by Airparks</span>
                          </li>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>Full EV charge included!</span>
                          </li>
                          <li style={{
                            padding: `${spacing[2]} 0`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: colors.gray[700],
                          }}>
                            <span style={{ color: colors.success, fontWeight: typography.fontWeight.bold }}>✓</span>
                            <span>Gold standard car cleaning</span>
                          </li>
                        </>
                      ) : null}
                    </ul>
                  </div>
                </>
              )}

              {/* Images Tab */}
              {activeTab === 'images' && (
                <>
                  {loadingDetails ? (
                    <div style={{
                      textAlign: 'center',
                      padding: spacing[8],
                      color: colors.gray[600],
                    }}>
                      <p>Loading images...</p>
                    </div>
                  ) : (
                    <>
                      {/* Use API images if available, fallback to basic images */}
                      {(() => {
                        const IMAGE_CDN_BASE = 'https://d1xcii4rs5n6co.cloudfront.net';
                        let imagesToDisplay: string[] = [];

                        if (productDetails?.tripappimages) {
                          // Parse semicolon-separated images from API
                          imagesToDisplay = productDetails.tripappimages
                            .split(';')
                            .filter((img: string) => img.trim())
                            .map((img: string) => {
                              const cleanPath = img.trim().startsWith('/') ? img.trim() : `/${img.trim()}`;
                              return cleanPath.replace('/imageLibrary/Images/', '/libraryimages/');
                            })
                            .map((path: string) => `${IMAGE_CDN_BASE}${path}`);
                        } else if (selectedProduct.images && selectedProduct.images.length > 0) {
                          imagesToDisplay = selectedProduct.images;
                        }

                        return imagesToDisplay.length > 0 ? (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: imagesToDisplay.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: spacing[3],
                          }}>
                            {imagesToDisplay.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`${selectedProduct.name} ${idx + 1}`}
                                style={{
                                  width: '100%',
                                  height: '200px',
                                  objectFit: 'cover',
                                  borderRadius: borderRadius.base,
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <div style={{
                            textAlign: 'center',
                            padding: spacing[8],
                            color: colors.gray[600],
                          }}>
                            <p style={{
                              fontSize: typography.fontSize.lg,
                              margin: 0,
                            }}>
                              No images available for this product.
                            </p>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </>
              )}

              {/* Videos Tab */}
              {activeTab === 'videos' && (
                <div style={{
                  textAlign: 'center',
                  padding: spacing[8],
                  color: colors.gray[600],
                }}>
                  <p style={{
                    fontSize: typography.fontSize.lg,
                    margin: 0,
                  }}>
                    No videos available for this product.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
