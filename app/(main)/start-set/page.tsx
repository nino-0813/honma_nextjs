import type { Metadata } from 'next';
import Link from 'next/link';
import ProductGallery from '@/components/product/ProductGallery';
import ProductFeatures from '@/components/product/ProductFeatures';
import StickyPurchaseBar from '@/components/product/StickyPurchaseBar';
import SubscriptionCTA from '@/components/home/SubscriptionCTA';
import { SHOW_PLACEHOLDER_BADGE } from '@/components/home/placeholders';
import { getProductByHandle, getPublishedProductByHandle } from '@/lib/supabase';
import StartSetPurchasePanel from '@/components/start-set/StartSetPurchasePanel';
import RiceGuideModal from '@/components/start-set/RiceGuideModal';

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
  '/images/renewal/products/rice-lineup.webp',
  '/images/renewal/lineup/rice.webp',
];

const VARIETIES = [
  { name: 'コシヒカリ', taste: '甘み・粘り', body: 'ふっくら親しみやすい、毎日のごはんの王道。', image: '/images/home/collections/collection_koshihikari_800.webp', href: '/collections/rice/koshihikari' },
  { name: '亀の尾', taste: '旨み・すっきり', body: '噛むほどに広がる、お米らしい素朴な味わい。', image: '/images/home/collections/collection_kamenoo_800.webp', href: '/collections/rice/kamenoo' },
  { name: 'にこまる', taste: '大粒・もっちり', body: '粒感と食べごたえがあり、冷めてもおいしい。', image: '/images/renewal/lineup/rice.webp', href: '/collections/rice/nikomaru' },
];

// 管理画面で保存した内容を、確認用デプロイですぐ確認できるようにする。
export const dynamic = 'force-dynamic';

export default async function StartSetPage() {
  // 本番は公開中の商品のみ。Vercel Preview とローカルでは下書きも確認できる。
  const product = process.env.VERCEL_ENV === 'production'
    ? await getPublishedProductByHandle('start-set')
    : await getProductByHandle('start-set');

  const gallery = product
    ? (product.images?.length ? product.images : product.image ? [product.image] : GALLERY)
    : GALLERY;

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white pb-24 pt-24 animate-fade-in md:pt-28">
      <section className="px-5 py-16 text-center md:py-24">
        <h1 className="mx-auto max-w-4xl font-serif text-[32px] font-semibold leading-[1.55] tracking-[0.08em] text-primary md:text-5xl lg:text-[56px]">
          3品種 食べ比べセット
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-loose text-gray-600 md:text-base">
          佐渡で同じように育てても、甘みも、香りも、食感も違う。<br className="hidden md:block" />
          一膳ずつ味わいながら、あなたの「好き」を見つけるスタートセットです。
        </p>
      </section>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 mt-7 text-[10px] tracking-widest text-gray-400 md:mb-10">
          <Link href="/" className="hover:text-black transition-colors">ホーム</Link>
          <span className="mx-2">/</span>
          <span className="text-black">スタートセット</span>
        </div>

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* 左: 画像は固定 */}
          <div className="lg:sticky lg:top-24 lg:col-span-7 lg:self-start">
            <div className="relative">
              {SHOW_PLACEHOLDER_BADGE && (
                <span className="absolute top-2 left-2 z-20 rounded-sm bg-yuunagi-ink/90 px-1.5 py-0.5 text-[9px] tracking-wider text-white">
                  仮素材
                </span>
              )}
              <ProductGallery images={gallery} alt={product?.title || 'イケベジ スタートセット'} />
            </div>
          </div>

          {/* 右: 流れる購入パネル */}
          <div className="lg:col-span-5">
            {product ? (
              <StartSetPurchasePanel product={product} />
            ) : (
            <div id="purchase-panel">
              <p className="text-xs tracking-[0.15em] text-yuunagi-ink mb-2">スタートセット</p>
              <h2 className="text-xl md:text-2xl font-medium text-primary leading-relaxed tracking-wide mb-3">
                自然栽培米 3品種 食べ比べセット
              </h2>
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
            )}
          </div>
        </div>

        {!product && (
          <StickyPurchaseBar
            title="自然栽培米 3品種 食べ比べセット"
            price={PRICE}
            image={GALLERY[0]}
            note="準備中"
            disabled
            disabledLabel="準備中"
          />
        )}

        <ProductFeatures
          rows={[
            {
              label: 'セット内容',
              body:
                '従来コシヒカリ・亀の尾・にこまるの3品種を、それぞれ2合ずつお届けします。\n精米方法は玄米または白米からお選びいただけます。',
            },
            {
              label: '産地・栽培について',
              body:
                '新潟県佐渡市。すべての田んぼで農薬・除草剤・化学肥料を使わずに栽培しています。\n自然栽培を目指し、有機JAS認証の取得も予定しています。',
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
                '直射日光と高温多湿を避け、涼しい場所で保管してください。\nお米をよい状態で保つため、専用のRice Keep（お米保存袋）のご利用もおすすめしています。',
            },
          ]}
        />
        <div className="mt-8 flex justify-center"><RiceGuideModal /></div>

        <section className="mt-20 grid overflow-hidden bg-hekishoku text-white md:mt-28 lg:grid-cols-2">
          <div className="min-h-[320px] lg:min-h-[480px]"><img src="/images/about/hero/retreat_2025_56.webp" alt="佐渡の田んぼで笑顔を見せる家族" loading="lazy" className="h-full w-full object-cover" /></div>
          <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
            <h2 className="font-serif text-2xl font-semibold leading-relaxed tracking-wider md:text-4xl">おいしさの先に、<br />残したい風景がある。</h2>
            <p className="mt-6 text-sm leading-loose text-white/85 md:text-base">最初の一袋を選んでくれることが、佐渡の田んぼと次の季節につながります。</p>
            <Link href="/about" className="mt-8 inline-flex min-h-12 w-fit items-center border border-white/50 px-6 text-sm transition-colors hover:bg-white hover:text-hekishoku">詳しく知る →</Link>
          </div>
        </section>

        <div className="mt-20 md:mt-28 -mx-4 sm:-mx-6 lg:-mx-8">
          <SubscriptionCTA />
        </div>
      </div>
    </div>
  );
}
