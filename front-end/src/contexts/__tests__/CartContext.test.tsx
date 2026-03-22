import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { CartProvider, useCart } from '../CartContext';
import { AuthProvider } from '../AuthContext';
import { Text, Button } from 'react-native';
import { Product } from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(),
}));

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock the useAuth hook directly
jest.mock('../AuthContext', () => ({
  ...jest.requireActual('../AuthContext'),
  useAuth: () => ({
    isAuthenticated: true,
    user: {
      id: 'test-user',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }),
}));

// Mock apiClient
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { items: [], subtotal: 0, total_items: 0 } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  barcode: '123456',
  brand: 'Test Brand',
  category: 'Test Category',
  price: 10.99,
  imageUrl: 'https://example.com/image.jpg',
  stock: 100,
};

describe('CartContext', () => {
  it('provides cart context to children', async () => {
    const TestComponent = () => {
      const { cart } = useCart();
      return (
        <>
          <Text>Items: {cart.totalItems}</Text>
          <Text>Total: {cart.totalAmount}</Text>
        </>
      );
    };

    const { getByText } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(getByText('Items: 0')).toBeTruthy();
      expect(getByText('Total: 0')).toBeTruthy();
    });
  });

  it('throws error when useCart is used outside CartProvider', () => {
    const TestComponent = () => {
      try {
        useCart();
        return <Text>Should not render</Text>;
      } catch (error: any) {
        return <Text>{error.message}</Text>;
      }
    };

    const { getByText } = render(<TestComponent />);
    expect(getByText('useCart must be used within a CartProvider')).toBeTruthy();
  });
});
