'use client';

import { useState } from 'react';

/**
 * 商品画像。サムネイルで選んだ一枚だけを大きく表示する。
 * 横長の画像ストリップを使わないことで、購入情報との位置関係を安定させる。
 */
export default function ProductGallery({
  images,
  alt,
  soldOut = false,
}: {
  images: string[];
  alt: string;
  soldOut?: boolean;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="w-full flex flex-col-reverse lg:flex-row gap-4 lg:gap-5 items-start">
      {/* サムネイル列 */}
      {images.length > 1 && (
        <div className="w-full lg:w-20 flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto scrollbar-hide lg:max-h-[58vh] shrink-0">
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`画像${i + 1}を表示`}
              className={`relative aspect-square w-16 lg:w-full shrink-0 overflow-hidden border transition-all duration-300 ${
                active === i ? 'border-hekishoku opacity-100' : 'border-transparent opacity-55 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* 選択中の画像だけを大きく表示する */}
      <div className="flex-1 w-full min-w-0">
        <div className="relative">
          <div className="aspect-square max-h-[70vh] overflow-hidden bg-dim">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[active]} alt={alt} className="h-full w-full object-cover" />
          </div>
          {soldOut && (
            <span className="absolute top-4 left-4 bg-primary text-white px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase z-10">
              Sold Out
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
