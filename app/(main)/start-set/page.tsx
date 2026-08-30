import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'スタートセット',
  description:
    '佐渡島の自然栽培米を3品種食べ比べできるスタートセット。イケベジをはじめて試す方へ。',
  alternates: { canonical: '/start-set' },
  // 内容が確定するまで検索結果には出さない
  robots: { index: false, follow: true },
};

/**
 * スタートセット紹介ページ（準備中）。
 *
 * 要件定義（2026-08-26 §5）で想定されている内容:
 *   - 3品種食べ比べセット（20%OFF = 1,872円）＋送料
 *   - 定期便購入につながるクーポン（初回送料無料・20%OFF）
 *
 * 対応する商品がまだ登録されていないため、現状は入口だけを用意している。
 * 商品が登録されたら、この画面を商品詳細への導線に差し替える。
 */
export default function StartSetPage() {
  return (
    <div className="pt-28 md:pt-32 pb-24 min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        <p className="flex items-center gap-2 text-[13px] font-medium text-primary">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-yuunagi" aria-hidden="true" />
          スタートセット
        </p>

        <h1 className="mt-4 text-2xl md:text-[34px] font-serif leading-[1.6] tracking-wide text-primary">
          まずは、3品種を
          <br />
          食べ比べてみてください。
        </h1>

        <div className="mt-8 inline-flex items-center gap-2 rounded-sm bg-yuunagi-soft border border-yuunagi-soft px-4 py-2.5 text-[13px] text-yuunagi-ink">
          このページは準備中です
        </div>

        <div className="mt-8 flex flex-col gap-5 text-[13px] md:text-sm text-gray-600 leading-loose">
          <p>
            コシヒカリ・亀の尾・にこまる。同じ田んぼの、同じ育て方でも、品種が違えば味も香りも変わります。
            どれが自分の食卓に合うのか、まずは少量ずつ試していただくためのセットです。
          </p>
          <p>
            商品の登録が完了しだい、こちらから直接ご購入いただけるようになります。
            それまでは、各品種のページからお選びください。
          </p>
        </div>

        <dl className="mt-10 border-t border-gray-200">
          {[
            ['内容', 'コシヒカリ / 亀の尾 / にこまる の3品種'],
            ['価格', '1,872円（20%OFF）＋送料　※予定'],
            ['特典', '定期便で使える初回クーポン（送料無料・20%OFF）　※予定'],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col md:flex-row gap-1 md:gap-8 border-b border-gray-200 py-4">
              <dt className="shrink-0 w-full md:w-32 text-xs text-gray-500">{k}</dt>
              <dd className="text-[13px] md:text-sm text-primary">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/collections/rice"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm text-white hover:opacity-90 transition-opacity"
          >
            お米の一覧を見る
          </Link>
          <Link
            href="/collections/rice/yearly?view=lp"
            className="inline-flex items-center justify-center rounded-full border border-primary px-8 py-3.5 text-sm text-primary hover:bg-primary hover:text-white transition-colors"
          >
            定期便について見る
          </Link>
        </div>
      </div>
    </div>
  );
}
