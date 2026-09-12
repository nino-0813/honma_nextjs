'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { FadeInImage } from '@/components/UI';
import type { Product } from '@/types';
import { isProductPreorder, isProductSoldOut } from '@/lib/productStatus';
import YearlySubscriptionLP, { YearlySubscriptionFooter } from '@/components/YearlySubscriptionLP';
import ProductCategoryNav, { type ProductCategoryKey } from '@/components/product/ProductCategoryNav';

function getFilterNameFromParam(param: string) {
  if (param === 'rice') return 'お米';
  if (param === 'crescent') return 'Crescentmoon';
  if (param === 'other') return 'その他';
  if (param === 'shiitake') return '原木しいたけ';
  if (param === 'ticket') return 'チケット';
  return 'ALL';
}

// DB上のsubcategory値とのマッチ用（表示名ではなくフィルタキー）
function getSubcategoryNameFromParam(param: string): string {
  const mapping: Record<string, string> = {
    koshihikari: 'コシヒカリ',
    kamenoo: '亀の尾',
    nikomaru: 'にこまる',
    yearly: '年間契約',
  };
  return mapping[param] ?? param;
}

type CategoryLabel = 'ALL' | 'お米' | 'Crescentmoon' | 'その他' | '原木しいたけ' | 'チケット';

const RICE_INTROS: Record<string, { title: string; lead: string; details: string[] }> = {
  koshihikari: { title: '従来コシヒカリ', lead: '王道の、もっちり感。', details: ['甘みと粘りがしっかり感じられる、親しみ深い味わい。', '炊きたての白ごはんはもちろん、毎日の食卓に素直になじみます。'] },
  kamenoo: { title: '亀の尾', lead: '凛とした粒感、すっきりした余韻。', details: ['品種改良されていない、野生味を残す希少なお米です。', '粘りは控えめで、寿司や炒飯などお米の輪郭を生かす料理にもよく合います。'] },
  nikomaru: { title: 'にこまる', lead: '大粒で、冷めても弾む。', details: ['三品種のなかで最も粒が大きく、ふっくらした弾力が続きます。', 'お弁当や丼ものにも合わせやすい、頼もしいお米です。'] },
};

const CATEGORY_STORIES: Record<string, { title: string; lead: string; blocks: { image: string; title: string; body: string }[] }> = {
  shiitake: {
    title: '原木しいたけ', lead: '島の森が育てる、豊かな香り。',
    blocks: [
      { image: '/images/renewal/lineup/shiitake.webp', title: '原木から、ゆっくり育つ', body: '佐渡の自然のなかで時間をかけて育った原木しいたけ。肉厚な食感と、噛むほど広がる香りをお楽しみください。' },
      { image: '/images/about/stories/P3A9707.webp', title: '佐渡の山の恵みを食卓へ', body: '季節や天候と向き合いながら、自然のリズムを大切に育てています。' },
    ],
  },
  crescent: {
    title: 'Crescentmoon', lead: '佐渡の素材から生まれる、やさしいお菓子。',
    blocks: [
      { image: '/images/crescentmoon/589F7B72-C537-4904-A9AD-55F5EDFF1A71.jpg', title: 'ひとつずつ、丁寧に', body: '素材の味わいを大切に、手間を惜しまず焼き上げたお菓子をお届けします。' },
      { image: '/images/renewal/lineup/others.webp', title: '日常に、小さな特別を', body: '贈りものにも、いつものお茶の時間にも。やさしいおいしさを佐渡から届けます。' },
    ],
  },
};

