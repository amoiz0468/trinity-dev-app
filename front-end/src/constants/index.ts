// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: 10000,
};

// PayPal Configuration
export const PAYPAL_CONFIG = {
  CLIENT_ID: process.env.PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID',
  CURRENCY: 'USD',
  ENVIRONMENT: 'sandbox', // Change to 'production' for live
};

// App Colors (Premium Dark Theme)
export const COLORS = {
  primary: '#6366f1',    // Indigo 500
  secondary: '#a855f7',  // Purple 500
  accent: '#f43f5e',     // Rose 500
  success: '#10b981',    // Emerald 500
  warning: '#f59e0b',    // Amber 500
  error: '#ef4444',      // Red 500
  background: '#0f172a', // Slate 900
  surface: '#1e293b',    // Slate 800
  text: '#f8fafc',       // Slate 50
  textSecondary: '#94a3b8', // Slate 400
  border: '#334155',     // Slate 700
  disabled: '#475569',   // Slate 600
  card: '#1e293b',       // Card background
  placeholder: '#64748b',// Slate 500
  glass: 'rgba(255, 255, 255, 0.05)',
};

// App Typography
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

// App Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// App Layout
export const LAYOUT = {
  borderRadius: 8,
  borderRadiusLarge: 16,
  shadowOpacity: 0.1,
  maxWidth: 600,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  CART: 'cart',
};

// App Constants
export const APP_CONSTANTS = {
  MAX_CART_ITEMS: 100,
  MIN_PASSWORD_LENGTH: 8,
  BARCODE_SCAN_DELAY: 500,
  CACHE_EXPIRY: 3600000, // 1 hour in milliseconds
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  SERVER_ERROR: 'Server error. Please try again later.',
  BARCODE_NOT_FOUND: 'Product not found. Please try another barcode.',
  CAMERA_PERMISSION_DENIED: 'Camera permission is required to scan products.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  PRODUCT_ADDED: 'Product added to cart.',
  ORDER_PLACED: 'Order placed successfully!',
  PAYMENT_SUCCESS: 'Payment completed successfully.',
};
