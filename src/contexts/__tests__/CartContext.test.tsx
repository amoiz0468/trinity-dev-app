import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { CartProvider, useCart } from '../CartContext';
import { Text, Button } from 'react-native';
import { Product } from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(),
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

  it('adds item to cart', async () => {
    const TestComponent = () => {
      const { cart, addToCart } = useCart();
      
      return (
        <>
          <Text>Items: {cart.totalItems}</Text>
          <Button
            title="Add Item"
            onPress={() => addToCart(mockProduct, 1)}
          />
        </>
      );
    };

    const { getByText } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const addButton = getByText('Add Item');
    
    await act(async () => {
      addButton.props.onPress();
    });

    await waitFor(() => {
      expect(getByText('Items: 1')).toBeTruthy();
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
