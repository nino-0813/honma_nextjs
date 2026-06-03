'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconBag, IconMenu, IconUser } from './Icons';
import { CartContext } from '@/providers/CartProvider';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenCart, onOpenMenu }) => {
  const pathname = usePathname();
  const location = pathname ?? '/';
  // SUBSCRIPTIONリンク（/collections/rice/yearly?view=lp）かどうかの判定用
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

  const isActive = (path: string) => {
    // SUBSCRIPTIONリンクは ?view=lp が付いている時だけアクティブ
    if (path === '/collections/rice/yearly') return isSubscriptionLp;
    // CATEGORYは /collections* すべて。ただし SUBSCRIPTION LP表示時は除外
    if (path === '/collections') {
      return (location === '/collections' || location.startsWith('/collections/'))
        && !isSubscriptionLp;
    }
    return location === path;
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
                className={`w-auto object-contain transition-all duration-500 ${
                  isScrolled ? 'h-16 md:h-24' : 'h-8 md:h-12'
                }`}
              />
            </Link>
          </div>

          <nav className="hidden md:flex space-x-10 items-center">
            <Link href="/" className={`text-sm font-medium tracking-[0.15em] transition-colors relative group ${
              isActive('/') ? (isHomePage && !isScrolled ? 'text-white' : 'text-black') : (isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-gray-500 hover:text-black')
            }`}>
              HOME
              <span className={`absolute -bottom-2 left-0 w-full h-px ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} transition-transform duration-300 origin-left ${isActive('/') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </Link>
            <Link href="/about" className={`text-sm font-medium tracking-[0.15em] transition-colors relative group ${
              isActive('/about') ? (isHomePage && !isScrolled ? 'text-white' : 'text-black') : (isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-gray-500 hover:text-black')
            }`}>
              ABOUT US
              <span className={`absolute -bottom-2 left-0 w-full h-px ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} transition-transform duration-300 origin-left ${isActive('/about') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </Link>
            <Link
              href="/collections/rice/yearly?view=lp"
              className={`relative inline-flex items-center gap-1.5 text-xs md:text-[13px] font-semibold tracking-[0.2em] px-3.5 md:px-4 py-1.5 rounded-full border transition-all duration-300 ${
                isActive('/collections/rice/yearly')
                  ? isHomePage && !isScrolled
                    ? 'text-black bg-white border-white shadow-[0_0_0_3px_rgba(255,255,255,0.18)]'
                    : 'text-white bg-black border-black'
                  : isHomePage && !isScrolled
                    ? 'text-white border-white/85 bg-white/5 backdrop-blur-[2px] hover:bg-white hover:text-black shadow-[0_0_0_3px_rgba(255,255,255,0.12)]'
                    : 'text-primary border-primary/60 hover:bg-primary hover:text-white'
              }`}
            >
              SUBSCRIPTION
            </Link>
            <Link href="/collections" className={`text-sm font-medium tracking-[0.15em] transition-colors relative group ${
              isActive('/collections') ? (isHomePage && !isScrolled ? 'text-white' : 'text-black') : (isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-gray-500 hover:text-black')
            }`}>
              CATEGORY
              <span className={`absolute -bottom-2 left-0 w-full h-px ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} transition-transform duration-300 origin-left ${isActive('/collections') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </Link>
            <Link href="/blog" className={`text-sm font-medium tracking-[0.15em] transition-colors relative group ${
              isActive('/blog') ? (isHomePage && !isScrolled ? 'text-white' : 'text-black') : (isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-gray-500 hover:text-black')
            }`}>
              BLOG
              <span className={`absolute -bottom-2 left-0 w-full h-px ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} transition-transform duration-300 origin-left ${isActive('/blog') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </Link>
            <Link href="/join-us" className={`text-sm font-medium tracking-[0.15em] transition-colors relative group ${
              isActive('/join-us') ? (isHomePage && !isScrolled ? 'text-white' : 'text-black') : (isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-gray-500 hover:text-black')
            }`}>
              JOIN US
              <span className={`absolute -bottom-2 left-0 w-full h-px ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} transition-transform duration-300 origin-left ${isActive('/join-us') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </Link>
            <Link href="/contact" className={`text-sm font-medium tracking-[0.15em] transition-colors relative group ${
              isActive('/contact') ? (isHomePage && !isScrolled ? 'text-white' : 'text-black') : (isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-gray-500 hover:text-black')
            }`}>
              CONTACT
              <span className={`absolute -bottom-2 left-0 w-full h-px ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} transition-transform duration-300 origin-left ${isActive('/contact') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </Link>
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
            <button type="button" onClick={onOpenMenu} className={`md:hidden transition-colors ${
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
