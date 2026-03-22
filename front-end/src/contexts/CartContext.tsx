import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Cart, CartItem, Product } from '../types';
import apiClient from '../services/apiClient';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalAmount: 0,
    totalItems: 0,
  });

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      // Clear cart when user logs out
      setCart({
        items: [],
        totalAmount: 0,
        totalItems: 0,
      });
    }
  }, [isAuthenticated]);

  const refreshCart = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await apiClient.get('/api/cart/') as any;
      const cartData = response.data;
      setCart({
        items: cartData.items || [],
        totalAmount: parseFloat(cartData.subtotal) || 0,
        totalItems: cartData.total_items || 0,
      });
    } catch (error) {
      console.error('Error loading cart:', error);
      // Fallback to empty cart
      setCart({
        items: [],
        totalAmount: 0,
        totalItems: 0,
      });
    }
  };

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to add items to cart');
    }
    
    try {
      await apiClient.post('/api/cart/add_item/', {
        product: product.id,
        quantity: quantity,
      });
      await refreshCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to modify cart');
    }
    
    try {
      await apiClient.post('/api/cart/remove_item/', {
        item_id: cart.items.find(item => item.product.id === productId)?.id,
      });
      await refreshCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to modify cart');
    }
    
    try {
      const cartItem = cart.items.find(item => item.product.id === productId);
      if (cartItem && cartItem.id) {
        if (quantity <= 0) {
          await removeFromCart(productId);
        } else {
          await apiClient.post('/api/cart/update_item/', {
            item_id: cartItem.id,
            quantity: quantity,
          });
          await refreshCart();
        }
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) {
      throw new Error('Please log in to modify cart');
    }
    
    try {
      await apiClient.post('/api/cart/clear/');
      await refreshCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const getItemQuantity = (productId: string): number => {
    const item = cart.items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const isInCart = (productId: string): boolean => {
    return cart.items.some(item => item.product.id === productId);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isInCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
