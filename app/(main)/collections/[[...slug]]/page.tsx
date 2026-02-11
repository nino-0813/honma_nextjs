'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { FadeInImage } from '@/components/UI';
import type { Product } from '@/types';

function getFilterNameFromParam(param: string) {
  if (param === 'rice') return 'お米';
  if (param === 'crescent') return 'Crescentmoon';
  if (param === 'other') return 'その他';
  return 'ALL';
}

function getSubcategoryNameFromParam(param: string): string {
  const mapping: Record<string, string> = {
    koshihikari: 'コシヒカリ',
    kamenoo: '亀の尾',
    nikomaru: 'にこまる',
    yearly: '年間契約',
  };
  return mapping[param] ?? param;
}

type CategoryLabel = 'ALL' | 'お米' | 'Crescentmoon' | 'その他';

function getProductCategories(p: Product): string[] {
  const cats = (p as Product & { categories?: string[] }).categories;
  if (Array.isArray(cats) && cats.length > 0) return cats;
  return p.category ? [p.category] : [];
}

function getProductSubcategories(p: Product): string[] {
  const subs = (p as Product & { subcategories?: string[] }).subcategories;
  if (Array.isArray(subs) && subs.length > 0) return subs;
  return p.subcategory ? [p.subcategory] : [];
}

export default function CollectionsPage() {
  const params = useParams();
  const slug = (params?.slug as string[] | undefined) ?? [];
  const categoryParam = slug[0];
  const subcategoryParam = slug[1];

  const currentCategory = useMemo((): CategoryLabel => {
    if (categoryParam === 'rice' && subcategoryParam) return 'お米';
    if (categoryParam) return getFilterNameFromParam(categoryParam) as CategoryLabel;
    return 'ALL';
  }, [categoryParam, subcategoryParam]);

  const currentSubcategory = useMemo(() => {
    if (categoryParam === 'rice' && subcategoryParam) return subcategoryParam;
    return null;
  }, [categoryParam, subcategoryParam]);

  const { products: supabaseProducts, loading, error } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [sortOrder] = useState('manual');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [categoryParam, subcategoryParam]);

  useEffect(() => {
    if (loading) return;
    let result: Product[] = [...supabaseProducts];

    if (currentCategory !== 'ALL') {
      if (currentCategory === 'お米') {
        result = supabaseProducts.filter((p) => {
          const cats = getProductCategories(p);
          const subs = getProductSubcategories(p);
          return cats.includes('お米') || subs.includes('年間契約') || p.title.includes('年間契約');
        });
      } else {
        result = supabaseProducts.filter((p) => {
          const cats = getProductCategories(p);
          return cats.includes(currentCategory) || p.title.includes(currentCategory);
        });
      }
    }

    if (currentSubcategory && currentCategory === 'お米') {
      const subcategoryName = getSubcategoryNameFromParam(currentSubcategory);
      result = result.filter((p) => {
        const subs = getProductSubcategories(p);
        if (subs.includes(subcategoryName)) return true;
        if (currentSubcategory === 'koshihikari') return p.title.includes('コシヒカリ');
        if (currentSubcategory === 'kamenoo') return p.title.includes('亀の尾');
        if (currentSubcategory === 'nikomaru') return p.title.includes('にこまる');
        if (currentSubcategory === 'yearly') return p.title.includes('年間契約');
        return false;
      });
    }

    result.sort((a, b) => {
      const orderA = a.display_order ?? 999999;
      const orderB = b.display_order ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      if (sortOrder === 'price-asc') return a.price - b.price;
      if (sortOrder === 'price-desc') return b.price - a.price;
      return 0;
    });
    result = result.filter((p) => p.is_visible !== false);
    setFilteredProducts(result);
  }, [currentCategory, currentSubcategory, sortOrder, supabaseProducts, loading]);

  const getPageTitle = () => {
    if (currentCategory === 'お米') {
      if (currentSubcategory === 'koshihikari') return 'コシヒカリ';
      if (currentSubcategory === 'kamenoo') return '亀の尾';
      if (currentSubcategory === 'nikomaru') return 'にこまる';
      if (currentSubcategory === 'yearly') return '年間契約';
      return 'お米';
    }
    if (currentCategory === 'ALL') return 'ALL ITEM';
    return currentCategory;
  };

  return (
    <div className="pt-28 pb-32 min-h-screen bg-white overflow-x-hidden w-full">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-4">{getPageTitle()}</h1>
          <div className="overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide w-full">
            {currentCategory === 'お米' ? (
              <div className="flex gap-4 min-w-max justify-center md:justify-center">
                <Link href="/collections/rice" className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${!currentSubcategory ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  ALL
                </Link>
                <Link href="/collections/rice/yearly" className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentSubcategory === 'yearly' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  年間契約
                </Link>
                <Link href="/collections/rice/koshihikari" className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentSubcategory === 'koshihikari' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  コシヒカリ
                </Link>
                <Link href="/collections/rice/kamenoo" className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentSubcategory === 'kamenoo' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  亀の尾
                </Link>
                <Link href="/collections/rice/nikomaru" className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentSubcategory === 'nikomaru' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  にこまる
                </Link>
              </div>
            ) : (
              <div className="flex gap-4 min-w-max justify-center md:justify-center">
                <Link href="/collections" className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentCategory === 'ALL' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>
                  ALL
                </Link>
                <Link href="/collections/rice" className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${(currentCategory as CategoryLabel) === 'お米' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>
                  お米
                </Link>
                <Link href="/collections/crescent" className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentCategory === 'Crescentmoon' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>
                  Crescentmoon
                </Link>
                <Link href="/collections/other" className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentCategory === 'その他' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>
                  その他
                </Link>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
              <p className="text-sm text-gray-500">商品を読み込み中...</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center max-w-md">
              <p className="text-red-500 mb-2 font-medium">エラーが発生しました</p>
              <p className="text-sm text-gray-700">{error.message}</p>
            </div>
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <p className="text-gray-500 mb-2">商品が見つかりませんでした</p>
            </div>
          </div>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-12 sm:gap-y-16">
            {filteredProducts.map((product, index) => (
              <Link
                key={product.id}
                href={`/products/${product.handle || product.id}`}
                className="group block opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="relative aspect-square bg-white border border-gray-100 overflow-hidden mb-5 flex items-center justify-center">
                  <div className="absolute top-2 left-2 z-20 flex flex-col gap-2">
                    {product.soldOut && (
                      <span className="bg-primary text-white px-3 py-1 text-[10px] font-bold tracking-widest uppercase shadow-sm">
                        Sold Out
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 z-10 bg-white transition-opacity duration-700 ease-in-out group-hover:opacity-0 flex items-center justify-center p-2">
                    <FadeInImage
                      src={product.images?.length ? product.images[0] : product.image || ''}
                      alt={product.title}
                      className="w-full h-full object-contain"
                      width={320}
                      height={320}
                    />
                  </div>
                  <div className="absolute inset-0 z-0 bg-white transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out flex items-center justify-center p-2">
                    <FadeInImage
                      src={product.images?.length > 1 ? product.images[1] : product.images?.[0] || product.image || ''}
                      alt={product.title}
                      className="w-full h-full object-contain"
                      width={320}
                      height={320}
                    />
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2 text-center">
                  <h2 className="text-sm font-medium text-primary leading-relaxed group-hover:text-gray-600 transition-colors line-clamp-2 min-h-[2.8em]">
                    {product.title}
                  </h2>
                  <p className="text-sm text-gray-900 font-serif tracking-wide">
                    ¥{product.price.toLocaleString()} {product.title.includes('〜') ? '〜' : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
