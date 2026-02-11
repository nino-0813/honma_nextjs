'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconClose, IconInstagram, IconYoutube, IconChevronDown, IconPlus, IconTrash } from './Icons';
import { CartItem } from '@/types';
import { FadeInImage } from './UI';
import { supabase, checkStockAvailability } from '@/lib/supabase';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  position?: 'left' | 'right';
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, children, title, position = 'right' }) => {
  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Content */}
      <div 
        className={`fixed top-0 bottom-0 z-[70] w-full max-w-[350px] bg-white shadow-2xl transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          position === 'right' 
            ? (isOpen ? 'translate-x-0 right-0' : 'translate-x-full right-0')
            : (isOpen ? 'translate-x-0 left-0' : '-translate-x-full left-0')
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-base font-serif tracking-wider font-medium">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <IconClose className="w-5 h-5 opacity-60" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemove: (productId: string, variant?: string) => void;
  onUpdateQuantity: (productId: string, quantity: number, variant?: string) => void;
}

export const CartDrawer = ({ isOpen, onClose, cartItems, onRemove, onUpdateQuantity }: CartDrawerProps) => {
  const router = useRouter();
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({});
  const total = cartItems.reduce((sum, item) => {
    const price = item.finalPrice ?? item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="カート">
      {cartItems.length === 0 ? (
        <div className="flex flex-col h-full justify-center items-center p-8 text-gray-400">
          <p className="mb-6 text-sm tracking-wider">カートに商品がありません</p>
          <button onClick={onClose} className="border-b border-black text-primary hover:text-gray-600 pb-1 text-sm tracking-widest transition-colors">
            買い物を続ける
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.map((item) => (
              <div key={`${item.product.id}-${item.variant || 'default'}`} className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0">
                <Link href={`/products/${item.product.handle}`} onClick={onClose} className="flex-shrink-0 aspect-square w-20 bg-gray-100 rounded overflow-hidden block">
                  <FadeInImage 
                    src={item.product.images && item.product.images.length > 0 ? item.product.images[0] : (item.product.image || '')} 
                    alt={item.product.title} 
                    className="w-full h-full object-cover" 
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.handle}`} onClick={onClose}>
                    <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 hover:text-primary transition-colors">
                      {item.product.title}
                    </h3>
                  </Link>
                  {item.variant && (
                    <p className="text-xs text-gray-500 mb-1">
                      {item.variant}
                    </p>
                  )}
                  <p className="text-sm font-serif text-gray-600 mb-2">
                    ¥{(item.finalPrice ?? item.product.price).toLocaleString()}
                  </p>
                  {stockErrors[`${item.product.id}-${item.variant || ''}`] && (
                    <p className="text-xs text-red-600 mb-1">
                      {stockErrors[`${item.product.id}-${item.variant || ''}`]}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-200">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          onUpdateQuantity(item.product.id, item.quantity - 1, item.variant);
                        }}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-serif">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const newQuantity = item.quantity + 1;
                          const itemKey = `${item.product.id}-${item.variant || ''}`;
                          const selectedOptions = item.selectedOptions ?? {};
                          const stockCheck = checkStockAvailability(
                            item.product,
                            selectedOptions,
                            newQuantity,
                            0
                          );
                          if (!stockCheck.available) {
                            setStockErrors(prev => ({
                              ...prev,
                              [itemKey]: stockCheck.message || '在庫が不足しています。'
                            }));
                            setTimeout(() => {
                              setStockErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors[itemKey];
                                return newErrors;
                              });
                            }, 3000);
                            return;
                          }
                          setStockErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[itemKey];
                            return newErrors;
                          });
                          onUpdateQuantity(item.product.id, newQuantity, item.variant);
                        }}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onRemove(item.product.id, item.variant);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 p-6 space-y-4 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">合計</span>
              <span className="text-lg font-serif font-bold text-gray-900">
                ¥{total.toLocaleString()}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-primary text-white text-sm tracking-widest uppercase hover:bg-gray-800 transition-colors"
            >
              レジに進む
            </button>
            <button
              onClick={onClose}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              買い物を続ける
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export const MenuDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const router = useRouter();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isRiceOpen, setIsRiceOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleLoginClick = () => {
    // ログイン状態に関わらず、マイページに遷移
    // マイページでログインしていない場合は自動的にチェックアウトページにリダイレクトされる
    navigate('/account');
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="" position="right">
      <div className="flex flex-col px-6 py-8 gap-0">
        <nav className="flex flex-col text-sm font-medium tracking-widest text-gray-800">
          <button onClick={() => navigate('/')} className="text-left border-b border-gray-100 py-4 hover:text-gray-500 transition-colors block w-full">
            HOME
          </button>
          <button onClick={() => navigate('/about')} className="text-left border-b border-gray-100 py-4 hover:text-gray-500 transition-colors block w-full">
            ABOUT US
          </button>
          
          {/* CATEGORY with Accordion */}
          <div className="border-b border-gray-100">
            <div className="w-full flex items-center justify-between py-4">
              <button 
                onClick={() => navigate('/collections')}
                className="flex-1 text-left hover:text-gray-500 transition-colors"
              >
                CATEGORY
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCategoryOpen(!isCategoryOpen);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <IconChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {isCategoryOpen && (
              <div className="pl-4 pb-4 flex flex-col gap-0">
                <button 
                  onClick={() => navigate('/collections')} 
                  className="text-left py-3 text-gray-600 hover:text-black transition-colors block w-full"
                >
                  ALL
                </button>
                
                {/* お米 with Sub-Accordion */}
                <div>
                  <button 
                    onClick={() => setIsRiceOpen(!isRiceOpen)}
                    className="w-full flex items-center justify-between py-3 text-gray-600 hover:text-black transition-colors text-left"
                  >
                    <span>お米</span>
                    <IconPlus className={`w-4 h-4 transition-transform duration-300 ${isRiceOpen ? 'rotate-45' : ''}`} />
                  </button>
                  
                  {isRiceOpen && (
                    <div className="pl-4 flex flex-col gap-0">
                      <button 
                        onClick={() => navigate('/collections/rice')} 
                        className="text-left py-2 text-gray-500 hover:text-black transition-colors block w-full text-xs"
                      >
                        ALL
                      </button>
                      <button 
                        onClick={() => navigate('/collections/rice/koshihikari')} 
                        className="text-left py-2 text-gray-500 hover:text-black transition-colors block w-full text-xs"
                      >
                        コシヒカリ
                      </button>
                      <button 
                        onClick={() => navigate('/collections/rice/kamenoo')} 
                        className="text-left py-2 text-gray-500 hover:text-black transition-colors block w-full text-xs"
                      >
                        亀の尾
                      </button>
                      <button 
                        onClick={() => navigate('/collections/rice/nikomaru')} 
                        className="text-left py-2 text-gray-500 hover:text-black transition-colors block w-full text-xs"
                      >
                        にこまる
                      </button>
                      <button 
                        onClick={() => navigate('/collections/rice/yearly')} 
                        className="text-left py-2 text-gray-500 hover:text-black transition-colors block w-full text-xs"
                      >
                        年間契約
                      </button>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => navigate('/collections/crescent')} 
                  className="text-left py-3 text-gray-600 hover:text-black transition-colors block w-full"
                >
                  Crescentmoon
                </button>
                <button 
                  onClick={() => navigate('/collections/other')} 
                  className="text-left py-3 text-gray-600 hover:text-black transition-colors block w-full"
                >
                  その他
                </button>
              </div>
            )}
          </div>

          <button onClick={() => navigate('/blog')} className="text-left border-b border-gray-100 py-4 hover:text-gray-500 transition-colors block w-full">
            BLOG
          </button>
          <button onClick={() => navigate('/ambassador')} className="text-left border-b border-gray-100 py-4 hover:text-gray-500 transition-colors block w-full">
            JOIN US
          </button>
          <button onClick={() => navigate('/contact')} className="text-left border-b border-gray-100 py-4 hover:text-gray-500 transition-colors block w-full">
            CONTACT
          </button>
          <button onClick={handleLoginClick} className="text-left border-b border-gray-100 py-4 hover:text-gray-500 transition-colors block w-full">
            MY PAGE
          </button>
        </nav>

        <div className="flex gap-8 justify-center mt-8 pt-8 border-t border-gray-100">
          <a href="#" className="text-primary hover:text-gray-500 transition-colors"><IconInstagram className="w-5 h-5" /></a>
          <a 
            href="https://www.youtube.com/@ikevege" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-gray-500 transition-colors"
          >
            <IconYoutube className="w-5 h-5" />
          </a>
        </div>
      </div>
    </Drawer>
  );
};