'use client';

import { useContext, useEffect, useState } from 'react';
import type { Product } from '@/types';
import { CartContext } from '@/providers/CartProvider';
import { checkStockAvailability, supabase } from '@/lib/supabase';
import { isProductSoldOut } from '@/lib/productStatus';
import StickyPurchaseBar from '@/components/product/StickyPurchaseBar';

type MillingMethod = '白米' | '玄米';

export default function StartSetPurchasePanel({ product }: { product: Product }) {
  const { addToCart, openCart, cartItems } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [stockError, setStockError] = useState('');
  const [isFirstPurchase, setIsFirstPurchase] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [millingMethod, setMillingMethod] = useState<MillingMethod>('白米');

  useEffect(() => {
    let active = true;
    const checkHistory = async (accessToken?: string) => {
      setEligibilityLoading(true);
      if (!accessToken) {
        if (active) {
          setIsLoggedIn(false);
          // 未ログインのお客様には初回特典の内容を案内し、
          // ログイン後に購入履歴を確認して最終確定する。
          setIsFirstPurchase(true);
          setEligibilityLoading(false);
        }
        return;
      }
      setIsLoggedIn(true);
      try {
        const response = await fetch('/api/start-set-eligibility', {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        });
        const result = await response.json();
        if (active) setIsFirstPurchase(response.ok && result.eligible === true);
      } catch {
        if (active) setIsFirstPurchase(false);
      } finally {
        if (active) setEligibilityLoading(false);
      }
    };

    const loadCurrentUser = async () => {
      const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
      await checkHistory(data.session?.access_token);
    };
    void loadCurrentUser();
    const { data: authListener } = supabase?.auth.onAuthStateChange((_event, session) => {
      void checkHistory(session?.access_token);
    }) ?? { data: { subscription: null } };
    return () => {
      active = false;
      authListener.subscription?.unsubscribe();
    };
  }, [product.id]);

  useEffect(() => { setQuantity(1); }, [isFirstPurchase]);

  const basePrice = product.price;
  const calculatedPrice = isFirstPurchase ? Math.round(basePrice * 0.9) : basePrice;

  const selectedVariant = `${millingMethod}3個セット（コシヒカリ・亀の尾・にこまる）`;
  const millingVariation = product.variants_config?.find((type) =>
    type.options.some((option) => option.value === millingMethod)
  );
  const millingOption = millingVariation?.options.find((option) => option.value === millingMethod);
  const selectedOptions = millingVariation && millingOption
    ? { [millingVariation.id]: millingOption.id }
    : {};

  const soldOut = isProductSoldOut(product);
  const now = Date.now();
  const outsideSalesPeriod = Boolean(
    (product.saleStartAt && new Date(product.saleStartAt).getTime() > now) ||
    (product.saleEndAt && new Date(product.saleEndAt).getTime() < now)
  );
  const disabled = soldOut || outsideSalesPeriod;

  const addSelectionToCart = () => {
    if (eligibilityLoading) return false;
    if (!isLoggedIn) {
      window.location.href = '/account';
      return false;
    }
    if (disabled) return false;
    setStockError('');
    const existing = cartItems.find((item) => item.product.id === product.id && item.variant === selectedVariant);
    const result = checkStockAvailability(product, selectedOptions, quantity, existing?.quantity || 0);
    if (!result.available) {
      setStockError(result.message);
      return false;
    }
    addToCart({
      ...product,
      title: '３品種お試しセット',
      // 基本のヤマト60サイズ送料は維持し、特典対象者のみ送料0円にする。
      isFreeShipping: isFirstPurchase,
    }, quantity, {
      variant: selectedVariant,
      finalPrice: calculatedPrice,
      selectedOptions,
    });
    return true;
  };

  const handleAdd = () => {
    if (addSelectionToCart()) openCart();
  };

  return (
    <>
      <div id="purchase-panel">
        <h2 className="mb-2 text-2xl font-medium leading-relaxed tracking-wide text-primary md:text-3xl">
          ３品種お試しセット
        </h2>
        <div className="mb-7 text-sm leading-relaxed text-gray-600">
          <p>内容：2合×3個</p>
          <p className="mt-3 whitespace-nowrap text-[10px] tracking-[0.04em] text-gray-500 md:text-[11px] md:tracking-[0.06em]">
            従来コシヒカリ ／ 亀の尾 ／ にこまる
          </p>
        </div>

        <div className="mb-6 border border-gray-200 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`rounded-full px-3 py-1 text-[10px] font-medium tracking-wide text-white ${isFirstPurchase ? 'bg-[#e87538]' : 'bg-primary'}`}>
              {eligibilityLoading
                ? '特典の対象を確認中'
                : isFirstPurchase
                  ? '初回 送料無料＆10%OFF'
                  : '通常価格・通常送料'}
            </span>
          </div>
          {isFirstPurchase ? (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-serif text-base text-gray-400 line-through tabular-nums">¥{basePrice.toLocaleString()}</span>
              <span className="font-serif text-3xl font-semibold text-primary tabular-nums">¥{calculatedPrice.toLocaleString()}</span>
              <span className="text-xs text-gray-500">（税込）</span>
            </div>
          ) : (
            <p className="font-serif text-3xl font-semibold text-primary tabular-nums">
              ¥{calculatedPrice.toLocaleString()}<span className="ml-1 text-xs text-gray-500">（税込）</span>
            </p>
          )}
          {!eligibilityLoading && !isLoggedIn && (
            <p className="mt-3 text-[11px] leading-relaxed text-gray-500">初回購入特典は、ログイン後に購入履歴を確認して自動適用します。</p>
          )}
        </div>

        <fieldset className="mb-6">
          <legend className="mb-3 text-sm font-medium text-primary">精米方法</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['白米', '玄米'] as MillingMethod[]).map((method) => {
              const selected = millingMethod === method;
              return (
                <button
                  key={method}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setMillingMethod(method)}
                  className={`min-h-12 border px-4 py-3 text-sm transition-colors ${selected ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-primary hover:border-primary'}`}
                >
                  {method}（3個セット）
                </button>
              );
            })}
          </div>
        </fieldset>

        {stockError && <p role="alert" className="mb-4 text-sm text-red-600">{stockError}</p>}
        <div className="flex items-center gap-3">
          <div className="flex min-h-12 items-center rounded-full border border-gray-300 px-1">
            <button type="button" aria-label="数量を1つ減らす" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-10 w-10 disabled:opacity-30">−</button>
            <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
            <button type="button" aria-label="数量を1つ増やす" disabled onClick={() => setQuantity(1)} className="h-10 w-10 disabled:opacity-30">＋</button>
          </div>
          <button type="button" disabled={disabled || eligibilityLoading} onClick={handleAdd} className="min-h-12 flex-1 cursor-pointer rounded-full bg-[#e87538] px-6 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#cf5f27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e87538] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40">
            {soldOut ? '売り切れ' : outsideSalesPeriod ? '販売期間外' : eligibilityLoading ? '購入条件を確認中' : !isLoggedIn ? 'ログインして特典を確認' : 'カートに入れる'}
          </button>
        </div>

      </div>
      <StickyPurchaseBar
        title="３品種お試しセット"
        price={calculatedPrice}
        image={product.images?.[0] || product.image}
        quantity={quantity}
        onQuantityChange={(next) => setQuantity(Math.max(1, next))}
        onAddToCart={addSelectionToCart}
        disabled={disabled || eligibilityLoading}
        disabledLabel={soldOut ? '売り切れ' : outsideSalesPeriod ? '販売期間外' : '購入条件を確認中'}
      />
    </>
  );
}
