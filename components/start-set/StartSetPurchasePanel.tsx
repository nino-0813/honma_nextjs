'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
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

export default function StartSetPurchasePanel({ product }: { product: Product }) {
  const { addToCart, openCart, cartItems } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [stockError, setStockError] = useState('');
  const [isFirstPurchase, setIsFirstPurchase] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.variants_config?.forEach((type) => {
      if (type.options[0]) initial[type.id] = type.options[0].id;
    });
    if (!product.variants_config?.length && product.variants?.[0]) initial.legacy = product.variants[0];
    return initial;
  });

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

  useEffect(() => { if (isFirstPurchase) setQuantity(1); }, [isFirstPurchase]);

  const basePrice = useMemo(() => {
    const adjustment = product.variants_config?.reduce((sum, type) => {
      const option = type.options.find((item) => item.id === selectedOptions[type.id]);
      return sum + (option?.priceAdjustment || 0);
    }, 0) || 0;
    return product.price + adjustment;
  }, [product, selectedOptions]);
  const calculatedPrice = isFirstPurchase ? Math.round(basePrice * 0.9) : basePrice;

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
        <p className="mb-3 text-sm text-yuunagi-ink">スタートセット</p>
        <h2 className="mb-4 text-2xl font-medium leading-relaxed tracking-wide text-primary md:text-3xl">3種食べ比べセット</h2>
        <p className="mb-7 text-sm leading-loose text-gray-600">
          どのお米から始めよう。そんな迷いごと楽しめる、3品種の小さな食べ比べセットです。
        </p>

        <div className="mb-6 border border-gray-200 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-medium text-white">{isFirstPurchase ? '初回 10%OFF' : '2回目以降'}</span>
          </div>
          <p className="text-3xl font-serif font-semibold text-primary tabular-nums">
            ¥{calculatedPrice.toLocaleString()}
            <span className="ml-1 text-xs text-gray-500">（税込）</span>
          </p>
          <p className="mt-1 text-[11px] text-gray-500">送料無料</p>
        </div>

        {product.hasVariants && (
          <div className="mb-6 space-y-5">
            {product.variants_config?.length ? product.variants_config.map((type) => (
              <fieldset key={type.id}>
                <legend className="mb-2 text-sm font-medium text-primary">{type.name}</legend>
                <div className="flex flex-wrap gap-2">
                  {type.options.filter((option) => !/分づき/.test(option.value)).map((option) => {
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

        {stockError && <p role="alert" className="mb-4 text-sm text-red-600">{stockError}</p>}
        <div className="flex items-center gap-3">
          <div className="flex min-h-12 items-center rounded-full border border-gray-300 px-1">
            <button type="button" aria-label="数量を1つ減らす" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-10 w-10 disabled:opacity-30">−</button>
            <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
            <button type="button" aria-label="数量を1つ増やす" disabled={isFirstPurchase} onClick={() => setQuantity((value) => value + 1)} className="h-10 w-10 disabled:opacity-30">＋</button>
          </div>
          <button type="button" disabled={disabled} onClick={handleAdd} className="min-h-12 flex-1 cursor-pointer rounded-full bg-yuunagi px-6 text-sm font-medium text-white transition-colors duration-200 hover:bg-yuunagi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yuunagi focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40">
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
