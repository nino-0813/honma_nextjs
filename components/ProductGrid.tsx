'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { FadeInImage } from '@/components/UI';
import { isProductPreorder, isProductSoldOut } from '@/lib/productStatus';

const ProductGrid = () => {
  const { products, loading, error } = useProducts();
  // useProductsで既にソートされているが、念のため再度ソート
  // display_orderが小さい順、nullは最後
  const sortedProducts = [...products].sort((a, b) => {
    const orderA = a.display_order ?? 999999;
    const orderB = b.display_order ?? 999999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return 0;
  });
  const displayProducts = sortedProducts.slice(0, 9);

  return (
    <section className="bg-white px-6 py-24 md:px-12 md:py-36">
      <div className="mx-auto max-w-[1180px]">
      <div className="mb-14 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-hekishoku">IKEVEGE ONLINE STORE</p>
        <h2 className="font-serif text-2xl font-semibold tracking-[0.14em] text-primary md:text-4xl">佐渡から、お届けします。</h2>
      </div>
      
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">商品を読み込み中...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-sm text-gray-500">商品の読み込みに失敗しました</p>
          </div>
        </div>
      )}

      {!loading && !error && displayProducts.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-sm text-gray-500">商品がありません</p>
          </div>
        </div>
      )}

      {!loading && !error && displayProducts.length > 0 && (
        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-20">
          {displayProducts.map((product, index) => {
            const productPath = `/products/${product.handle || product.id}`;
            const soldOut = isProductSoldOut(product);
            const preorder = !soldOut && isProductPreorder(product); // 在庫切れ優先
            return (
          <Link key={product.id} href={productPath} className="group flex flex-col opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 70}ms` }}>
              <div className="relative mb-5 aspect-square overflow-hidden rounded-[18px] bg-white shadow-[0_12px_35px_rgba(48,62,45,0.06)]">
                <div className="absolute top-2 left-2 z-20 flex flex-col gap-2">
                  {soldOut && (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-500 text-center text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                      Sold Out
                    </span>
                  )}
                </div>

                {/* Main Image with FadeIn (素の public URL のみ使用) */}
                <div className="absolute inset-0 z-10 bg-[#f9f9f9] transition-opacity duration-700 ease-in-out group-hover:opacity-0">
                  <FadeInImage
                    src={product.images && product.images.length > 0 ? product.images[0] : (product.image || '')}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    priority={index < 8}
                    width={320}
                    height={320}
                  />
                </div>
                
                {/* Secondary Image (Hover) - 透過画像でも背景が透けないよう不透明背景を指定 */}
                <div className="absolute inset-0 z-0 bg-[#f9f9f9] transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out">
                   <FadeInImage
                     src={product.images && product.images.length > 1 ? product.images[1] : (product.images && product.images.length > 0 ? product.images[0] : (product.image || ''))}
                     alt={product.title}
                     className="w-full h-full object-cover"
                     width={320}
                     height={320}
                   />
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 text-left">
                <h3 className="min-h-[2.8em] line-clamp-2 text-base font-semibold leading-relaxed text-primary transition-colors group-hover:text-hekishoku">
                  {product.title}
                </h3>
                <p className="flex items-center gap-2 font-serif text-base font-semibold tracking-wide text-gray-900">
                  <span>
                    ¥{product.price.toLocaleString()} {product.title.includes('〜') ? '〜' : ''}
                  </span>
                  {preorder && (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-sky-700 border border-sky-700 px-2 py-0.5">
                      予約商品
                    </span>
                  )}
                </p>
              </div>
          </Link>
          );
          })}
        </div>
      )}

      {!loading && !error && displayProducts.length > 0 && (
        <div className="mt-16 text-center">
           <Link href="/collections" className="inline-flex min-h-14 items-center rounded-full bg-hekishoku px-10 py-4 text-xs font-medium tracking-[0.16em] text-white transition-colors hover:bg-primary">
             すべての商品を見る
           </Link>
        </div>
      )}
      </div>
    </section>
  );
};

export default ProductGrid;
