'use client';

import { useState, useContext } from 'react';
import { CartProvider, CartContext } from '@/providers/CartProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartDrawer, MenuDrawer } from '@/components/Drawers';

function MainLayoutInner({
  children,
  isCartOpen,
  onCloseCart,
  isMenuOpen,
  onCloseMenu,
  onOpenCart,
  onOpenMenu,
}: {
  children: React.ReactNode;
  isCartOpen: boolean;
  onCloseCart: () => void;
  isMenuOpen: boolean;
  onCloseMenu: () => void;
  onOpenCart: () => void;
  onOpenMenu: () => void;
}) {
  const { cartItems, removeFromCart, updateQuantity } = useContext(CartContext);

  return (
    <>
      <Header onOpenCart={onOpenCart} onOpenMenu={onOpenMenu} />
      <main className="flex-1 w-full overflow-x-hidden">{children}</main>
      <Footer />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={onCloseCart}
        cartItems={cartItems}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
      />
      <MenuDrawer isOpen={isMenuOpen} onClose={onCloseMenu} />
    </>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <CartProvider onCartOpen={() => setIsCartOpen(true)} onMenuOpen={() => setIsMenuOpen(true)}>
      <div className="min-h-screen bg-white flex flex-col font-serif font-medium tracking-widest text-primary selection:bg-black selection:text-white overflow-x-hidden w-full">
        <MainLayoutInner
          isCartOpen={isCartOpen}
          onCloseCart={() => setIsCartOpen(false)}
          isMenuOpen={isMenuOpen}
          onCloseMenu={() => setIsMenuOpen(false)}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenMenu={() => setIsMenuOpen(true)}
        >
          {children}
        </MainLayoutInner>
      </div>
    </CartProvider>
  );
}
