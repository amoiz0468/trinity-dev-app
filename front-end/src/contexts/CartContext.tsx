import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Cart, CartItem, Product } from '../types';
import StorageService from '../utils/storage';
import { STORAGE_KEYS, APP_CONSTANTS, SUCCESS_MESSAGES } from '../constants';

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
};

const calculateTotalItems = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.quantity, 0);
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalAmount: 0,
    totalItems: 0,
  });

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    saveCart();
  }, [cart]);

  const loadCart = async () => {
    try {
      const savedCart = await StorageService.get<Cart>(STORAGE_KEYS.CART);
      if (savedCart) {
        setCart(savedCart);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async () => {
    try {
      await StorageService.save(STORAGE_KEYS.CART, cart);
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    if (quantity <= 0) return;
    
    if (cart.totalItems + quantity > APP_CONSTANTS.MAX_CART_ITEMS) {
      throw new Error(`Maximum ${APP_CONSTANTS.MAX_CART_ITEMS} items allowed in cart`);
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock available');
    }

    setCart(prevCart => {
      const existingItemIndex = prevCart.items.findIndex(
        item => item.product.id === product.id
      );

      let newItems: CartItem[];

      if (existingItemIndex > -1) {
        // Update existing item
        newItems = [...prevCart.items];
        const newQuantity = newItems[existingItemIndex].quantity + quantity;
        
        if (newQuantity > product.stock) {
          throw new Error('Cannot exceed available stock');
        }
        
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newQuantity,
        };
      } else {
        // Add new item
        newItems = [...prevCart.items, { product, quantity }];
      }

      return {
        items: newItems,
        totalAmount: calculateTotal(newItems),
        totalItems: calculateTotalItems(newItems),
      };
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => {
      const newItems = prevCart.items.filter(
        item => item.product.id !== productId
      );

      return {
        items: newItems,
        totalAmount: calculateTotal(newItems),
        totalItems: calculateTotalItems(newItems),
      };
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => {
      const newItems = prevCart.items.map(item => {
        if (item.product.id === productId) {
          if (quantity > item.product.stock) {
            throw new Error('Cannot exceed available stock');
          }
          return { ...item, quantity };
        }
        return item;
      });

      return {
        items: newItems,
        totalAmount: calculateTotal(newItems),
        totalItems: calculateTotalItems(newItems),
      };
    });
  };

  const clearCart = () => {
    setCart({
      items: [],
      totalAmount: 0,
      totalItems: 0,
    });
  };

  const getItemQuantity = (productId: string): number => {
    const item = cart.items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const isInCart = (productId: string): boolean => {
    return cart.items.some(item => item.product.id === productId);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemQuantity,
        isInCart,
      }}
    >
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
