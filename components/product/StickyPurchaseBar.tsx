'use client';

import { useEffect, useState } from 'react';

/**
 * 画面下に貼り付く購入バー。
 * 購入パネルが画面から外れたら出てくる。
 *
 * 数量の増減とカート追加をここで完結させ、追加できたらそのまま
 * チェックアウトへ進む。カート追加の処理そのものは商品ページ側の
 * addSelectionToCart に集約してあり、ここでは呼び出すだけ。
 */
export default function StickyPurchaseBar({
  title,
  price,
  image,
  note,
  quantity,
  onQuantityChange,
  onAddToCart,
  disabled = false,
  disabledLabel,
}: {
  title: string;
  price: number;
  image?: string;
  note?: string;
  /**
   * 数量とカート追加は任意。サーバーコンポーネントからは関数を渡せないため、
   * 省略した場合は数量の操作を出さず、ボタンも押せない状態で表示する。
   */
  quantity?: number;
  onQuantityChange?: (next: number) => void;
  /** 追加できたら true を返すこと。true のときだけチェックアウトへ進む */
  onAddToCart?: () => boolean;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  // カート追加の手段が渡されていなければ操作できない状態にする
  const interactive = typeof onAddToCart === 'function' && typeof onQuantityChange === 'function';
  const qty = quantity ?? 1;
  const isDisabled = disabled || !interactive;
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const target = document.getElementById('purchase-panel');
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const handleAdd = () => {
    if (busy || isDisabled || !onAddToCart) return;
    setBusy(true);
    try {
      // 在庫不足や定期購入のゲートで追加されなかった場合は遷移しない
      if (onAddToCart()) {
        window.location.href = '/checkout';
        return;
      }
      // 追加できなかった理由は購入パネル側に出るので、そこまで戻す
      const el = document.getElementById('purchase-panel');
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out-expo ${
        visible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      }`}
    >
      <div className="mx-auto max-w-[1100px] px-3 pb-3 md:px-4 md:pb-4">
        <div className="flex items-center gap-3 md:gap-4 rounded-full bg-white/95 backdrop-blur shadow-[0_6px_28px_-8px_rgba(0,0,0,0.28)] border border-gray-200 pl-3 pr-3 py-2.5">
          {image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={image} alt="" aria-hidden="true" className="hidden sm:block w-11 h-11 rounded-full object-cover shrink-0" />
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] md:text-[13px] text-primary">{title}</p>
            <p className="text-[13px] md:text-sm text-primary tabular-nums">
              ¥{price.toLocaleString()}
              <span className="text-[10px] text-gray-400 ml-1">税込</span>
              {note && <span className="ml-2 text-[10px] text-yuunagi-ink">{note}</span>}
            </p>
          </div>

          {/* 数量。操作手段が渡されているときだけ出す */}
          {interactive && (
          <div className="flex items-center gap-1 shrink-0 rounded-full border border-gray-200 px-1 py-0.5">
            <button
              type="button"
              onClick={() => onQuantityChange?.(Math.max(1, qty - 1))}
              aria-label="数量を1つ減らす"
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary transition-colors disabled:opacity-30"
              disabled={qty <= 1}
            >
              −
            </button>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={qty}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                onQuantityChange?.(Number.isNaN(v) ? 1 : Math.max(1, v));
              }}
              aria-label="数量"
              className="w-10 text-center text-sm tabular-nums bg-transparent outline-none focus-visible:outline-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => onQuantityChange?.(qty + 1)}
              aria-label="数量を1つ増やす"
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary transition-colors"
            >
              ＋
            </button>
          </div>
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={isDisabled || busy}
            className="shrink-0 rounded-full bg-yuunagi px-5 md:px-9 py-3 text-xs md:text-sm font-medium text-white hover:bg-yuunagi-ink transition-colors disabled:opacity-40 disabled:hover:bg-yuunagi"
          >
            {isDisabled ? (disabledLabel ?? 'カートに入れる') : busy ? '処理中…' : 'カートに入れる'}
          </button>
        </div>
      </div>
    </div>
  );
}
