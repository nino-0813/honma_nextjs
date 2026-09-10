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
const PRICE = 2106;

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
      <section className="px-5 py-12 text-center md:py-16">
        <h1 className="mx-auto max-w-4xl font-serif text-[28px] font-semibold leading-[1.5] tracking-[0.08em] text-primary md:text-4xl lg:text-[40px]">
          3品種 食べ比べセット
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[13px] leading-loose text-gray-600 md:text-sm">
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
              <p className="text-xs tracking-[0.15em] text-gray-500 mb-2">初回限定</p>
              <h2 className="text-xl md:text-2xl font-medium text-primary leading-relaxed tracking-wide mb-6">
                スタートセット
              </h2>

              <div className="border border-gray-200 bg-white p-4 md:p-5 mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-medium text-white">初回 送料無料＆10%OFF</span>
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
                  className="flex items-center justify-center rounded-full bg-primary py-4 text-sm font-medium text-white hover:bg-black transition-colors"
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
          alwaysOpenFirst
          rows={[
            {
              label: 'セット内容',
              body:
                '従来コシヒカリ・亀の尾・にこまるの3品種をお届けします。\n精米方法は玄米または白米からお選びいただけます。\n\n' +
                '・従来コシヒカリ（自然栽培）\n' +
                '肥料も農薬も一切使わない「自然栽培」で育てた、イケベジの定番品種。余計なものを加えず、お米が本来持つ生命力に寄り添う「引き算の物づくり」を実践することで、野生味あふれる甘みと豊かな風味をそのまま引き出しています。イケベジの田んぼの中でも、山から流れ出る川から一番に入水できる田んぼから連なる、たった8枚の限られた田んぼでのみ栽培しています。田んぼの位置まで究極にこだわり抜いた、至高のお米です。\n\n' +
                '・にこまる（無農薬無化学肥料）\n' +
                '本来は西日本で多く栽培される品種を、佐渡の地であえて育てているのが「にこまる」です。佐渡の銘酒から出る酒粕と、豊かな海が育む牡蠣殻を肥料として活用し、地域で行き場を失っていた資源を土に還しながら育てました。大粒で贅沢な食感と豊かな甘みが持ち味で、第27回米・食味分析鑑定コンクール国際大会の国際総合部門にて金賞（最多得票）を受賞。世界最高米の原料にも選出されました。\n\n' +
                '・亀の尾（無農薬無化学肥料）\n' +
                'コシヒカリやササニシキなど、いまの人気品種の祖先にあたる希少な在来品種「亀の尾」。あっさりとした素朴な味で、もち米系統が入らないお米本来の味を楽しめます。高アミロース米にあたり、通常の品種よりも消化がゆっくりで、身体に優しい逸品です。佐渡で使われなくなった竹を細かくチップにして堆肥化し、田んぼに混ぜ込むことで、多孔質な竹が土壌微生物のすみかとなり、時間をかけてゆっくりと栄養が届く土づくりを実践しています。',
            },
          ]}
        />
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <RiceGuideModal />
        </div>

        <section className="mt-16 grid overflow-hidden bg-hekishoku text-white md:mt-20 lg:grid-cols-2">
          <div className="min-h-[320px] lg:min-h-[480px]"><img src="/images/about/hero/retreat_2025_56.webp" alt="佐渡の田んぼで過ごす家族" loading="lazy" className="h-full w-full object-cover" /></div>
          <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
            <h2 className="font-serif text-xl font-semibold leading-relaxed tracking-wider md:text-3xl">おいしさだけじゃない、<br />イケベジが届けたいこと</h2>
            <p className="mt-6 text-sm leading-loose text-white/85 md:text-base">お客様の日常の「いいとき」を彩る一員であるとともに、「子どもたちがここに生まれて良かったと思える社会」を創ることが、私たちの目指すビジョンです。</p>
            <Link href="/about" className="mt-8 inline-flex min-h-12 w-fit items-center border border-white/50 px-6 text-sm transition-colors hover:bg-white hover:text-hekishoku">詳しく知る →</Link>
          </div>
        </section>

        <ProductFeatures
          showTitle={false}
          rows={[
            {
              label: '産地・栽培について',
              body:
                '新潟県佐渡・豊田集落。すべての圃場で農薬・化学肥料を使わずに栽培しています。\n佐渡市が定める「生き物を育む農法」をすべての圃場で実施しています。\n※今後JAS有機認証を取得予定',
            },
            {
              label: 'お届けについて',
              sub: '発送 / 送料',
              body:
                'ご注文から5日以内に発送いたします。\nお届け日の指定は承っておりません。\n送料は地域とサイズにより異なります。\n\n詳細は特定商取引法に基づく表記をご確認ください。',
              link: { href: '/legal#shipping', label: '送料の価格表を見る →' },
            },
            {
              label: '保存方法',
              body:
                'おすすめ：イケベジのオンラインストアでも取り扱いがあります「ライスキープ」をおすすめします。\n保存袋のプロ × お米のプロが共同開発した、常温保存が可能な究極のお米保存袋。これまで冷蔵が必須だったお米保存の常識を覆し、「新米のまま備蓄」を可能にしてくれます。',
              link: { href: '/rice-keep', label: 'ライスキープの商品を見る →' },
            },
          ]}
        />

        <div className="mt-20 md:mt-28 -mx-4 sm:-mx-6 lg:-mx-8">
          <SubscriptionCTA />
        </div>
      </div>
    </div>
  );
}
