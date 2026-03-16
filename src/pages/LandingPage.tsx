import { useState, useEffect, forwardRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/brand';
import type { URLParams } from '../types';
import '../styles/LandingPage.css';

// Custom input component for DatePicker to prevent keyboard on mobile
const DateInput = forwardRef<HTMLInputElement, any>(({ value, onClick, placeholder }, ref) => (
  <input
    ref={ref}
    type="text"
    value={value}
    onClick={onClick}
    placeholder={placeholder}
    className="date-input-custom"
    readOnly
    inputMode="none"
  />
));

export function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form state
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [departureTime, setDepartureTime] = useState('12:00');
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [returnTime, setReturnTime] = useState('12:00');
  const [error, setError] = useState('');

  // Preserve URL parameters for campaign tracking
  const [urlParams, setUrlParams] = useState<URLParams>({});

  useEffect(() => {
    // Extract and preserve all URL parameters
    const params: URLParams = {};
    searchParams.forEach((value, key) => {
      params[key as keyof URLParams] = value;
    });
    setUrlParams(params);

    // Set default dates (tomorrow and 8 days after tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const returnDay = new Date(tomorrow);
    returnDay.setDate(returnDay.getDate() + 8);
    returnDay.setHours(0, 0, 0, 0);

    setDepartureDate(tomorrow);
    setReturnDate(returnDay);
  }, [searchParams]);

  // Handle departure date change - auto-update return date to +8 days
  const handleDepartureDateChange = (newDate: Date | null) => {
    setDepartureDate(newDate);

    if (newDate) {
      const returnDay = new Date(newDate);
      returnDay.setDate(returnDay.getDate() + 8);
      returnDay.setHours(0, 0, 0, 0);
      setReturnDate(returnDay);
    }
  };

  // Generate time options (24-hour format, hourly)
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  // Validate form
  const validateForm = (): boolean => {
    if (!departureDate || !returnDate) {
      setError('Please select both departure and return dates');
      return false;
    }

    const depDateTime = new Date(departureDate);
    const [depHours, depMinutes] = departureTime.split(':').map(Number);
    depDateTime.setHours(depHours, depMinutes, 0, 0);

    const retDateTime = new Date(returnDate);
    const [retHours, retMinutes] = returnTime.split(':').map(Number);
    retDateTime.setHours(retHours, retMinutes, 0, 0);

    if (retDateTime <= depDateTime) {
      setError('Return date and time must be after departure');
      return false;
    }

    setError('');
    return true;
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Navigate to availability page with search parameters
    const params = new URLSearchParams({
      arrivalDate: departureDate ? format(departureDate, 'yyyy-MM-dd') : '',
      arrivalTime: departureTime,
      departureDate: returnDate ? format(returnDate, 'yyyy-MM-dd') : '',
      departureTime: returnTime,
      location: 'BHX',
      ...Object.entries(urlParams).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value || '',
      }), {}),
    });

    navigate(`/loading?${params.toString()}`);
  };

  return (
    <div className="landing-page">
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
      <section className="hero" style={{
        background: colors.primary,
        color: colors.white,
        padding: `0 ${spacing[6]} ${spacing[8]}`,
        textAlign: 'center',
      }}>
        <div className="hero-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.extrabold,
            margin: 0,
            lineHeight: typography.lineHeight.tight,
          }}>
            Your Birmingham Parking Just Got Better
            <br />
            <span style={{ color: colors.secondary }}>(And Cheaper)</span>
          </h2>
        </div>
      </section>

      {/* Search Form */}
      <section className="search-section" style={{
        background: colors.gray[50],
        padding: `${spacing[8]} ${spacing[6]}`,
        marginTop: `-${spacing[6]}`,
      }}>
        <div className="form-container" style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: colors.white,
          padding: spacing[8],
          borderRadius: borderRadius.lg,
          boxShadow: shadows.lg,
        }}>
          <h3 style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing[4],
            textAlign: 'center',
            color: colors.primary,
          }}>
            Find Your Parking
          </h3>

          <form onSubmit={handleSearch} className="parking-form">
            <div className="form-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: spacing[3],
              marginBottom: spacing[6],
            }}>
              {/* Departure Date */}
              <div className="form-field">
                <label htmlFor="departure-date" style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.gray[500],
                  marginBottom: spacing[2],
                  textTransform: 'uppercase',
                }}>
                  Departure Date
                </label>
                <DatePicker
                  id="departure-date"
                  selected={departureDate}
                  onChange={handleDepartureDateChange}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date()}
                  required
                  calendarClassName="custom-calendar"
                  placeholderText="Select departure date"
                  showPopperArrow={false}
                  popperPlacement="bottom-start"
                  showMonthYearPicker={false}
                  showYearDropdown={false}
                  showMonthDropdown={false}
                  customInput={<DateInput />}
                  renderCustomHeader={({
                    date,
                    changeYear,
                    changeMonth,
                    decreaseMonth: _decreaseMonth,
                    increaseMonth: _increaseMonth,
                    prevMonthButtonDisabled: _prevMonthButtonDisabled,
                    nextMonthButtonDisabled: _nextMonthButtonDisabled,
                  }) => {
                    const currentDate = new Date();
                    const currentYear = currentDate.getFullYear();
                    const currentMonth = currentDate.getMonth();
                    const selectedYear = date.getFullYear();

                    const isMonthDisabled = (monthIdx: number) => {
                      if (selectedYear > currentYear) return false;
                      if (selectedYear < currentYear) return true;
                      return monthIdx < currentMonth;
                    };

                    return (
                      <div className="custom-calendar-header">
                        <div className="year-selector">
                          {[2026, 2027, 2028].map(year => (
                            <button
                              key={year}
                              type="button"
                              onClick={() => changeYear(year)}
                              className={date.getFullYear() === year ? 'active' : ''}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                        <div className="month-selector">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'].map((month, idx) => {
                            const disabled = isMonthDisabled(idx);
                            return (
                              <button
                                key={month}
                                type="button"
                                onClick={() => !disabled && changeMonth(idx)}
                                className={`${date.getMonth() === idx ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                                disabled={disabled}
                              >
                                {month}
                              </button>
                            );
                          })}
                        </div>
                        <div className="current-month-display">
                          {format(date, 'MMMM yyyy')}
                        </div>
                      </div>
                    );
                  }}
                />
              </div>

              {/* Departure Time */}
              <div className="form-field">
                <label htmlFor="departure-time" style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.gray[500],
                  marginBottom: spacing[2],
                  textTransform: 'uppercase',
                }}>
                  Departure Time
                </label>
                <select
                  id="departure-time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                  className="time-select"
                  style={{
                    width: '100%',
                    padding: `${spacing[3]} ${spacing[4]}`,
                    border: `3px solid ${colors.gray[200]}`,
                    borderRadius: borderRadius.md,
                    fontSize: typography.fontSize.md,
                    fontFamily: typography.fontFamily.base,
                    minHeight: '56px',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23542E91\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    backgroundSize: '22px',
                    paddingRight: '48px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: colors.primary,
                    background: colors.white,
                  }}
                >
                  {timeOptions.map(time => (
                    <option key={`dep-${time}`} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              {/* Return Date */}
              <div className="form-field">
                <label htmlFor="return-date" style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.gray[500],
                  marginBottom: spacing[2],
                  textTransform: 'uppercase',
                }}>
                  Return Date
                </label>
                <DatePicker
                  id="return-date"
                  selected={returnDate}
                  onChange={(date: Date | null) => setReturnDate(date)}
                  dateFormat="dd/MM/yyyy"
                  minDate={departureDate || new Date()}
                  required
                  calendarClassName="custom-calendar"
                  placeholderText="Select return date"
                  showPopperArrow={false}
                  popperPlacement="bottom-start"
                  showMonthYearPicker={false}
                  showYearDropdown={false}
                  showMonthDropdown={false}
                  customInput={<DateInput />}
                  renderCustomHeader={({
                    date,
                    changeYear,
                    changeMonth,
                    decreaseMonth: _decreaseMonth,
                    increaseMonth: _increaseMonth,
                    prevMonthButtonDisabled: _prevMonthButtonDisabled,
                    nextMonthButtonDisabled: _nextMonthButtonDisabled,
                  }) => {
                    const currentDate = new Date();
                    const currentYear = currentDate.getFullYear();
                    const currentMonth = currentDate.getMonth();
                    const selectedYear = date.getFullYear();

                    const isMonthDisabled = (monthIdx: number) => {
                      if (selectedYear > currentYear) return false;
                      if (selectedYear < currentYear) return true;
                      return monthIdx < currentMonth;
                    };

                    return (
                      <div className="custom-calendar-header">
                        <div className="year-selector">
                          {[2026, 2027, 2028].map(year => (
                            <button
                              key={year}
                              type="button"
                              onClick={() => changeYear(year)}
                              className={date.getFullYear() === year ? 'active' : ''}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                        <div className="month-selector">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'].map((month, idx) => {
                            const disabled = isMonthDisabled(idx);
                            return (
                              <button
                                key={month}
                                type="button"
                                onClick={() => !disabled && changeMonth(idx)}
                                className={`${date.getMonth() === idx ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                                disabled={disabled}
                              >
                                {month}
                              </button>
                            );
                          })}
                        </div>
                        <div className="current-month-display">
                          {format(date, 'MMMM yyyy')}
                        </div>
                      </div>
                    );
                  }}
                />
              </div>

              {/* Return Time */}
              <div className="form-field">
                <label htmlFor="return-time" style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.gray[500],
                  marginBottom: spacing[2],
                  textTransform: 'uppercase',
                }}>
                  Return Time
                </label>
                <select
                  id="return-time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  required
                  className="time-select"
                  style={{
                    width: '100%',
                    padding: `${spacing[3]} ${spacing[4]}`,
                    border: `3px solid ${colors.gray[200]}`,
                    borderRadius: borderRadius.md,
                    fontSize: typography.fontSize.md,
                    fontFamily: typography.fontFamily.base,
                    minHeight: '56px',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23542E91\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    backgroundSize: '22px',
                    paddingRight: '48px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: colors.primary,
                    background: colors.white,
                  }}
                >
                  {timeOptions.map(time => (
                    <option key={`ret-${time}`} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: spacing[4],
                background: colors.error,
                color: colors.white,
                borderRadius: borderRadius.base,
                marginBottom: spacing[4],
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
              }} role="alert">
                {error}
              </div>
            )}

            {/* Search Button */}
            <button
              type="submit"
              style={{
                width: '100%',
                background: colors.primary,
                color: colors.white,
                border: 'none',
                padding: spacing[4],
                borderRadius: borderRadius.base,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                fontFamily: typography.fontFamily.base,
                cursor: 'pointer',
                minHeight: '56px',
                transition: 'background 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#6b3eb8'}
              onMouseOut={(e) => e.currentTarget.style.background = colors.primary}
            >
              Search Parking →
            </button>
          </form>
        </div>
      </section>

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
    </div>
  );
}
