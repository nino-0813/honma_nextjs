'use client';

import React, { createContext, useState, useEffect } from 'react';
import { Product, CartItem, SubscriptionInterval } from '@/types';
import { checkStockAvailability } from '@/lib/supabase';

export interface AddToCartSubscription {
  purchaseType: 'subscription';
  subscriptionInterval: SubscriptionInterval;
  subscriptionDiscountPercent: number;
}

export interface AddToCartOptions {
  variant?: string;
  finalPrice?: number;
  selectedOptions?: Record<string, string>;
  subscription?: AddToCartSubscription;
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number, options?: AddToCartOptions) => void;
  removeFromCart: (productId: string, variant?: string, subscriptionInterval?: SubscriptionInterval) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string, subscriptionInterval?: SubscriptionInterval) => void;
  clearCart: () => void;
  openCart: () => void;
  restoreCart: () => void;
}

// カート内で同一アイテムかどうかを判定するキー
// 通常購入と定期購入、間隔の違いで別エントリとして扱う
const matchCartItem = (
  a: Pick<CartItem, 'product' | 'variant' | 'purchaseType' | 'subscriptionInterval'>,
  b: Pick<CartItem, 'product' | 'variant' | 'purchaseType' | 'subscriptionInterval'>
) =>
  a.product.id === b.product.id &&
  (a.variant ?? '') === (b.variant ?? '') &&
  (a.purchaseType ?? 'one_time') === (b.purchaseType ?? 'one_time') &&
  (a.subscriptionInterval ?? '') === (b.subscriptionInterval ?? '');

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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartHydrated, setIsCartHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('ikevege_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      }
    } catch {
      // Ignore invalid localStorage payloads.
    } finally {
      setIsCartHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isCartHydrated) return;
    localStorage.setItem('ikevege_cart', JSON.stringify(cartItems));
  }, [cartItems, isCartHydrated]);

  const addToCart = (product: Product, quantity: number, options?: AddToCartOptions) => {
    const { variant, finalPrice, selectedOptions, subscription } = options ?? {};
    const purchaseType = subscription ? 'subscription' : 'one_time';
    const subscriptionInterval = subscription?.subscriptionInterval;
    const subscriptionDiscountPercent = subscription?.subscriptionDiscountPercent ?? 0;
    const basePrice = finalPrice ?? product.price;
    const priceAfterDiscount = subscription
      ? Math.round(basePrice * (1 - subscriptionDiscountPercent / 100))
      : basePrice;

    const target = { product, variant, purchaseType, subscriptionInterval } as Pick<
      CartItem,
      'product' | 'variant' | 'purchaseType' | 'subscriptionInterval'
    >;

    setCartItems((prev) => {
      const existingItemIndex = prev.findIndex((item) => matchCartItem(item, target));
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
          finalPrice: newCart[existingItemIndex].finalPrice ?? priceAfterDiscount,
          selectedOptions: newCart[existingItemIndex].selectedOptions ?? selectedOptions,
        };
        return newCart;
      }
      const newItem: CartItem = {
        product,
        quantity,
        variant,
        finalPrice: priceAfterDiscount,
        selectedOptions,
        purchaseType,
        subscriptionInterval,
        subscriptionDiscountPercent: subscription ? subscriptionDiscountPercent : undefined,
      };
      return [...prev, newItem];
    });
  };

  const removeFromCart = (
    productId: string,
    variant?: string,
    subscriptionInterval?: SubscriptionInterval
  ) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            (item.variant ?? '') === (variant ?? '') &&
            (item.subscriptionInterval ?? '') === (subscriptionInterval ?? '')
          )
      )
    );
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    variant?: string,
    subscriptionInterval?: SubscriptionInterval
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant, subscriptionInterval);
      return;
    }
    setCartItems((prev) => {
      const item = prev.find(
        (i) =>
          i.product.id === productId &&
          (i.variant ?? '') === (variant ?? '') &&
          (i.subscriptionInterval ?? '') === (subscriptionInterval ?? '')
      );
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
        i.product.id === productId &&
        (i.variant ?? '') === (variant ?? '') &&
        (i.subscriptionInterval ?? '') === (subscriptionInterval ?? '')
          ? { ...i, quantity }
          : i
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
