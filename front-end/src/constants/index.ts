import Constants from 'expo-constants';
import { Platform } from 'react-native';

const resolveApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/+$/, '');
  }

  // Use the production backend IP for the deployed application.
  return 'http://13.62.5.147:8000/api';
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: resolveApiBaseUrl(),
  USE_MOCK_DATA: false,
  TIMEOUT: 15000,
};

// PayPal Configuration
export const PAYPAL_CONFIG = {
  CLIENT_ID:
    process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID ||
    process.env.PAYPAL_CLIENT_ID ||
    'YOUR_PAYPAL_CLIENT_ID',
  CURRENCY: 'USD',
  ENVIRONMENT: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
};

// App Colors (Sapphire Night Theme - Premium & Vibrant)
export const DARK_COLORS = {
  primary: '#6366F1',    // Indigo 500 (Vibrant)
  secondary: '#8B5CF6',  // Violet 500
  accent: '#F43F5E',     // Rose 500
  success: '#10B981',    // Emerald 500
  warning: '#F59E0B',    // Amber 500
  error: '#EF4444',      // Red 500
  background: '#0F172A', // Slate 900
  surface: '#1E293B',    // Slate 800
  surfaceLight: '#334155', // Slate 700
  text: '#F8FAFC',       // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  textMuted: '#64748B',  // Slate 500
  border: 'rgba(255, 255, 255, 0.1)',
  disabled: '#1E293B',
  placeholder: '#64748B',
  glass: 'rgba(255, 255, 255, 0.03)',
  cardGradient: ['#1E293B', '#0F172A'],
};

export const LIGHT_COLORS = {
  primary: '#4F46E5',    // Indigo 600
  secondary: '#7C3AED',  // Violet 600
  accent: '#E11D48',     // Rose 600
  success: '#059669',    // Emerald 600
  warning: '#D97706',    // Amber 600
  error: '#DC2626',      // Red 600
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',    // White
  surfaceLight: '#F1F5F9', // Slate 100
  text: '#0F172A',       // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8',  // Slate 400
  border: 'rgba(0, 0, 0, 0.1)',
  disabled: '#E2E8F0',
  placeholder: '#94A3B8',
  glass: 'rgba(0, 0, 0, 0.03)',
  cardGradient: ['#FFFFFF', '#F8FAFC'],
};

export const COLORS = DARK_COLORS; // Default for now to avoid breaking existing imports

export const THEMES = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
};

// App Typography (Premium Scale)
export const TYPOGRAPHY = {
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
    black: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed-light',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
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
