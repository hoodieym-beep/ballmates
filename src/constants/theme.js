// Ball Mates theme — based on logo: greens, orange accent, dark neutrals
export const colors = {
  // Primary — forest / grass green from logo
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryLime: '#AEEA00',
  // Accent — orange from logo
  accent: '#FF9800',
  accentLight: '#FFB300',
  // Neutrals
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E0E0E0',
  borderLight: '#EEEEEE',
  // Text
  text: '#212121',
  textSecondary: '#616161',
  textMuted: '#9E9E9E',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',
  // Semantic
  success: '#4CAF50',
  successLight: '#E8F5E9',
  danger: '#D32F2F',
  dangerLight: '#FFEBEE',
  warning: '#FF9800',
  // Chat
  bubbleMe: '#2E7D32',
  bubbleOther: '#E8F5E9',
  bubbleOtherBorder: '#C8E6C9',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: 0.5 },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' },
  button: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600' },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
};
