import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Cart, CartItem, Product } from '../types';
import StorageService from '../utils/storage';
import { STORAGE_KEYS, APP_CONSTANTS } from '../constants';
import apiClient from '../services/apiClient';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    const unitPrice = item.unitPrice ?? item.product.currentPrice ?? item.product.price;
    return total + (unitPrice * item.quantity);
  }, 0);
};

const calculateTotalItems = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.quantity, 0);
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const canSyncCart = isAuthenticated && user?.role !== 'admin';
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

  useEffect(() => {
    if (canSyncCart) {
      refreshCart();
    } else if (!isAuthenticated) {
      // Clear cart when user logs out
      setCart({
        items: [],
        totalAmount: 0,
        totalItems: 0,
      });
    }
  }, [canSyncCart, isAuthenticated]);

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

  const refreshCart = async () => {
    if (!canSyncCart) return;
    
    try {
      const cartData = await apiClient.get('/cart/') as any;
      if (!cartData) {
        throw new Error('Empty cart response');
      }
      setCart({
        items: (cartData.items || []).map((item: any) => {
          const details = item.product_details || item.product || {};
          return {
            id: item.id,
            product: {
              id: String(details.id || item.product || ''),
              name: details.name || item.product_name || 'Unknown',
              brand: details.brand || item.product_brand || '',
              category: details.category_name || details.category || '',
              barcode: details.barcode || '',
              price: Number(details.price || 0),
              currentPrice: details.current_price !== undefined ? Number(details.current_price) : Number(details.price || 0),
              imageUrl: details.picture_url || details.picture || '',
              stock: Number(details.quantity_in_stock || 0),
              description: details.description || '',
              nutritionalInfo: details.nutritionalInfo,
              activePromotion: details.active_promotion,
            },
            quantity: Number(item.quantity || 0),
            unitPrice: item.unit_price !== undefined ? Number(item.unit_price) : undefined,
            totalPrice: item.total_price !== undefined ? Number(item.total_price) : undefined,
          };
        }),
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

    // Sync with API if authenticated
    if (canSyncCart) {
  apiClient.post('/cart/add_item/', {
        product: product.id,
        quantity: quantity,
      }).catch(error => {
        console.error('Error syncing add to cart with API:', error);
      });
    }
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

    // Sync with API if authenticated
    if (canSyncCart) {
      const cartItem = cart.items.find(item => item.product.id === productId);
      if (cartItem?.id) {
  apiClient.delete('/cart/remove_item/', {
          data: { item_id: cartItem.id }
        }).catch(error => {
          console.error('Error syncing remove from cart with API:', error);
        });
      }
    }
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

    // Sync with API if authenticated
    if (canSyncCart) {
      const cartItem = cart.items.find(item => item.product.id === productId);
      if (cartItem?.id) {
  apiClient.patch('/cart/update_item/', {
          item_id: cartItem.id,
          quantity: quantity,
        }).catch(error => {
          console.error('Error syncing update quantity with API:', error);
        });
      }
    }
  };

  const clearCart = () => {
    setCart({
      items: [],
      totalAmount: 0,
      totalItems: 0,
    });

    // Sync with API if authenticated
    if (canSyncCart) {
      apiClient.post('/cart/clear/').catch(error => {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('session has expired')) {
          return;
        }
        console.error('Error syncing clear cart with API:', error);
      });
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
