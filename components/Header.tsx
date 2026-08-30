'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconBag, IconMenu, IconUser } from './Icons';
import { CartContext } from '@/providers/CartProvider';
import { PRIMARY_NAV } from './navigation';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenCart, onOpenMenu }) => {
  const pathname = usePathname();
  const location = pathname ?? '/';
  // 定期便リンク（/collections/rice/yearly?view=lp）かどうかの判定用
  // ※ useSearchParams は静的プリレンダリングのバウンダリ要件があるため、
  //   useEffect+window.location.searchで代替してビルドエラーを回避
  const [isSubscriptionLp, setIsSubscriptionLp] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setIsSubscriptionLp(
      location === '/collections/rice/yearly' && params.get('view') === 'lp'
    );
  }, [location]);
  const [isScrolled, setIsScrolled] = useState(false);
  const { cartItems } = useContext(CartContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsLoggedIn(!!session);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (item: { href: string; matchPrefix?: string; matchQuery?: { key: string; value: string } }) => {
    // 定期便リンクは ?view=lp が付いている時だけアクティブ
    if (item.matchQuery) return isSubscriptionLp;
    // 商品一覧は /collections 配下すべて。ただし定期便LP表示中は除外
    if (item.matchPrefix) {
      return location.startsWith(item.matchPrefix) && !isSubscriptionLp;
    }
    return location === item.href;
  };
  const isHomePage = location === '/';

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500 border-b overflow-x-hidden ${
        isScrolled ? 'bg-white/95 backdrop-blur-md py-1.5 md:py-2 border-secondary shadow-sm' : 'bg-transparent py-2 md:py-3 border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex-shrink-0 flex items-center z-50">
            <Link href="/" className="hover:opacity-70 transition-opacity block">
              <img
                src="/images/ikevege_logo_128.webp"
                srcSet="/images/ikevege_logo_128.webp 128w, /images/ikevege_logo.webp 4500w"
                sizes="(max-width: 768px) 32px, 48px"
                alt="IKEVEGE"
                width={128}
                height={128}
                // スクロール時に拡大するとヘッダーの高さを超えて見切れるため、
                // 上部で少し大きく・スクロール後に少し小さくする
                className={`w-auto object-contain transition-all duration-500 ${
                  isScrolled ? 'h-9 md:h-11' : 'h-10 md:h-14'
                }`}
              />
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8 lg:space-x-10 items-center">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(item);
              const onHero = isHomePage && !isScrolled;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-[13px] lg:text-sm font-medium tracking-[0.08em] transition-colors relative group whitespace-nowrap ${
                    active
                      ? onHero ? 'text-white' : 'text-black'
                      : onHero ? 'text-white hover:text-white/80' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-2 left-0 w-full h-px ${onHero ? 'bg-white' : 'bg-black'} transition-transform duration-300 origin-left ${
                      active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-5 sm:gap-6">
            <Link href="/account" className={`hidden sm:block transition-colors ${
              isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-primary hover:text-gray-500'
            }`} title={isLoggedIn ? 'mypage' : 'ログイン'}>
              <IconUser className="w-5 h-5" />
            </Link>
            <button type="button" onClick={onOpenCart} className={`transition-colors relative ${
              isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-primary hover:text-gray-500'
            }`}>
              <IconBag className="w-5 h-5" />
              {mounted && cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-medium w-4 h-4 flex items-center justify-center rounded-full">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>
            {/* ハンバーガーはPCでも出す（副次メニューをここに集約） */}
            <button type="button" onClick={onOpenMenu} aria-label="メニューを開く" className={`transition-colors ${
              isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-primary hover:text-gray-500'
            }`}>
              <IconMenu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
