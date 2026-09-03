import type { Metadata } from 'next';
import Link from 'next/link';
import ProductGallery from '@/components/product/ProductGallery';
import ProductFeatures from '@/components/product/ProductFeatures';
import ProductStory from '@/components/product/ProductStory';
import StickyPurchaseBar from '@/components/product/StickyPurchaseBar';
import SubscriptionCTA from '@/components/home/SubscriptionCTA';
import { SHOW_PLACEHOLDER_BADGE } from '@/components/home/placeholders';
import ProductDetailView from '@/app/(main)/products/[handle]/ProductDetailView';
import { getPublishedProductByHandle } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'スタートセット',
  description:
    '佐渡島の自然栽培米を3品種を食べ比べできるスタートセット。イケベジをはじめて試す方へ。',
  alternates: { canonical: '/start-set' },
  // 商品が確定するまで検索結果には出さない
  robots: { index: false, follow: true },
};

/**
 * スタートセット（ベースフードの「継続コーススタートセット」に相当）。
 *
 * 商品ページと同じ構成:
 *   左に固定の画像 / 右に流れる購入パネル → 商品詳細 → テーマ別 → 定期便
 *
 * ※ 対応する商品がまだ登録されていないため、価格・内容・写真はすべて仮。
 *   商品が登録されたら /products/[handle] と同じ購入導線に差し替える。
 */
const LIST_PRICE = 2340;
const PRICE = 1872;

const GALLERY = [
  '/images/home/collections/collection_koshihikari_800.webp',
  '/images/home/collections/collection_kamenoo_800.webp',
  '/images/usage-scene.jpg',
  '/images/rice-keep-bag.jpg',
];

const VARIETIES = [
  { name: 'コシヒカリ', body: '粘りと甘みのバランス。まず基準にしたい一品種です。', image: '/images/home/collections/collection_koshihikari_800.webp', href: '/collections/rice/koshihikari' },
  { name: '亀の尾', body: 'コシヒカリの祖先にあたる希少品種。すっきりとした後味。', image: '/images/home/collections/collection_kamenoo_800.webp', href: '/collections/rice/kamenoo' },
  { name: 'にこまる', body: '大粒でつやがあり、冷めてもおいしい。お弁当にも。', image: '/images/home/collections/collection_koshihikari_800.webp', href: '/collections/rice/nikomaru' },
];

const BENEFITS = [
  '3品種を少量ずつ、食べ比べていただけます',
  '通常より20%OFF でお試しいただけます',
  '定期便で使える初回クーポン（送料無料・20%OFF）つき',
  'お届けに合わせて出荷直前に精米します',
];

export const revalidate = 60;

