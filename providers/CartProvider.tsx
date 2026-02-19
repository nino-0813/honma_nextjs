'use client';

import React, { createContext, useState, useEffect } from 'react';
import { Product, CartItem } from '@/types';
import { checkStockAvailability } from '@/lib/supabase';

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number, variant?: string, finalPrice?: number, selectedOptions?: Record<string, string>) => void;
  removeFromCart: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  clearCart: () => void;
  openCart: () => void;
  restoreCart: () => void;
}

export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  openCart: () => {},
  restoreCart: () => {},
});

export function CartProvider({
  children,
  onCartOpen,
  onMenuOpen,
}: {
  children: React.ReactNode;
  onCartOpen: () => void;
  onMenuOpen: () => void;
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedCart = localStorage.getItem('ikevege_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('ikevege_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (
    product: Product,
    quantity: number,
    variant?: string,
    finalPrice?: number,
    selectedOptions?: Record<string, string>
  ) => {
    const price = finalPrice ?? product.price;
    setCartItems((prev) => {
      const existingItemIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.variant === variant
      );
      const currentCartQuantity = existingItemIndex > -1 ? prev[existingItemIndex].quantity : 0;
      const newQuantity = currentCartQuantity + quantity;
      if (selectedOptions) {
        const stockCheck = checkStockAvailability(product, selectedOptions, newQuantity, 0);
        if (!stockCheck.available) return prev;
      }
      if (existingItemIndex > -1) {
        const newCart = [...prev];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newQuantity,
          finalPrice: newCart[existingItemIndex].finalPrice ?? price,
          selectedOptions: newCart[existingItemIndex].selectedOptions ?? selectedOptions,
        };
        return newCart;
      }
      return [...prev, { product, quantity, variant, finalPrice: price, selectedOptions }];
    });
  };

  const removeFromCart = (productId: string, variant?: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.variant === variant))
    );
  };

  const updateQuantity = (productId: string, quantity: number, variant?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    setCartItems((prev) => {
      const item = prev.find((i) => i.product.id === productId && i.variant === variant);
      if (!item) return prev;
      const selectedOptions = item.selectedOptions;
      if (selectedOptions && Object.keys(selectedOptions).length > 0) {
        const stockCheck = checkStockAvailability(item.product, selectedOptions, quantity, 0);
        if (!stockCheck.available) return prev;
      } else {
        const stock = item.product.stock ?? null;
        if (stock !== null && quantity > stock) return prev;
      }
      return prev.map((i) =>
        i.product.id === productId && i.variant === variant ? { ...i, quantity } : i
      );
    });
  };

  const clearCart = () => setCartItems([]);
  const openCart = () => onCartOpen();
  const restoreCart = () => {
    try {
      const savedCart = localStorage.getItem('ikevege_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart.length > 0) setCartItems(parsedCart);
      }
    } catch (e) {
      console.error('カート復元エラー:', e);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        restoreCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