const RICE_STORY_IMAGES: Record<string, string> = {
  koshihikari: '/images/home/collections/collection_koshihikari_800.webp',
  kamenoo: '/images/home/collections/collection_kamenoo_800.webp',
  nikomaru: '/images/renewal/lineup/rice.webp',
};

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
  const searchParams = useSearchParams();
  const slug = (params?.slug as string[] | undefined) ?? [];
  const categoryParam = slug[0];
  const subcategoryParam = slug[1];
  // SUBSCRIPTIONメニュー経由のときだけLPを表示するためのフラグ
  const isLpView = searchParams?.get('view') === 'lp' && subcategoryParam === 'yearly';

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
          if (currentCategory === '原木しいたけ') return cats.some((cat) => /原木(しいたけ|椎茸)/.test(cat)) || /原木(しいたけ|椎茸)/.test(p.title);
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
      if (currentSubcategory === 'koshihikari') return '従来コシヒカリ';
      if (currentSubcategory === 'kamenoo') return '亀の尾';
      if (currentSubcategory === 'nikomaru') return 'にこまる';
      if (currentSubcategory === 'yearly') return 'イケベジ定期便';
      return 'すべてのお米';
    }
    if (currentCategory === 'ALL') return 'すべての商品';
    return currentCategory;
  };

  const categoryNavKey: ProductCategoryKey = currentSubcategory === 'yearly'
    ? 'subscription'
    : currentSubcategory === 'koshihikari'
      ? 'koshihikari'
      : currentSubcategory === 'kamenoo'
        ? 'kamenoo'
        : currentSubcategory === 'nikomaru'
          ? 'nikomaru'
          : currentCategory === '原木しいたけ'
            ? 'shiitake'
            : currentCategory === 'Crescentmoon'
              ? 'crescent'
              : currentCategory === 'チケット'
                ? 'ticket'
                : currentCategory === 'お米'
                  ? 'rice'
              : 'all';

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white pb-36 pt-20 md:pt-24">
      <div className="sticky top-16 z-30 border-y border-gray-100 bg-white/95 py-3 backdrop-blur-md md:top-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <ProductCategoryNav current={categoryNavKey} />
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="mb-16 text-center animate-fade-in md:mb-24">
          {currentCategory !== 'ALL' && (
            <h1 className="mt-12 font-serif text-2xl font-normal tracking-[0.15em] md:mt-16 md:text-3xl">{getPageTitle()}</h1>
          )}
          {currentSubcategory === 'yearly' && !isLpView && (
            <p className="mt-5 text-xs leading-relaxed text-gray-600 md:text-sm">
              すべて<span className="text-yuunagi-ink font-medium">10%OFF</span>でお届けします。
            </p>
          )}
        </div>

        {currentSubcategory && RICE_INTROS[currentSubcategory] && (
          <section className="mb-24 space-y-16 border-y border-gray-100 py-14 md:mb-32 md:space-y-24 md:py-20">
            <div className="grid gap-10 md:grid-cols-2 md:gap-16">
              <div className="space-y-6"><p className="text-sm text-yuunagi-ink">{RICE_INTROS[currentSubcategory].lead}</p><h2 className="font-serif text-2xl tracking-wider text-primary md:text-3xl">{RICE_INTROS[currentSubcategory].title}</h2></div>
              <div className="space-y-5 text-sm leading-loose text-gray-600 md:text-base">{RICE_INTROS[currentSubcategory].details.map((text) => <p key={text}>{text}</p>)}</div>
            </div>
            <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
              <div className="aspect-[16/10] overflow-hidden"><img src={RICE_STORY_IMAGES[currentSubcategory]} alt={`${RICE_INTROS[currentSubcategory].title}のお米`} className="h-full w-full object-cover" loading="lazy" /></div>
              <div className="space-y-5"><h3 className="font-serif text-2xl text-primary md:text-3xl">品種の個性を、そのまま</h3><p className="text-sm leading-loose text-gray-600 md:text-base">同じ佐渡の田んぼでも、品種によって甘み、香り、食感は異なります。いつもの料理と一緒に、その違いをお楽しみください。</p></div>
            </div>
            <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
              <div className="aspect-[16/10] overflow-hidden md:order-2"><img src="/images/about/stories/about_story_taue_123.webp" alt="佐渡の田んぼでの米づくり" className="h-full w-full object-cover" loading="lazy" /></div>
              <div className="space-y-5"><h3 className="font-serif text-2xl text-primary md:text-3xl">佐渡の自然と育てる</h3><p className="text-sm leading-loose text-gray-600 md:text-base">島の気候と生きものに寄り添いながら、毎日の食卓へまっすぐ届けられるお米を育てています。</p></div>
            </div>
          </section>
        )}

        {categoryParam && CATEGORY_STORIES[categoryParam] && (
          <section className="mb-24 space-y-16 md:mb-32 md:space-y-24">
            <div className="text-center">
              <p className="mb-5 text-sm text-yuunagi-ink">{CATEGORY_STORIES[categoryParam].lead}</p>
              <h2 className="font-serif text-2xl tracking-wider text-primary md:text-3xl">{CATEGORY_STORIES[categoryParam].title}</h2>
            </div>
            {CATEGORY_STORIES[categoryParam].blocks.map((block, index) => (
              <div key={block.title} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
                <div className={`aspect-[16/10] overflow-hidden ${index % 2 ? 'md:order-2' : ''}`}><img src={block.image} alt="" className="h-full w-full object-cover" loading="lazy" /></div>
                <div className="space-y-6"><h3 className="font-serif text-2xl text-primary md:text-3xl">{block.title}</h3><p className="text-sm leading-loose text-gray-600 md:text-base">{block.body}</p></div>
              </div>
            ))}
          </section>
        )}

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

        {/* 年間契約ページではLPセクションを商品一覧の上に表示 */}
        {!loading && !error && isLpView && <YearlySubscriptionLP />}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <p className="text-gray-500 mb-2">商品が見つかりませんでした</p>
            </div>
          </div>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-x-5 gap-y-16 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-20 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => {
              const soldOut = isProductSoldOut(product);
              const preorder = !soldOut && isProductPreorder(product); // 在庫切れ優先
              return (
              <Link
                key={product.id}
                href={
                  isLpView
                    ? `/products/${product.handle || product.id}?type=subscription`
                    : `/products/${product.handle || product.id}`
                }
                className="group block opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="relative aspect-square bg-white border border-gray-100 overflow-hidden mb-5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center bg-white p-2 transition-transform duration-500 ease-out group-hover:scale-[1.015] motion-reduce:transition-none">
                    <FadeInImage
                      src={product.images?.length ? product.images[0] : product.image || ''}
                      alt={product.title}
                      className="w-full h-full object-contain"
                      width={320}
                      height={320}
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 text-left">
                  <h2 className="text-sm font-medium text-primary leading-relaxed group-hover:text-gray-600 transition-colors line-clamp-2 min-h-[2.8em]">
                    {product.handle === 'start-set' ? '3種食べ比べセット' : product.title}
                  </h2>
                  <p className="flex flex-wrap items-center justify-start gap-2 font-serif text-sm tracking-wide text-gray-900">
                    {(() => {
                      // 定期便ページ（LPビュー）では10%OFFの値引き価格を表示する
                      const discountPercent = isLpView
                        ? (product.subscriptionDiscountPercent && product.subscriptionDiscountPercent > 0
                            ? product.subscriptionDiscountPercent
                            : 10)
                        : 0;
                      const suffix = product.title.includes('〜') ? '〜' : '';
                      if (discountPercent > 0) {
                        const discounted = Math.round(product.price * (1 - discountPercent / 100));
                        return (
                          <span className="flex flex-wrap items-center justify-start gap-2">
                            <span className="text-gray-400 line-through text-xs">
                              ¥{product.price.toLocaleString()}
                            </span>
                            <span className="text-red-600 font-medium">
                              ¥{discounted.toLocaleString()} {suffix}
                            </span>
                            <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                              {discountPercent}%OFF
                            </span>
                          </span>
                        );
                      }
                      return (
                        <span>
                          ¥{product.price.toLocaleString()} {suffix}
                        </span>
                      );
                    })()}
                    {soldOut && (
                      <span className="text-[10px] font-bold tracking-widest uppercase text-red-600 border border-red-600 px-2 py-0.5">
                        Sold Out
                      </span>
                    )}
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

        {/* 年間契約ページではフッターセクション（FAQ・送料）を表示 */}
        {!loading && !error && isLpView && <YearlySubscriptionFooter />}
      </div>
    </div>
  );
}
