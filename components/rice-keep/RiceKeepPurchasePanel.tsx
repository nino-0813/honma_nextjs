'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/types';
import { CartContext } from '@/providers/CartProvider';
import { checkStockAvailability } from '@/lib/supabase';
import { getRiceKeepKind, getRiceKeepPurchaseState } from '@/lib/riceKeepPurchase';

export default function RiceKeepPurchasePanel({ product }: { product: Product }) {
  const { cartItems, addToCart, openCart } = useContext(CartContext);
  const options = product.variants_config?.flatMap((group) =>
    group.options.map((option) => ({ ...option, groupId: group.id }))
  ).filter((option) => getRiceKeepKind(option.value)) ?? [];
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const state = useMemo(() => getRiceKeepPurchaseState(cartItems), [cartItems]);
  const selected = options.find((option) => option.id === selectedId);
  const kind = getRiceKeepKind(selected?.value);
  const remaining = kind === 'one' ? state.oneRemaining : kind === 'two' ? state.twoRemaining : 0;
  const disabled = !selected || remaining < 1 || quantity > remaining;
  const price = product.price + Number(selected?.priceAdjustment || 0);

  useEffect(() => {
    setQuantity((current) => Math.max(1, Math.min(current, Math.max(1, remaining))));
  }, [selectedId, remaining]);

  const buttonLabel = state.oneLimit + state.twoLimit === 0
    ? '対象商品がカートに入っていません'
    : remaining < 1
      ? `${selected?.value ?? '選択中の商品'}は上限に達しました`
      : 'カートに入れる';

  const handleAdd = () => {
    if (!selected || disabled) return;
    setError('');
    const variant = selected.value;
    const selectedOptions = { [selected.groupId]: selected.id };
    const existing = cartItems.find((item) => item.product.id === product.id && item.variant === variant);
    const stock = checkStockAvailability(product, selectedOptions, quantity, existing?.quantity || 0);
    if (!stock.available) {
      setError(stock.message);
      return;
    }
    addToCart(product, quantity, { variant, finalPrice: price, selectedOptions });
    openCart();
  };

  return (
    <div className="mt-10">
      <p className="mb-3 text-sm font-medium text-primary">枚数</p>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const optionKind = getRiceKeepKind(option.value);
          const optionRemaining = optionKind === 'one' ? state.oneRemaining : state.twoRemaining;
          return (
            <button key={option.id} type="button" onClick={() => setSelectedId(option.id)} className={`min-h-12 border px-3 py-3 text-sm ${selectedId === option.id ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-primary'}`}>
              {option.value}<span className="mt-1 block text-[11px] opacity-75">あと{optionRemaining}個</span>
            </button>
          );
        })}
      </div>
      <p className="mt-5 font-serif text-2xl">¥{price.toLocaleString()}<span className="ml-1 text-xs text-gray-500">（税込）</span></p>
      <p className="mt-3 text-xs leading-relaxed text-gray-600">対象のお米1個につき、対応するRicekeepを1個購入できます。</p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex w-fit items-center border border-gray-300">
        <button type="button" aria-label="数量を1つ減らす" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-12 w-12 disabled:opacity-30">−</button>
        <span className="w-12 text-center text-sm tabular-nums">{quantity}</span>
        <button type="button" aria-label="数量を1つ増やす" disabled={quantity >= remaining} onClick={() => setQuantity((value) => Math.min(remaining, value + 1))} className="h-12 w-12 disabled:opacity-30">＋</button>
      </div>
      <button type="button" disabled={disabled} onClick={handleAdd} className="mt-5 min-h-14 w-full rounded-full bg-primary px-5 text-sm text-white disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600">
        {buttonLabel}
      </button>
    </div>
  );
}
