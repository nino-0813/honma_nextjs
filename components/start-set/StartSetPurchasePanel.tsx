'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/types';
import { CartContext } from '@/providers/CartProvider';
import { checkStockAvailability, getOrders, supabase } from '@/lib/supabase';
import { isProductSoldOut } from '@/lib/productStatus';
import StickyPurchaseBar from '@/components/product/StickyPurchaseBar';

const VARIETIES = [
  { name: 'コシヒカリ', image: '/images/home/collections/collection_koshihikari_800.webp', href: '/collections/rice/koshihikari' },
  { name: '亀の尾', image: '/images/home/collections/collection_kamenoo_800.webp', href: '/collections/rice/kamenoo' },
  { name: 'にこまる', image: '/images/renewal/lineup/rice.webp', href: '/collections/rice/nikomaru' },
];

type MillingMethod = '白米' | '玄米';

export default function StartSetPurchasePanel({ product }: { product: Product }) {
  const { addToCart, openCart, cartItems } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [stockError, setStockError] = useState('');
  const [isFirstPurchase, setIsFirstPurchase] = useState(true);
  const [millingMethod, setMillingMethod] = useState<MillingMethod>('白米');

  useEffect(() => {
    let active = true;
    const checkHistory = async () => {
      const { data } = await supabase?.auth.getUser() ?? { data: { user: null } };
      if (!data.user) return;
      const orders = await getOrders(data.user.id);
      const boughtStartSet = orders.some((order) => order.order_items?.some((item) => item.product_id === product.id || item.product?.handle === 'start-set'));
      if (active) setIsFirstPurchase(!boughtStartSet);
    };
    void checkHistory();
    return () => { active = false; };
  }, [product.id]);

  useEffect(() => { setQuantity(1); }, [isFirstPurchase]);

  const basePrice = product.price;
  const calculatedPrice = isFirstPurchase ? Math.round(basePrice * 0.9) : basePrice;

  const selectedVariant = `${millingMethod}3個セット（コシヒカリ・亀の尾・にこまる）`;

  const soldOut = isProductSoldOut(product);
  const now = Date.now();
  const outsideSalesPeriod = Boolean(
    (product.saleStartAt && new Date(product.saleStartAt).getTime() > now) ||
    (product.saleEndAt && new Date(product.saleEndAt).getTime() < now)
  );
  const disabled = soldOut || outsideSalesPeriod;

  const addSelectionToCart = () => {
    if (disabled) return false;
    setStockError('');
    const existing = cartItems.find((item) => item.product.id === product.id && item.variant === selectedVariant);
    const result = checkStockAvailability(product, {}, quantity, existing?.quantity || 0);
    if (!result.available) {
      setStockError(result.message);
      return false;
    }
    addToCart({ ...product, title: 'お試しセット' }, quantity, {
      variant: selectedVariant,
      finalPrice: calculatedPrice,
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
          お試しセット
        </h2>
        <p className="mb-7 text-sm leading-relaxed text-gray-600">内容：イケベジのお米３種 ２合×３個</p>

        <div className="mb-6 border border-gray-200 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-medium tracking-wide text-white">
              {isFirstPurchase ? '初回 送料無料＆10%OFF' : '2回目以降 送料無料'}
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
          <p className="mt-1 text-[11px] text-gray-500">送料無料</p>
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
          <p className="mt-2 text-[11px] leading-relaxed text-gray-500">コシヒカリ・亀の尾・にこまるの3品種すべてが、選択した精米方法になります。</p>
        </fieldset>

        {stockError && <p role="alert" className="mb-4 text-sm text-red-600">{stockError}</p>}
        <div className="flex items-center gap-3">
          <div className="flex min-h-12 items-center rounded-full border border-gray-300 px-1">
            <button type="button" aria-label="数量を1つ減らす" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-10 w-10 disabled:opacity-30">−</button>
            <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
            <button type="button" aria-label="数量を1つ増やす" disabled onClick={() => setQuantity(1)} className="h-10 w-10 disabled:opacity-30">＋</button>
          </div>
          <button type="button" disabled={disabled} onClick={handleAdd} className="min-h-12 flex-1 cursor-pointer rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors duration-200 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40">
            {soldOut ? '売り切れ' : outsideSalesPeriod ? '販売期間外' : 'カートに入れる'}
          </button>
        </div>

        <div className="mt-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {VARIETIES.map((variety) => (
              <div key={variety.name} className="overflow-hidden border border-gray-200 bg-white">
                <Link href={variety.href} className="block aspect-square overflow-hidden bg-dim">
                  <img src={variety.image} alt={`${variety.name}のお米`} loading="lazy" className="h-full w-full object-cover" />
                </Link>
                <div className="p-3">
                  <Link href={variety.href} className="text-[12px] text-primary hover:underline">{variety.name}</Link>
                  <p className="mt-1 text-[11px] text-gray-500">{millingMethod}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StickyPurchaseBar title="お試しセット" price={calculatedPrice} image={product.images?.[0] || product.image} quantity={1} onQuantityChange={() => setQuantity(1)} onAddToCart={addSelectionToCart} disabled={disabled} disabledLabel={soldOut ? '売り切れ' : '販売期間外'} />
    </>
  );
}
