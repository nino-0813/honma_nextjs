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
  const [isScrolled, setIsScrolled] = useState(false);
  const { cartItems } = useContext(CartContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
    if (path === '/collections') return location === '/collections' || location.startsWith('/collections/');
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
            <Link href="/ambassador" className={`text-sm font-medium tracking-[0.15em] transition-colors relative group ${
              isActive('/ambassador') ? (isHomePage && !isScrolled ? 'text-white' : 'text-black') : (isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-gray-500 hover:text-black')
            }`}>
              JOIN US
              <span className={`absolute -bottom-2 left-0 w-full h-px ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} transition-transform duration-300 origin-left ${isActive('/ambassador') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
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
              {cartItemCount > 0 && (
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
