// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  barcode: string;
  brand: string;
  category: string;
  price: number;
  imageUrl: string;
  description?: string;
  stock: number;
  nutritionalInfo?: NutritionalInfo;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  servingSize: string;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

// Order Types
export interface BillingInfo {
  firstName: string;
  lastName: string;
  address: string;
  zipCode: string;
  city: string;
  email?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  billingInfo: BillingInfo;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Payment Types
export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  billingInfo: BillingInfo;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  message?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  ProductDetails: { productId: string };
  Scanner: undefined;
  Cart: undefined;
  Checkout: undefined;
  Payment: { orderId: string };
  OrderConfirmation: { orderId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Scan: undefined;
  Cart: undefined;
  History: undefined;
  Profile: undefined;
};
