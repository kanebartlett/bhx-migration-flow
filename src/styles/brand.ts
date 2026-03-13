// Holiday Extras Brand Guidelines
// Source: https://brand.holidayextras.com/

export const colors = {
  primary: '#542E91',      // Purple - primary brand color
  secondary: '#FDD506',     // Yellow - secondary brand color
  accent: '#00B0A6',        // Teal - accent color

  // Semantic colors
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#E74C3C',
  info: '#5DADE2',

  // Neutrals
  white: '#FFFFFF',
  black: '#333333',
  gray: {
    50: '#F5F5F5',
    100: '#F0F0F0',
    200: '#E0E0E0',
    300: '#D5D8DC',
    400: '#999999',
    500: '#666666',
    600: '#333333',
  },
};

export const typography = {
  fontFamily: {
    base: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fallback: "system-ui, sans-serif",
  },
  fontSize: {
    xs: '11px',
    sm: '12px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '22px',
    '2xl': '26px',
    '3xl': '32px',
    '4xl': '40px',
  },
  fontWeight: {
    regular: 400,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.2,
    base: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  // 4px base unit system
  unit: 4,
  0: '0',
  1: '4px',   // 1 unit
  2: '8px',   // 2 units
  3: '12px',  // 3 units
  4: '16px',  // 4 units
  5: '20px',  // 5 units
  6: '24px',  // 6 units
  8: '32px',  // 8 units
  10: '40px', // 10 units
  12: '48px', // 12 units
  16: '64px', // 16 units
};

export const borderRadius = {
  none: '0',
  sm: '3px',
  base: '6px',
  md: '8px',
  lg: '12px',   // Cards
  xl: '16px',
  full: '9999px', // Pills/circles
};

export const breakpoints = {
  xs: '320px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  '2xl': '1400px',
};

export const shadows = {
  sm: '0 2px 4px rgba(0,0,0,0.08)',
  base: '0 2px 8px rgba(0,0,0,0.08)',
  md: '0 4px 12px rgba(0,0,0,0.1)',
  lg: '0 4px 16px rgba(0,0,0,0.12)',
  xl: '0 8px 24px rgba(0,0,0,0.15)',
};

export const transitions = {
  fast: '0.15s ease',
  base: '0.2s ease',
  slow: '0.3s ease',
};

// Touch target minimum (mobile)
export const touchTarget = {
  minimum: '44px',
  comfortable: '48px',
};

// Brand messaging
export const messaging = {
  strapline: 'Less hassle. More holiday.',
  brandName: 'Holiday Extras',
};

// Helper function to apply responsive styles
export function responsive(styles: {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
}): string {
  const mediaQueries = [];

  if (styles.xs) mediaQueries.push(styles.xs);
  if (styles.sm) mediaQueries.push(`@media (min-width: ${breakpoints.sm}) { ${styles.sm} }`);
  if (styles.md) mediaQueries.push(`@media (min-width: ${breakpoints.md}) { ${styles.md} }`);
  if (styles.lg) mediaQueries.push(`@media (min-width: ${breakpoints.lg}) { ${styles.lg} }`);
  if (styles.xl) mediaQueries.push(`@media (min-width: ${breakpoints.xl}) { ${styles.xl} }`);

  return mediaQueries.join(' ');
}
