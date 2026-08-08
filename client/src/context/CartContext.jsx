import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../services/cartApi';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const EMPTY_CART = { items: [], itemCount: 0, subtotal: 0 };

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);

  const isBuyer = isAuthenticated && user?.role === 'buyer';

  const refreshCart = useCallback(async () => {
    if (!isBuyer) {
      setCart(EMPTY_CART);
      return;
    }
    setLoading(true);
    try {
      const data = await cartApi.get();
      setCart(data.cart);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCart(EMPTY_CART);
    } finally {
      setLoading(false);
    }
  }, [isBuyer]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (cropId, quantity) => {
    const data = await cartApi.add(cropId, quantity);
    setCart(data.cart);
    return data;
  };

  const updateQuantity = async (cropId, quantity) => {
    const data = await cartApi.update(cropId, quantity);
    setCart(data.cart);
    return data;
  };

  const removeItem = async (cropId) => {
    const data = await cartApi.remove(cropId);
    setCart(data.cart);
    return data;
  };

  const clearCart = async () => {
    await cartApi.clear();
    setCart(EMPTY_CART);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount: cart.itemCount || 0,
        subtotal: cart.subtotal || 0,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
