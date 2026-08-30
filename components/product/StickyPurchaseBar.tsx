'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 画面下に貼り付く購入バー。
 * ベースフードの商品ページと同じく、購入ボタンが画面から外れたら出てくる。
 *
 * 決済ロジックには触れず、押すと購入パネルまで戻す役割だけを持つ。
 */
export default function StickyPurchaseBar({
  title,
  price,
  image,
  note,
}: {
  title: string;
  price: number;
  image?: string;
  note?: string;
}) {
  const [visible, setVisible] = useState(false);
  const raf = useRef<number>();

  useEffect(() => {
    // 購入パネル（カートに追加ボタン）を見張り、画面外に出たらバーを出す
    const target = document.getElementById('purchase-panel');
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const backToPanel = () => {
    const el = document.getElementById('purchase-panel');
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 120;
    cancelAnimationFrame(raf.current ?? 0);
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      }`}
    >
      <div className="mx-auto max-w-[1100px] px-4 pb-4">
        <div className="flex items-center gap-4 rounded-full bg-white/95 backdrop-blur shadow-[0_6px_28px_-8px_rgba(0,0,0,0.28)] border border-gray-200 pl-3 pr-3 py-2.5">
          {image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={image}
              alt=""
              aria-hidden="true"
              className="hidden sm:block w-11 h-11 rounded-full object-cover shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs md:text-[13px] text-primary">{title}</p>
            <p className="text-[13px] md:text-sm text-primary tabular-nums">
              ¥{price.toLocaleString()}
              <span className="text-[10px] text-gray-400 ml-1">税込</span>
              {note && <span className="ml-2 text-[10px] text-yuunagi-ink">{note}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={backToPanel}
            className="shrink-0 rounded-full bg-yuunagi px-6 md:px-9 py-3 text-xs md:text-sm font-medium text-white hover:bg-yuunagi-ink transition-colors"
          >
            数量を選ぶ
          </button>
        </div>
      </div>
    </div>
  );
}
