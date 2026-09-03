'use client';

import { useContext, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/types';
import { CartContext } from '@/providers/CartProvider';
import { checkStockAvailability } from '@/lib/supabase';
import { isProductSoldOut } from '@/lib/productStatus';
import StickyPurchaseBar from '@/components/product/StickyPurchaseBar';

const BENEFITS = [
  '3品種を少量ずつ、食べ比べていただけます',
  '通常より20%OFF でお試しいただけます',
  '定期便で使える初回クーポン（送料無料・20%OFF）つき',
  'お届けに合わせて出荷直前に精米します',
];

const VARIETIES = [
  { name: 'コシヒカリ', image: '/images/home/collections/collection_koshihikari_800.webp', href: '/collections/rice/koshihikari' },
  { name: '亀の尾', image: '/images/home/collections/collection_kamenoo_800.webp', href: '/collections/rice/kamenoo' },
  { name: 'にこまる', image: '/images/renewal/lineup/rice.webp', href: '/collections/rice/nikomaru' },
];

export default function StartSetPurchasePanel({ product }: { product: Product }) {
  const { addToCart, openCart, cartItems } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [stockError, setStockError] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.variants_config?.forEach((type) => {
      if (type.options[0]) initial[type.id] = type.options[0].id;
    });
    if (!product.variants_config?.length && product.variants?.[0]) initial.legacy = product.variants[0];
    return initial;
  });

  const calculatedPrice = useMemo(() => {
    const adjustment = product.variants_config?.reduce((sum, type) => {
      const option = type.options.find((item) => item.id === selectedOptions[type.id]);
      return sum + (option?.priceAdjustment || 0);
    }, 0) || 0;
    return product.price + adjustment;
  }, [product, selectedOptions]);

  const selectedVariant = useMemo(() => {
    if (!product.hasVariants) return undefined;
    if (product.variants_config?.length) {
      return product.variants_config
        .map((type) => type.options.find((item) => item.id === selectedOptions[type.id])?.value)
        .filter(Boolean)
        .join(' / ');
    }
    return selectedOptions.legacy || product.variants?.[0];
  }, [product, selectedOptions]);

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
    if (product.hasVariants) {
      const existing = cartItems.find((item) => item.product.id === product.id && item.variant === selectedVariant);
      const result = checkStockAvailability(product, selectedOptions, quantity, existing?.quantity || 0);
      if (!result.available) {
        setStockError(result.message);
        return false;
      }
    }
    addToCart(product, quantity, {
      variant: selectedVariant,
      finalPrice: calculatedPrice,
      selectedOptions: product.hasVariants ? selectedOptions : undefined,
    });
    return true;
  };

  const handleAdd = () => {
    if (addSelectionToCart()) openCart();
  };

  return (
    <>
      <div id="purchase-panel">
        <p className="text-xs tracking-[0.15em] text-yuunagi-ink mb-2">スタートセット</p>
        <h1 className="text-xl md:text-2xl font-medium text-primary leading-relaxed tracking-wide mb-3">{product.title}</h1>
        {product.description && (
          <p className="text-[13px] leading-relaxed whitespace-pre-line text-gray-600 mb-6">{product.description}</p>
        )}

        <div className="rounded-sm bg-yuunagi-soft/60 p-4 md:p-5 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="rounded-sm bg-yuunagi px-2 py-1 text-[10px] font-medium text-white">初回限定</span>
          </div>
          <p className="text-3xl font-serif font-semibold text-primary tabular-nums">
            ¥{calculatedPrice.toLocaleString()}
            <span className="ml-1 text-xs text-gray-500">（税込）</span>
          </p>
          <p className="mt-1 text-[11px] text-gray-500">{product.isFreeShipping ? '送料無料' : '＋送料'}</p>
        </div>

        {product.hasVariants && (
          <div className="mb-6 space-y-5">
            {product.variants_config?.length ? product.variants_config.map((type) => (
              <fieldset key={type.id}>
                <legend className="mb-2 text-sm font-medium text-primary">{type.name}</legend>
                <div className="flex flex-wrap gap-2">
                  {type.options.map((option) => {
                    const selected = selectedOptions[type.id] === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedOptions((current) => ({ ...current, [type.id]: option.id }))}
                        className={`min-h-11 rounded-full border px-4 py-2 text-sm transition-colors ${selected ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-primary hover:border-primary'}`}
                      >
                        {option.value}{option.priceAdjustment ? `（${option.priceAdjustment > 0 ? '+' : ''}¥${option.priceAdjustment.toLocaleString()}）` : ''}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )) : (
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-primary">種類</legend>
                <div className="flex flex-wrap gap-2">
                  {product.variants?.map((variant) => (
                    <button key={variant} type="button" aria-pressed={selectedOptions.legacy === variant} onClick={() => setSelectedOptions({ legacy: variant })} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${selectedOptions.legacy === variant ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-primary'}`}>{variant}</button>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        )}

        <div className="border-2 border-gray-200 rounded-sm p-4 md:p-5 mb-6">
          <p className="text-sm font-medium text-primary mb-4">このセットでできること</p>
          <ul className="flex flex-col gap-2.5">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-[12px] md:text-[13px] text-gray-600 leading-relaxed">
                <svg className="shrink-0 mt-0.5 w-3.5 h-3.5 text-yuunagi" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8.5l3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {stockError && <p role="alert" className="mb-4 text-sm text-red-600">{stockError}</p>}
        <div className="flex items-center gap-3">
          <div className="flex min-h-12 items-center rounded-full border border-gray-300 px-1">
            <button type="button" aria-label="数量を1つ減らす" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-10 w-10 disabled:opacity-30">−</button>
            <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
            <button type="button" aria-label="数量を1つ増やす" onClick={() => setQuantity((value) => value + 1)} className="h-10 w-10">＋</button>
          </div>
          <button type="button" disabled={disabled} onClick={handleAdd} className="min-h-12 flex-1 rounded-full bg-yuunagi px-6 text-sm font-medium text-white transition-colors hover:bg-yuunagi-ink disabled:cursor-not-allowed disabled:opacity-40">
            {soldOut ? '売り切れ' : outsideSalesPeriod ? '販売期間外' : 'カートに入れる'}
          </button>
        </div>

        <div className="mt-8">
          <p className="text-sm text-primary mb-3">セット内容：3品種</p>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
            {VARIETIES.map((variety) => (
              <Link key={variety.name} href={variety.href} className="shrink-0 w-[104px] border border-gray-200 rounded-sm overflow-hidden hover:border-gray-400 transition-colors">
                <span className="block aspect-square bg-dim overflow-hidden"><img src={variety.image} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-cover" /></span>
                <span className="block px-2 py-2 text-[12px] text-primary">{variety.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <StickyPurchaseBar title={product.title} price={calculatedPrice} image={product.images?.[0] || product.image} quantity={quantity} onQuantityChange={setQuantity} onAddToCart={addSelectionToCart} disabled={disabled} disabledLabel={soldOut ? '売り切れ' : '販売期間外'} />
    </>
  );
}
