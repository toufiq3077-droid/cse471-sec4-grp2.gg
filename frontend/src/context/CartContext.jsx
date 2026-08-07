import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "khet_i_cart";

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch {
        setCartItems([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addItem = (crop) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.crop === crop._id);
      if (existing) {
        if (existing.quantity >= crop.stockQuantity) return prev;
        return prev.map((item) =>
          item.crop === crop._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { crop: crop._id, name: crop.name, pricePerUnit: crop.pricePerUnit, unit: crop.unit, image: crop.images?.[0]?.url || "", quantity: 1, stockQuantity: crop.stockQuantity }];
    });
  };

  const removeItem = (cropId) => {
    setCartItems((prev) => prev.filter((item) => item.crop !== cropId));
  };

  const updateQuantity = (cropId, quantity) => {
    const qty = Number(quantity);
    if (qty <= 0) {
      removeItem(cropId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.crop === cropId
          ? { ...item, quantity: Math.min(qty, item.stockQuantity) }
          : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{ cartItems, addItem, removeItem, updateQuantity, clearCart, itemCount, totalAmount }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
