'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { FadeInImage } from '@/components/UI';

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
  const displayProducts = sortedProducts.slice(0, 8);

  return (
    <section className="py-8 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <p className="text-xs font-serif text-gray-500 mb-2 tracking-[0.2em] uppercase">IKEVEGE online</p>
        <h3 className="text-xl font-serif uppercase tracking-[0.1em] border-b border-gray-800 inline-block pb-0.5 text-black">ALL ITEM</h3>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
          {displayProducts.map((product, index) => {
            const productPath = `/products/${product.handle || product.id}`;
            return (
          <Link key={product.id} href={productPath} className="group flex flex-col opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="relative aspect-square overflow-hidden bg-[#f9f9f9] mb-4">
                <div className="absolute top-2 left-2 z-20 flex flex-col gap-2">
                  {product.soldOut && (
                    <span className="bg-primary text-white px-3 py-1 text-[10px] font-bold tracking-wider uppercase shadow-sm">
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
              <div className="flex-1 flex flex-col gap-2 text-center">
                <h3 className="text-sm font-medium text-primary leading-relaxed group-hover:text-gray-600 transition-colors line-clamp-2 min-h-[2.8em]">
                  {product.title}
                </h3>
                <p className="text-sm text-gray-900 font-serif tracking-wide">
                  ¥{product.price.toLocaleString()} {product.title.includes('〜') ? '〜' : ''}
                </p>
              </div>
          </Link>
          );
          })}
        </div>
      )}

      {!loading && !error && displayProducts.length > 0 && (
        <div className="text-center mt-12">
           <Link href="/collections" className="inline-block bg-black text-white px-10 py-3 text-xs tracking-[0.2em] hover:opacity-80 transition-opacity uppercase">
             View all
           </Link>
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
