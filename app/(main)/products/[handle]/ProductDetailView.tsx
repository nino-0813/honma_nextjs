'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types';
import { IconChevronDown } from '@/components/Icons';
import { FadeInImage, LoadingButton } from '@/components/UI';
import { CartContext } from '@/providers/CartProvider';
import { supabase, checkStockAvailability, getStockForVariant } from '@/lib/supabase';

export default function ProductDetailView({ product }: { product: Product }) {
  const { products: allProducts } = useProducts();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [calculatedPrice, setCalculatedPrice] = useState(product.price);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('desc');
  const { addToCart, openCart, cartItems } = useContext(CartContext);
  const [stockError, setStockError] = useState<string>('');

  // 販売期間内かどうか
  const isWithinSalesPeriod = (p: Product | null): boolean => {
    if (!p) return true;
    const now = new Date().getTime();
    if (p.saleStartAt && new Date(p.saleStartAt).getTime() > now) return false; // 開始前
    if (p.saleEndAt && new Date(p.saleEndAt).getTime() < now) return false;     // 終了後
    return true;
  };

  // 販売期間の表示用フォーマット（例: 2026年3月1日 20:00）
  const formatSaleDateTime = (iso: string) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}年${m}月${day}日 ${h}:${min}`;
  };
  
  // お問い合わせフォームの状態
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquiryStatus, setInquiryStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [inquiryErrorMessage, setInquiryErrorMessage] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 初期選択と価格計算
  useEffect(() => {
    if (product) {
      const initialOptions: Record<string, string> = {};
      let price = product.price;

      if (product.hasVariants) {
        // 新しいConfigがある場合
        if (product.variants_config && product.variants_config.length > 0) {
          product.variants_config.forEach(type => {
            // 既に選択されていれば維持、なければ最初のオプションを選択
            if (!selectedOptions[type.id] && type.options.length > 0) {
              initialOptions[type.id] = type.options[0].id;
            } else if (selectedOptions[type.id]) {
              initialOptions[type.id] = selectedOptions[type.id];
            }
          });
        } 
        // 旧形式のvariantsがある場合 (Configがない場合)
        else if (product.variants && product.variants.length > 0 && Object.keys(selectedOptions).length === 0) {
           // 旧形式は単純な文字列なので、Config形式に擬似的に扱うか、既存UIで処理するが、
           // 今回はConfig形式への移行を前提とするため、ProductEditorで保存されたデータはConfigを持つはず。
           // 旧データのみの場合は、UI側で別途ハンドリングするか、ここで変換する。
           // ここでは、旧データの場合は 'legacy_type' キーで管理する
           initialOptions['legacy'] = product.variants[0];
        }
      }

      // マージしてセット
      if (Object.keys(initialOptions).length > 0 && Object.keys(selectedOptions).length === 0) {
         setSelectedOptions(initialOptions);
      }

      // 価格再計算
      if (product.variants_config && product.variants_config.length > 0) {
        let adjustment = 0;
        product.variants_config.forEach(type => {
          const selectedOptionId = selectedOptions[type.id] || (type.options.length > 0 ? type.options[0].id : null);
          if (selectedOptionId) {
            const option = type.options.find(o => o.id === selectedOptionId);
            if (option) {
              adjustment += option.priceAdjustment || 0;
            }
          }
        });
        setCalculatedPrice(product.price + adjustment);
      } else {
        setCalculatedPrice(product.price);
      }
    }
  }, [product, selectedOptions]);

  const handleOptionChange = (typeId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [typeId]: optionId
    }));
  };

  const handleLegacyOptionChange = (value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      'legacy': value
    }));
  };

  // カート追加用バリエーション文字列生成
  const getSelectedVariantString = () => {
    if (!product?.hasVariants) return undefined;
    
    if (product.variants_config && product.variants_config.length > 0) {
      const parts: string[] = [];
      product.variants_config.forEach(type => {
        const selectedOptionId = selectedOptions[type.id];
        const option = type.options.find(o => o.id === selectedOptionId);
        if (option) {
          parts.push(option.value);
        }
      });
      return parts.join(' / ');
    } else if (product.variants && product.variants.length > 0) {
      return selectedOptions['legacy'] || product.variants[0];
    }
    return undefined;
  };

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryEmail || !inquiryMessage) {
      setInquiryStatus('error');
      setInquiryErrorMessage('お名前、メールアドレス、内容は必須項目です。');
      return;
    }
    setSubmittingInquiry(true);
    setInquiryStatus('idle');
    setInquiryErrorMessage('');
    try {
      if (!supabase) throw new Error('Supabaseが利用できません。');
      const { error } = await supabase.from('inquiries').insert([{
        name: inquiryName, email: inquiryEmail, phone: inquiryPhone || null, message: inquiryMessage, status: 'new', created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      setInquiryStatus('success');
      setInquiryName(''); setInquiryEmail(''); setInquiryPhone(''); setInquiryMessage('');
    } catch (error: any) {
      setInquiryStatus('error');
      setInquiryErrorMessage(error?.message || '送信失敗');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen animate-fade-in overflow-x-hidden w-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-[10px] text-gray-400 mb-8 md:mb-12 tracking-widest uppercase">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/collections" className="hover:text-black transition-colors">Collections</Link>
          <span className="mx-2">/</span>
          <span className="text-black">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-4 lg:gap-6 items-start">
            {product.images && product.images.length > 0 && (
              <div className="w-full lg:w-24 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto scrollbar-hide lg:max-h-[80vh] lg:sticky lg:top-32">
                {product.images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)} className={`relative aspect-square w-20 lg:w-full flex-shrink-0 overflow-hidden border transition-all duration-300 ${selectedImage === idx ? 'border-black opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <FadeInImage src={img} alt="" className="w-full h-full object-cover" width={160} height={160} />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 w-full relative">
               <FadeInImage
                 src={product.images && product.images.length > 0 ? product.images[selectedImage] : (product.image || '')}
                 alt={product.title}
                 priority
                 width={1200}
                 height={1200}
                 className="w-full h-auto object-contain block"
               />
               {(() => {
                 // バリエーションが無効な場合はSOLD OUTを表示しない
                 if (!product?.hasVariants) {
                   return null;
                 }
                 const currentStock = product ? getStockForVariant(product, selectedOptions) : null;
                 const isOutOfStock = currentStock !== null && currentStock === 0;
                 return isOutOfStock ? <span className="absolute top-4 left-4 bg-primary text-white px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase z-10">Sold Out</span> : null;
               })()}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <h1 className="text-xl md:text-2xl font-medium text-primary leading-relaxed tracking-wide mb-4">{product.title}</h1>
              <div className="mb-8 border-b border-gray-100 pb-8">
                <span className="text-xl md:text-2xl font-serif text-primary block mb-1">¥{calculatedPrice.toLocaleString()}</span>
                <span className="text-xs text-gray-500 block">税込</span>
              </div>

              {/* Variants UI */}
              {product.hasVariants && (
                <div className="mb-8 space-y-6">
                   {product.variants_config && product.variants_config.length > 0 ? (
                     // 新しいConfig形式
                     product.variants_config.map(type => (
                       <div key={type.id}>
                         <label className="block text-sm text-gray-600 mb-2">{type.name}</label>
                         <div className="flex flex-wrap gap-2">
                           {type.options.map(option => (
                             <button 
                               key={option.id}
                               onClick={() => handleOptionChange(type.id, option.id)}
                               className={`px-4 py-2 border text-sm transition-colors ${
                                 selectedOptions[type.id] === option.id
                                   ? 'border-black bg-black text-white'
                                   : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white hover:text-black'
                               }`}
                             >
                               {option.value}
                               {option.priceAdjustment !== 0 && (
                                 <span className="ml-1 text-xs opacity-80">
                                   ({option.priceAdjustment > 0 ? '+' : ''}{option.priceAdjustment}円)
                                 </span>
                               )}
                             </button>
                           ))}
                         </div>
                       </div>
                     ))
                   ) : (
                     // 旧形式 (Legacy)
                     product.variants && product.variants.length > 0 && (
                       <div>
                         <label className="block text-sm text-gray-600 mb-2">種類</label>
                         <div className="flex flex-wrap gap-2">
                           {product.variants.map(v => (
                             <button 
                               key={v}
                               onClick={() => handleLegacyOptionChange(v)}
                               className={`px-4 py-2 border text-sm transition-colors ${
                                 selectedOptions['legacy'] === v
                                   ? 'border-black bg-black text-white'
                                   : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white hover:text-black'
                               }`}
                             >
                               {v}
                             </button>
                           ))}
                         </div>
                       </div>
                     )
                   )}
                </div>
              )}

              {(() => {
                // バリエーションが無効な場合は在庫チェックをスキップ
                if (!product?.hasVariants) {
                  return (
                    <div className="flex items-center gap-2 mb-8">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-sm text-gray-600">在庫あり</span>
                    </div>
                  );
                }
                
                const currentStock = product ? getStockForVariant(product, selectedOptions) : null;
                const stockStatus = currentStock === null ? 'unlimited' : currentStock === 0 ? 'out' : currentStock <= 5 ? 'low' : 'available';
                const statusText = stockStatus === 'out' ? '在庫なし' : stockStatus === 'low' ? '在庫わずか' : stockStatus === 'unlimited' ? '在庫あり' : '在庫あり';
                const statusColor = stockStatus === 'out' ? 'bg-red-500' : stockStatus === 'low' ? 'bg-yellow-500' : 'bg-green-500';
                
                return (
                  <div className="flex items-center gap-2 mb-8">
                    <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
                    <span className="text-sm text-gray-600">{statusText}</span>
                  </div>
                );
              })()}

              {/* 販売期間の表示 */}
              {(product?.saleStartAt || product?.saleEndAt) && (
                <div className="mb-8">
                  <p className="text-sm text-gray-600">
                    販売期間: {product.saleStartAt ? formatSaleDateTime(product.saleStartAt) : ''}{product.saleStartAt && product.saleEndAt ? ' ~ ' : ''}{product.saleEndAt ? formatSaleDateTime(product.saleEndAt) : ''}
                  </p>
                </div>
              )}

              <div className="space-y-4 mb-12">
                 {(() => {
                   // 販売期間外の場合は「販売期間外です」を表示
                   if (!isWithinSalesPeriod(product)) {
                     return (
                       <button disabled className="w-full py-4 text-sm tracking-widest uppercase bg-gray-200 text-gray-500 cursor-not-allowed">
                         販売期間外です
                       </button>
                     );
                   }
                   // バリエーションが無効な場合は在庫チェックをスキップ（常に選択可能）
                   if (!product?.hasVariants) {
                     return (
                       <>
                         <div className="flex items-center justify-between border border-gray-200 p-1 max-w-[140px] mb-6">
                            <button type="button" onClick={(e) => { 
                              e.preventDefault(); 
                              setQuantity(Math.max(1, quantity - 1));
                              setStockError('');
                            }} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black transition-colors">−</button>
                            <span className="text-sm font-serif w-8 text-center">{quantity}</span>
                            <button type="button" onClick={(e) => { 
                              e.preventDefault();
                              setStockError('');
                              setQuantity(quantity + 1);
                            }} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black transition-colors">+</button>
                         </div>
                         <LoadingButton 
                           onClick={() => {
                             if (product) {
                               setStockError('');
                               const variantString = getSelectedVariantString();
                               addToCart(product, quantity, variantString);
                               openCart();
                             }
                           }}
                           className="w-full py-4 text-sm tracking-widest uppercase bg-black text-white hover:bg-gray-800 transition-colors"
                         >
                           カートに追加
                         </LoadingButton>
                         {stockError && (
                           <p className="text-sm text-red-600 mt-2 text-center">{stockError}</p>
                         )}
                       </>
                     );
                   }
                   
                   const currentStock = product ? getStockForVariant(product, selectedOptions) : null;
                   const isOutOfStock = currentStock !== null && currentStock === 0;
                   
                   return (
                     <>
                       {!isOutOfStock && (
                         <div className="flex items-center justify-between border border-gray-200 p-1 max-w-[140px] mb-6">
                            <button type="button" onClick={(e) => { 
                              e.preventDefault(); 
                              setQuantity(Math.max(1, quantity - 1));
                              setStockError('');
                            }} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black transition-colors">−</button>
                            <span className="text-sm font-serif w-8 text-center">{quantity}</span>
                            <button type="button" onClick={(e) => { 
                              e.preventDefault();
                              setStockError('');
                              // 在庫チェック
                              const existingCartItem = cartItems.find(
                                item => item.product.id === product.id && item.variant === getSelectedVariantString()
                              );
                              const currentCartQuantity = existingCartItem?.quantity || 0;
                              const stockCheck = checkStockAvailability(
                                product,
                                selectedOptions,
                                quantity + 1,
                                currentCartQuantity
                              );
                              if (stockCheck.available) {
                                setQuantity(quantity + 1);
                              } else {
                                setStockError(stockCheck.message);
                              }
                            }} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black transition-colors">+</button>
                         </div>
                       )}
                       {isOutOfStock ? (
                         <button disabled className="w-full py-4 text-sm tracking-widest uppercase bg-gray-200 text-gray-400 cursor-not-allowed">SOLD OUT</button>
                       ) : (
                         <>
                           <LoadingButton 
                             onClick={() => {
                               if (product) {
                                 setStockError('');
                                 const variantString = getSelectedVariantString();
                                 
                                 // カート内の既存数量を取得
                                 const existingCartItem = cartItems.find(
                                   item => item.product.id === product.id && item.variant === variantString
                                 );
                                 const currentCartQuantity = existingCartItem?.quantity || 0;
                                 
                                 // 在庫チェック
                                 const stockCheck = checkStockAvailability(
                                   product,
                                   selectedOptions,
                                   quantity,
                                   currentCartQuantity
                                 );
                                 
                                 if (!stockCheck.available) {
                                   setStockError(stockCheck.message);
                                   return;
                                 }
                                 
                                 addToCart(product, quantity, variantString, calculatedPrice, selectedOptions);
                                 openCart();
                               }
                             }}
                             className="w-full py-4 text-sm tracking-widest bg-white text-black border border-black hover:bg-gray-50 transition-colors group relative"
                           >
                             <div className="flex items-center justify-center w-full">
                               <span>カートに追加する</span>
                               <span className="absolute right-4 text-lg transition-transform duration-300 group-hover:translate-x-1">→</span>
                             </div>
                           </LoadingButton>
                           {stockError && (
                             <p className="text-sm text-red-600 mt-2 text-center">{stockError}</p>
                           )}
                         </>
                       )}
                     </>
                   );
                 })()}
              </div>

              <div className="border-t border-gray-200 mt-8">
                <div className="py-4 border-b border-gray-200">
                  <div className="flex justify-end items-center cursor-pointer py-2" onClick={() => toggleAccordion('desc')}>
                    <IconChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeAccordion === 'desc' ? 'rotate-180' : ''}`} />
                  </div>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeAccordion === 'desc' ? 'max-h-[5000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="text-sm leading-loose text-gray-600 font-light space-y-4 pb-4">
                      <h3 className="font-medium text-gray-900">【{product.title}】</h3>
                      {product.description && product.description.trim() ? <div className="whitespace-pre-wrap">{product.description}</div> : <p className="text-gray-400">商品説明がありません。</p>}
                    </div>
                  </div>
                </div>
                <div className="py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center cursor-pointer py-2" onClick={() => toggleAccordion('shipping')}>
                    <span className="text-sm font-medium tracking-wider">送料についてはこちらから</span>
                    <IconChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeAccordion === 'shipping' ? 'rotate-180' : ''}`} />
                  </div>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeAccordion === 'shipping' ? 'max-h-[200px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="pb-4"><Link href="/legal" className="text-sm text-gray-600 hover:text-black underline transition-colors">特定商取引法に基づく表記</Link></div>
                  </div>
                </div>
                <div className="py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center cursor-pointer py-2" onClick={() => toggleAccordion('inquiry')}>
                    <span className="text-sm font-medium tracking-wider">お問い合わせはこちらから</span>
                    <IconChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeAccordion === 'inquiry' ? 'rotate-180' : ''}`} />
                  </div>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeAccordion === 'inquiry' ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <form onSubmit={handleInquirySubmit} className="space-y-4 pb-4">
                      {inquiryStatus === 'success' && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-center"><p className="text-xs text-green-700">お問い合わせを受け付けました。</p></div>}
                      {inquiryStatus === 'error' && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-center"><p className="text-xs text-red-700">{inquiryErrorMessage}</p></div>}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1"><label htmlFor="inquiry-name" className="text-xs font-medium text-gray-700">お名前</label><input type="text" id="inquiry-name" value={inquiryName} onChange={(e) => setInquiryName(e.target.value)} className="border border-gray-200 p-2 text-sm focus:border-black outline-none transition-colors bg-white" required /></div>
                        <div className="flex flex-col gap-1"><label htmlFor="inquiry-email" className="text-xs font-medium text-gray-700">メールアドレス</label><input type="email" id="inquiry-email" value={inquiryEmail} onChange={(e) => setInquiryEmail(e.target.value)} className="border border-gray-200 p-2 text-sm focus:border-black outline-none transition-colors bg-white" required /></div>
                      </div>
                      <div className="flex flex-col gap-1"><label htmlFor="inquiry-phone" className="text-xs font-medium text-gray-700">お電話番号</label><input type="tel" id="inquiry-phone" value={inquiryPhone} onChange={(e) => setInquiryPhone(e.target.value)} className="border border-gray-200 p-2 text-sm focus:border-black outline-none transition-colors bg-white w-full" /></div>
                      <div className="flex flex-col gap-1"><label htmlFor="inquiry-message" className="text-xs font-medium text-gray-700">内容</label><textarea id="inquiry-message" rows={4} value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} className="border border-gray-200 p-2 text-sm focus:border-black outline-none transition-colors bg-white w-full resize-y" required /></div>
                      <div className="pt-2"><button type="submit" disabled={submittingInquiry} className="bg-black text-white px-6 py-2 text-xs tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{submittingInquiry ? '送信中...' : '送信'}</button></div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        {allProducts.length > 0 && (
          <div className="mt-32 border-t border-gray-100 pt-16">
            <h3 className="text-center text-lg font-serif tracking-[0.2em] mb-12">RECOMMEND</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {allProducts.filter(p => p.id !== product.id).slice(0, 4).map(rel => (
                 <Link key={rel.id} href={`/products/${rel.handle}`} className="group block">
                      <div className="aspect-square bg-[#f4f4f4] overflow-hidden mb-3 relative">
                        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                          <FadeInImage src={rel.image} alt={rel.title} className="w-full h-full" width={400} height={400} />
                        </div>
                      </div>
                      <h4 className="text-xs text-gray-600 line-clamp-1 group-hover:text-black">{rel.title}</h4>
                      <p className="text-xs font-serif mt-1">¥{rel.price.toLocaleString()}</p>
                 </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
