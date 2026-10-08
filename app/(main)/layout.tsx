'use client';

import { useState, useContext, useEffect } from 'react';
import { CartProvider, CartContext } from '@/providers/CartProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartDrawer, MenuDrawer } from '@/components/Drawers';
import { supabase } from '@/lib/supabase';

const REFERRAL_STORAGE_KEY = 'ikevege_referral_code';
const REFERRAL_CAPTURED_AT_KEY = 'ikevege_referral_captured_at';

function normalizeReferralCode(value: string): string {
  return value.trim().toLowerCase();
}

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
      {/* overflow-x-hidden は縦方向にもスクロール領域を作り position:sticky を無効化するため clip を使う */}
      <main className="flex-1 w-full overflow-x-clip">{children}</main>
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

  // 紹介URL（?ref=コード）を踏んだら会員登録まで覚えておく
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      try {
        const normalized = normalizeReferralCode(ref);
        if (!normalized) return;
        localStorage.setItem(REFERRAL_STORAGE_KEY, normalized);
        localStorage.setItem(REFERRAL_CAPTURED_AT_KEY, String(Date.now()));
      } catch {
        // localStorageが使えない場合は何もしない
      }
    }
  }, []);

  // Google OAuthは画面遷移を伴うため、戻ってきた後に新規ユーザーだけ紹介を紐付ける。
  // API失敗時はコードを残し、次回表示時に再試行する。
  useEffect(() => {
    if (!supabase || typeof window === 'undefined') return;
    const supabaseClient = supabase;

    const linkReferralForNewOAuthUser = async () => {
      const referralCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
      if (!referralCode) return;

      const { data } = await supabaseClient.auth.getSession();
      const session = data.session;
      const user = session?.user;
      if (!session || !user) return;

      const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
      const isRecentlyCreated = createdAt > 0 && Date.now() - createdAt < 30 * 60 * 1000;
      if (!isRecentlyCreated) return;

      try {
        const response = await fetch('/api/track-referral', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: user.id, referralCode }),
        });
        const result = await response.json().catch(() => null);
        if (response.ok && result?.ok) {
          localStorage.removeItem(REFERRAL_STORAGE_KEY);
          localStorage.removeItem(REFERRAL_CAPTURED_AT_KEY);
        }
      } catch (error) {
        console.error('Google登録の紹介記録に失敗しました。次回再試行します:', error);
      }
    };

    void linkReferralForNewOAuthUser();
  }, []);

  return (
    <CartProvider onCartOpen={() => setIsCartOpen(true)} onMenuOpen={() => setIsMenuOpen(true)}>
      <div className="min-h-screen bg-white flex flex-col font-serif font-medium tracking-widest text-primary selection:bg-black selection:text-white overflow-x-clip w-full">
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