export default async function StartSetPage() {
  const product = await getPublishedProductByHandle('start-set');

  // 管理画面で公開された商品があれば、通常の商品と同じ購入・在庫・配送処理を使う。
  if (product) return <ProductDetailView product={product} />;

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen animate-fade-in overflow-x-clip w-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-[10px] text-gray-400 mb-8 md:mb-12 tracking-widest">
          <Link href="/" className="hover:text-black transition-colors">ホーム</Link>
          <span className="mx-2">/</span>
          <span className="text-black">スタートセット</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* 左: 画像は固定 */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 lg:self-start">
            <div className="relative">
              {SHOW_PLACEHOLDER_BADGE && (
                <span className="absolute top-2 left-2 z-20 rounded-sm bg-yuunagi-ink/90 px-1.5 py-0.5 text-[9px] tracking-wider text-white">
                  仮素材
                </span>
              )}
              <ProductGallery images={GALLERY} alt="イケベジ スタートセット" />
            </div>
          </div>

          {/* 右: 流れる購入パネル */}
          <div className="lg:col-span-5">
            <div id="purchase-panel">
              <p className="text-xs tracking-[0.15em] text-yuunagi-ink mb-2">スタートセット</p>
              <h1 className="text-xl md:text-2xl font-medium text-primary leading-relaxed tracking-wide mb-3">
                自然栽培米 3品種 食べ比べセット
              </h1>
              <p className="text-[13px] leading-relaxed text-gray-600 mb-6">
                コシヒカリ・亀の尾・にこまる。同じ田んぼの、同じ育て方でも、品種が違えば味も香りも変わります。
              </p>

              <div className="rounded-sm bg-yuunagi-soft/60 p-4 md:p-5 mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="rounded-sm bg-yuunagi px-2 py-1 text-[10px] font-medium text-white">20%OFF</span>
                  <span className="rounded-sm bg-hekishoku px-2 py-1 text-[10px] font-medium text-white">初回限定</span>
                  <span className="text-xs text-gray-500 line-through tabular-nums">¥{LIST_PRICE.toLocaleString()}</span>
                </div>
                <p className="text-3xl font-serif font-semibold text-primary tabular-nums">
                  ¥{PRICE.toLocaleString()}
                  <span className="ml-1 text-xs text-gray-500">（税込）</span>
                </p>
                <p className="mt-1 text-[11px] text-gray-500">＋送料　※価格は予定です</p>
              </div>

              <div className="border-2 border-gray-200 rounded-sm p-4 md:p-5 mb-6">
                <p className="text-sm font-medium text-primary mb-4">このセットでできること</p>
                <ul className="flex flex-col gap-2.5">
                  {BENEFITS.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[12px] md:text-[13px] text-gray-600 leading-relaxed">
                      <svg className="shrink-0 mt-0.5 w-3.5 h-3.5 text-yuunagi" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M3 8.5l3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-sm border border-yuunagi-soft bg-yuunagi-soft/40 px-4 py-3 mb-4 text-[12px] text-yuunagi-ink">
                このセットは準備中です。商品の登録が完了しだい、ここから購入いただけます。
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href="/collections/rice"
                  className="flex items-center justify-center rounded-full bg-yuunagi py-4 text-sm font-medium text-white hover:bg-yuunagi-ink transition-colors"
                >
                  お米の一覧を見る
                </Link>
                <Link
                  href="/collections/rice/yearly?view=lp"
                  className="flex items-center justify-center rounded-full border border-primary py-4 text-sm text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  定期便について見る
                </Link>
              </div>

              {/* セット内容 */}
              <div className="mt-8">
                <p className="text-sm text-primary mb-3">セット内容：3品種</p>
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
                  {VARIETIES.map((v) => (
                    <Link
                      key={v.name}
                      href={v.href}
                      className="shrink-0 w-[104px] border border-gray-200 rounded-sm overflow-hidden hover:border-gray-400 transition-colors"
                    >
                      <span className="block aspect-square bg-dim overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.image} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-cover" />
                      </span>
                      <span className="block px-2 py-2 text-[12px] text-primary">{v.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 商品が未登録のため、数量とカート追加は無効にしてある */}
        <StickyPurchaseBar
          title="自然栽培米 3品種 食べ比べセット"
          price={PRICE}
          image={GALLERY[0]}
          note="準備中"
          disabled
          disabledLabel="準備中"
        />

        <ProductFeatures
          rows={[
            {
              label: 'セット内容',
              body:
                'コシヒカリ・亀の尾・にこまるの3品種を、それぞれ少量ずつお届けします。\n精米度合い（玄米 / 白米 / 分づき）はお選びいただけます。\n\n※ 内容量と組み合わせは確定次第、こちらに記載します。',
            },
            {
              label: '産地・栽培について',
              body:
                '新潟県佐渡市。すべての圃場で農薬・化学肥料を使わずに栽培しています。\n佐渡市が定める「生き物を育む農法」をすべての圃場で実施しています。',
            },
            {
              label: 'お届けについて',
              sub: '発送 / 送料',
              body:
                'ご注文から5日以内に発送いたします。\nお届け日の指定は承っておりません。\n送料は地域とサイズにより異なります。',
            },
            {
              label: '保存方法',
              body:
                '直射日光と高温多湿を避け、冷蔵庫の野菜室で保管してください。\n精米後は2週間ほどで食べきっていただくのがいちばんおいしい状態です。',
            },
          ]}
        />

        <ProductStory />

        <div className="mt-20 md:mt-28 -mx-4 sm:-mx-6 lg:-mx-8">
          <SubscriptionCTA />
        </div>
      </div>
    </div>
  );
}
