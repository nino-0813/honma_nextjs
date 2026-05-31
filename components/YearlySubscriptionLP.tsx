'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Reason = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  image: string;
  imageAlt: string;
};

const REASONS: Reason[] = [
  {
    eyebrow: 'Reason 01',
    title: '毎月、いつでも10%OFF。',
    paragraphs: [
      '毎日食べるものだから、おいしさと続けやすさの両方を大事にしました。',
      '定期便でお申し込みいただくと、通常価格よりいつでも10%OFFでお届けします。',
      '一度きりのお買い得ではなく、イケベジのお米を日々のごはんとして選んでくださる方への定期便価格です。',
      '毎日の食卓をおいしく長く食べ続けてもらうための、イケベジの定期便です。',
    ],
    image: '/images/usage-scene.jpg',
    imageAlt: 'お米を毎日の食卓に',
  },
  {
    eyebrow: 'Reason 02',
    title: '専用保冷庫で保管。お届けに合わせて精米。',
    paragraphs: [
      'お米のおいしさは、田んぼで育つ時間だけでなく、収穫後の保管と、精米のタイミングでも変わります。',
      'イケベジでは、収穫したお米を専用保冷庫で保管しています。温度を管理しながら、お米の状態をできるだけ良く保つこと。そして、お届けに合わせて精米すること。',
      '田んぼから食卓までのあいだに、できることを一つずつ積み重ねてお届けします。',
      '精米したてのおいしさを、ご自宅でお楽しみください。',
    ],
    image: '/images/about/stories/IMG_8832.jpg',
    imageAlt: '佐渡の田んぼでお米を育てるイケベジ',
  },
];

