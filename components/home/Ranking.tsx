'use client';

import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { isProductPreorder, isProductSoldOut } from '@/lib/productStatus';
import SectionHeading from './SectionHeading';
import Carousel from './Carousel';

const MAX_ITEMS = 10;

/**
 * ランキング（ベースフードの「月間ランキング」に相当）。
 *
 * 実際の販売数は集計していないため、現状は管理画面の表示順（display_order）を
 * そのまま順位として使っている。売上ベースに変えるなら集計APIが必要。
 *
 * id="products" は告知ポップアップの表示トリガーに使われている。
 */
export default function Ranking() {
  const { products, loading } = useProducts();

  const items = [...products]
    .filter((p) => p.is_visible !== false)
    .sort((a, b) => (a.display_order ?? 999999) - (b.display_order ?? 999999))
    .slice(0, MAX_ITEMS);

  return (
    <section id="products" className="py-16 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <div className="mb-7">
          <SectionHeading en="Ranking" ja="人気の商品" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <Carousel ariaLabel="人気の商品">
            {items.map((p, i) => {
              const soldOut = isProductSoldOut(p);
              const preorder = isProductPreorder(p);
              return (
                <li key={p.id} className="snap-start shrink-0 w-[150px] md:w-[190px]">
                  <Link href={`/products/${p.handle || p.id}`} className="group block">
                    <div className="relative aspect-square overflow-hidden bg-dim">
                      <span className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {soldOut && (
                        <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs tracking-widest text-primary">
                          SOLD OUT
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-[12px] md:text-[13px] text-primary leading-relaxed line-clamp-2 group-hover:text-gray-600 transition-colors">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-[12px] text-gray-600 tabular-nums">
                      ¥{p.price.toLocaleString()}
                      <span className="text-[10px] text-gray-400">（税込）</span>
                    </p>
                    {preorder && (
                      <span className="mt-1 inline-block text-[10px] text-amber-700 border border-amber-600 rounded-sm px-1.5 py-0.5">
                        予約商品
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </Carousel>
        )}
      </div>
    </section>
  );
}
