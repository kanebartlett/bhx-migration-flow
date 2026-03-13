import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/brand';

// Removed animated benefits - now using static comparison table
// const BENEFITS = [ ... ];

const MAX_WAIT_TIME_MS = 10000; // 10 seconds

export function LoadingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    let hasNavigated = false;

    // Convert date format from YYYY-MM-DD to dd/mm/yyyy for BHX API
    const convertDateFormat = (dateStr: string): string => {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    // Fetch BHX Car Park 1 price in background
    const fetchBHXPrice = async () => {
      try {
        const entryDate = searchParams.get('arrivalDate');
        const entryTime = searchParams.get('arrivalTime');
        const exitDate = searchParams.get('departureDate');
        const exitTime = searchParams.get('departureTime');

        if (entryDate && exitDate) {
          const API_URL = import.meta.env.VITE_BHX_API_URL || 'http://localhost:3001';
          const response = await fetch(
            `${API_URL}/api/bhx-prices?entryDate=${convertDateFormat(entryDate)}&entryTime=${entryTime || '12:00'}&exitDate=${convertDateFormat(exitDate)}&exitTime=${exitTime || '12:00'}`
          );

          if (response.ok) {
            await response.json();

            // Navigate immediately if we haven't already
            if (!hasNavigated) {
              hasNavigated = true;
              const params = new URLSearchParams(searchParams);
              navigate(`/products?${params.toString()}`);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching BHX price:', error);
        // Don't block navigation on error
      }
    };

    // Start BHX price fetch
    fetchBHXPrice();

    // Maximum 8 second timeout
    const maxTimeout = setTimeout(() => {
      if (!hasNavigated) {
        hasNavigated = true;
        const params = new URLSearchParams(searchParams);
        navigate(`/products?${params.toString()}`);
      }
    }, MAX_WAIT_TIME_MS);

    // Update progress bar
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min(100, (elapsed / MAX_WAIT_TIME_MS) * 100);
      setProgress(progressPercent);
    }, 100);

    return () => {
      clearTimeout(maxTimeout);
      clearInterval(progressInterval);
    };
  }, [searchParams, navigate]);

  return (
    <div className="loading-page" style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.primary} 0%, #6b3eb8 100%)`,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'auto',
    }}>
      {/* Header */}
      <header style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        background: colors.primary,
        color: colors.white,
        padding: `${spacing[3]} ${spacing[4]}`,
        zIndex: 10,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          <img
            src="https://brand.holidayextras.com/assets/downloads/02-logos/web-svg/holiday-extras-horizontal-web.svg"
            alt="Holiday Extras"
            style={{ height: '48px', width: 'auto' }}
          />
          <p style={{
            fontSize: typography.fontSize.sm,
            margin: 0,
            fontWeight: typography.fontWeight.normal,
            whiteSpace: 'nowrap'
          }}>
            Less hassle. More holiday.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        maxWidth: '900px',
        width: '100%',
        margin: '0 auto',
        padding: `${spacing[16]} ${spacing[4]} ${spacing[4]}`,
      }}>
        {/* Loading Message */}
        <h1 style={{
          fontSize: typography.fontSize['4xl'],
          fontWeight: typography.fontWeight.extrabold,
          color: colors.white,
          marginBottom: spacing[2],
          textAlign: 'center',
        }}>
          Finding Your Perfect Parking
        </h1>

        <p style={{
          fontSize: typography.fontSize.xl,
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: spacing[3],
          textAlign: 'center',
        }}>
          Comparing live prices and options...
        </p>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: spacing[4],
        }}>
          <div className="progress-bar" style={{
            width: `${progress}%`,
            height: '100%',
            background: colors.secondary,
            transition: 'width 0.1s linear',
          }} />
        </div>

        {/* Comparison Table */}
        <div style={{
          background: colors.white,
          borderRadius: borderRadius.xl,
          boxShadow: shadows['2xl'],
          overflow: 'hidden',
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            background: colors.primary,
            color: colors.white,
            padding: `${spacing[2]} ${spacing[3]}`,
            fontWeight: typography.fontWeight.bold,
            fontSize: typography.fontSize.base,
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>Feature</div>
            <div style={{ textAlign: 'center' }}>
              <div>Meet & Greet</div>
              <div style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                color: colors.secondary,
                marginTop: '2px',
              }}>
                ✓ RECOMMENDED
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div>Car Park 1</div>
              <div style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.normal,
                color: colors.gray[300],
                marginTop: '2px',
              }}>
                NOT AVAILABLE
              </div>
            </div>
          </div>

          {/* Table Rows */}
          {[
            { feature: 'Walk to terminal', meetGreet: true, carPark1: true, meetGreetValue: null, carPark1Value: null },
            { feature: 'Walking time to terminal', meetGreet: null, carPark1: null, meetGreetValue: '7 minutes', carPark1Value: '11 minutes' },
            { feature: 'Car cleaning', meetGreet: true, carPark1: false, meetGreetValue: null, carPark1Value: null },
            { feature: 'No overstay charges', meetGreet: true, carPark1: false, meetGreetValue: null, carPark1Value: null },
            { feature: 'Online check in', meetGreet: true, carPark1: false, meetGreetValue: null, carPark1Value: null },
            { feature: 'EV charging', meetGreet: true, carPark1: false, meetGreetValue: null, carPark1Value: null },
            { feature: 'No looking for space?', meetGreet: true, carPark1: false, meetGreetValue: null, carPark1Value: null },
          ].map((row, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr',
                padding: `${spacing[2]} ${spacing[3]}`,
                borderBottom: idx < 6 ? `1px solid ${colors.gray[200]}` : 'none',
                background: idx % 2 === 0 ? colors.white : colors.gray[50],
                minHeight: '48px',
              }}
            >
              <div style={{
                fontWeight: typography.fontWeight.medium,
                color: colors.gray[900],
                display: 'flex',
                alignItems: 'center',
                fontSize: typography.fontSize.lg,
              }}>
                {row.feature}
              </div>
              <div style={{
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {row.meetGreetValue ? (
                  <span style={{
                    fontSize: typography.fontSize.lg,
                    color: colors.gray[900],
                    fontWeight: typography.fontWeight.semibold,
                  }}>
                    {row.meetGreetValue}
                  </span>
                ) : row.meetGreet === true ? (
                  <span style={{
                    fontSize: typography.fontSize['2xl'],
                    color: colors.success,
                    fontWeight: typography.fontWeight.bold,
                  }}>
                    ✓
                  </span>
                ) : null}
              </div>
              <div style={{
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {row.carPark1Value ? (
                  <span style={{
                    fontSize: typography.fontSize.lg,
                    color: colors.gray[900],
                    fontWeight: typography.fontWeight.semibold,
                  }}>
                    {row.carPark1Value}
                  </span>
                ) : row.carPark1 === true ? (
                  <span style={{
                    fontSize: typography.fontSize['2xl'],
                    color: colors.success,
                    fontWeight: typography.fontWeight.bold,
                  }}>
                    ✓
                  </span>
                ) : row.carPark1 === false ? (
                  <span style={{
                    fontSize: typography.fontSize['2xl'],
                    color: colors.error,
                    fontWeight: typography.fontWeight.bold,
                  }}>
                    ✗
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