export default function YearlySubscriptionLP() {
  return (
    <section className="mb-10 md:mb-16">
      {/* 01 キャッチコピー */}
      <div className="max-w-3xl mx-auto text-center mb-8 md:mb-12">
        <p className="text-[11px] md:text-xs text-amber-700 tracking-[0.3em] uppercase mb-3 font-medium">
          Subscription
        </p>
        <h2 className="text-xl md:text-3xl font-serif font-semibold text-primary leading-[1.55] md:leading-[1.4] mb-4">
          毎日のごはんに、
          <br className="md:hidden" />
          佐渡の田んぼをひとつ。
        </h2>
        <div className="w-10 h-px bg-amber-600 mx-auto mb-4" />
        <p className="text-xs md:text-sm text-gray-600 leading-loose">
          イケベジのお米を、必要な量だけ、必要なタイミングでお届けします。
          <br className="hidden md:block" />
          専用保冷庫で大切に保管したお米を、お届けに合わせて精米。
        </p>
      </div>

      {/* 02 2つの理由（画像付き横並びカード） */}
      <div className="space-y-6 md:space-y-8 mb-10 md:mb-14">
        {REASONS.map((r, idx) => (
          <div
            key={r.title}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all shadow-[0_10px_30px_-12px_rgba(0,0,0,0.12)]"
          >
            <div className={`grid grid-cols-1 md:grid-cols-2 ${idx % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              {/* 画像 */}
              <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[360px] bg-stone-100 overflow-hidden">
                <Image
                  src={r.image}
                  alt={r.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* テキスト */}
              <div className="p-6 md:p-10 flex flex-col justify-center">
                <p className="text-[11px] md:text-xs text-amber-700 tracking-[0.3em] uppercase mb-3 font-medium">
                  {r.eyebrow}
                </p>
                <h3 className="text-xl md:text-2xl font-bold text-primary mb-5 leading-snug tracking-[0.03em]">
                  {r.title}
                </h3>
                <div className="space-y-3 text-sm md:text-base text-gray-700 leading-loose">
                  {r.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 03 新規お申し込み特典 */}
      <div className="relative bg-amber-50/70 border border-amber-200 rounded-2xl overflow-hidden mb-10 md:mb-14 shadow-[0_15px_40px_-12px_rgba(0,0,0,0.22)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* 画像 */}
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[420px] bg-amber-100/50 overflow-hidden">
            <Image
              src="/images/rice-keep-bag.jpg"
              alt="新規お申し込み特典のお米保存袋"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              style={{ objectPosition: '50% 50%' }}
            />
            {/* 画像の左上に乗せる読みやすさ用のグラデーション */}
            <div className="absolute top-0 left-0 right-0 h-32 md:h-40 z-[5] bg-gradient-to-b from-black/45 via-black/20 to-transparent pointer-events-none" />

            {/* GIFTラベル（明朝＋細罫線でロゴ風） */}
            <div className="absolute top-6 left-6 md:top-10 md:left-10 z-10 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                <span className="w-8 md:w-14 h-px bg-white" />
                <span className="text-[11px] md:text-sm tracking-[0.35em] font-medium uppercase">
                  For New Members
                </span>
              </div>
              <p className="font-serif text-5xl md:text-7xl tracking-[0.2em] leading-none">
                Gift
              </p>
            </div>
          </div>

          {/* テキスト */}
          <div className="p-6 md:py-8 md:px-10 flex flex-col justify-center">
            <p className="text-[11px] md:text-sm text-amber-700 tracking-[0.25em] uppercase mb-3 font-medium">
              New Member Gift
            </p>

            {/* 見出し: 小さなラベル＋大きなメイン */}
            <div className="mb-5">
              <p className="text-sm md:text-base text-amber-800 mb-2 font-semibold tracking-[0.05em]">
                新規お申し込み特典
              </p>
              <h3 className="text-2xl md:text-[1.875rem] font-bold text-amber-900 leading-[1.4] tracking-[0.04em]">
                究極のお米保存袋をプレゼント
              </h3>
            </div>

            <p className="text-sm md:text-base text-amber-900/80 leading-loose mb-5 font-semibold">
              新しく定期便をお申し込みいただいた方に、
              <br className="hidden md:block" />
              「冷蔵庫のいらないお米保存袋」をプレゼントします。
            </p>
            <ul className="space-y-2 font-semibold">
              {['防虫・防湿に強い専用素材', '冷蔵庫不要でシンク下にも収まる', '繰り返し使えるジッパー付き'].map(
                (item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs md:text-sm text-amber-900/80">
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5 text-amber-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ),
              )}
            </ul>
            <p className="mt-4 text-[11px] md:text-xs text-amber-700/70 font-bold">
              ※数量限定・なくなり次第終了
            </p>
          </div>
        </div>
      </div>

      {/* 04 商品一覧見出し */}
      <div id="ikevege-subscription" className="text-center mb-6 mt-10 md:mt-14 pt-6 border-t border-gray-100 scroll-mt-28">
        <p className="text-[11px] text-gray-500 tracking-[0.25em] uppercase mb-3">Products</p>
        <h3 className="text-xl md:text-2xl font-serif font-medium text-primary tracking-wider mb-2">
          イケベジ定期便
        </h3>
        <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
          すべて<span className="text-amber-700 font-medium">10%OFF</span>でお届けします。
        </p>
      </div>
    </section>
  );
}

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: '何kgから申し込めますか？',
    a: '商品一覧より、ご家庭に合った量をお選びいただけます。まずは5kgからのご利用がおすすめです。',
  },
  {
    q: '毎月の量を変更できますか？',
    a: '変更可能な場合は、マイページまたはお問い合わせよりお手続きいただけます。ご家庭のお米の減り方に合わせて調整してください。',
  },
  {
    q: 'スキップはできますか？',
    a: 'はい。旅行や外食が続いた月など、お米が余りそうな場合はスキップできます。マイページから簡単に操作いただけます。',
  },
  {
    q: '解約に回数制限はありますか？',
    a: '定期便はいつでも解約可能です。次回発送準備の都合上、変更・解約には締切日を設ける場合がございますので、余裕をもってお手続きください。',
  },
  {
    q: '保存方法は？',
    a: '直射日光・高温多湿を避け、涼しい場所で保管してください。新規お申し込み特典として、ご家庭でも保管しやすい「お米保存袋」をご用意しています。',
  },
];

export function YearlySubscriptionFooter() {
  const handleScrollToProducts = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById('ikevege-subscription');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="mt-16 md:mt-24 border-t border-gray-100 pt-12 md:pt-16">
      {/* 05 私たちの想い（画像左 + テキスト右） */}
      <div className="max-w-6xl mx-auto px-2 mb-16 md:mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* 画像（左） */}
          <div className="relative aspect-[4/5] md:aspect-[4/5] rounded-2xl overflow-hidden shadow-[0_15px_40px_-12px_rgba(0,0,0,0.2)]">
            <Image
              src="/images/about/stories/about_story_taue_123.jpg"
              alt="佐渡の田んぼで田植えをするイケベジ"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {/* テキスト（右） */}
          <div className="md:pl-2">
            <p className="text-[11px] md:text-xs text-amber-700 tracking-[0.3em] uppercase mb-3 font-medium">
              Our Thoughts
            </p>
            <h3 className="text-2xl md:text-3xl font-serif font-semibold text-primary tracking-wider mb-6 md:mb-8">
              私たちの想い
            </h3>
            <div className="space-y-5 text-sm md:text-base text-gray-700 leading-loose">
              <p>
                みなさんに安心して、美味しいお米を食べてほしい。
                <br />
                必要な量を、必要なタイミングで、いつでも新鮮な状態で食卓に届けること。
                <br />
                それが、私たちイケベジがこのサブスクを始めた一番の理由です。
              </p>
              <p>
                イケベジ定期便は私たち農家にとっても大きな支えになります。
                <br />
                繁忙期に販売の心配をすることなく100%「最高の米作り」に集中できる。
                <br />
                そして子どもたちの体験活動も積極的に受け入れることができます。
              </p>
              <p>
                食べる人と、作る人が、お米を通じてゆるやかにつながる。
                <br />
                私たちにとって、これ以上ないほどありがたく、大切な、お客様との新しい関係のカタチです。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 06 定期便のご利用について */}
      <div className="max-w-3xl mx-auto px-2 mb-16 md:mb-24">
        <div className="text-center mb-8">
          <p className="text-[11px] text-gray-500 tracking-[0.25em] uppercase mb-3">How It Works</p>
          <h3 className="text-xl md:text-2xl font-serif font-semibold text-primary tracking-wider">
            定期便のご利用について
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {[
            {
              title: 'お届けサイクル',
              body: '毎月1回、ご指定のサイクルでお届けします。お届け日や時間帯の指定が可能な場合は、ご注文画面にてお選びください。',
            },
            {
              title: 'スキップ・休止',
              body: '旅行や外食が続いた月など、お米が余りそうな場合は、次回分のスキップや休止が可能です。',
            },
            {
              title: '解約について',
              body: '定期便はいつでも解約できます。次回発送準備の都合上、変更・解約には締切日を設ける場合があります。',
            },
            {
              title: '精米について',
              body: '白米は、お届けに合わせて精米します。玄米をご希望の方は、玄米商品をお選びください。',
            },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
              <h4 className="text-sm md:text-base font-semibold text-primary mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-amber-600 rounded-full" />
                {item.title}
              </h4>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 07 よくある質問 */}
      <div className="max-w-3xl mx-auto px-2 mb-16 md:mb-24">
        <div className="text-center mb-8">
          <p className="text-[11px] text-gray-500 tracking-[0.25em] uppercase mb-3">FAQ</p>
          <h3 className="text-xl md:text-2xl font-serif font-medium text-primary tracking-wider">
            よくある質問
          </h3>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="group border border-gray-200 rounded-xl bg-white open:shadow-sm open:border-amber-200 transition-all"
            >
              <summary className="flex items-center justify-between cursor-pointer p-4 md:p-5 list-none">
                <span className="text-sm md:text-base font-medium text-primary pr-4">
                  <span className="text-amber-600 mr-2">Q.</span>
                  {item.q}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 md:px-5 pb-4 md:pb-5 text-xs md:text-sm text-gray-600 leading-relaxed">
                <span className="text-amber-600 font-medium mr-2">A.</span>
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* 送料について */}
      <div className="max-w-3xl mx-auto px-2 mb-16 md:mb-24">
        <div className="text-center mb-6">
          <p className="text-[11px] text-gray-500 tracking-[0.25em] uppercase mb-3">Shipping</p>
          <h3 className="text-xl md:text-2xl font-serif font-medium text-primary tracking-wider">
            送料について
          </h3>
        </div>
        <div className="bg-gray-50 rounded-xl p-5 md:p-6 text-xs md:text-sm text-gray-600 leading-relaxed space-y-2">
          <p>
            毎回のお届け時に送料が別途かかります。送料は配送地域・商品の重量サイズによって異なります。
          </p>
          <p>
            詳細は
            <Link href="/legal" className="underline hover:text-black mx-1">
              特定商取引法に基づく表記
            </Link>
            をご確認ください。
          </p>
        </div>
      </div>

      {/* 08 最後のCTA */}
      <div className="relative max-w-4xl mx-auto px-2">
        <div className="bg-gradient-to-b from-stone-50 to-amber-50/40 rounded-3xl px-6 md:px-12 py-14 md:py-20 text-center">
          <h3 className="text-xl md:text-3xl font-serif font-semibold text-primary leading-[1.6] md:leading-[1.5] mb-6">
            毎日のごはんに、
            <br className="md:hidden" />
            佐渡の田んぼをひとつ。
          </h3>
          <div className="w-10 h-px bg-amber-600 mx-auto mb-6" />
          <p className="text-sm md:text-base text-primary font-medium mb-8">
            イケベジのお米の定期便、はじめてみませんか。
          </p>
          <a
            href="#ikevege-subscription"
            onClick={handleScrollToProducts}
            className="inline-flex items-center gap-2 bg-primary text-white text-xs md:text-sm tracking-[0.2em] uppercase px-8 md:px-10 py-4 rounded-full hover:bg-amber-700 transition-colors"
          >
            定期便の商品を見る
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
