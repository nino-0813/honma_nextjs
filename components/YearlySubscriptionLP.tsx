'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Reason = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const REASONS: Reason[] = [
  {
    title: '毎月、いつでも10%OFF',
    description: '毎日食べるお米を、通常価格より10%OFFでお届けします。',
    icon: (
      <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6M9.5 9.5h.01M14.5 14.5h.01M5.25 4.5h13.5a1.5 1.5 0 011.5 1.5v13.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5z" />
      </svg>
    ),
  },
  {
    title: '保冷庫で保管。お届けに合わせて精米',
    description: '収穫したお米を専用保冷庫で保管し、お届けに合わせて精米します。',
    icon: (
      <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12a1.5 1.5 0 011.5 1.5v15a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5v-15A1.5 1.5 0 016 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 11h15M9 6.5v2M9 14v2" />
      </svg>
    ),
  },
  {
    title: '買い忘れの心配を減らせる',
    description: '必要な量を毎月ご自宅へ。お米が余りそうな月はスキップや休止も可能です。',
    icon: (
      <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

type RiceVariety = {
  name: string;
  description: string;
};

const RICE_VARIETIES: RiceVariety[] = [
  {
    name: 'コシヒカリ',
    description: '佐渡の自然で育った定番米。炊き上がりの香り、甘み、もっちり感を楽しみたい方へ。',
  },
  {
    name: '亀の尾',
    description: '昔ながらの品種。派手さよりも、じんわりとした旨みや素朴な味わいを楽しめるお米です。',
  },
  {
    name: 'にこまる',
    description: '粒感があり、冷めてもおいしさを感じやすいお米。お弁当やおにぎりにもおすすめです。',
  },
];

export default function YearlySubscriptionLP() {
  return (
    <section className="mb-10 md:mb-16">
      {/* 01 キャッチコピー */}
      <div className="max-w-3xl mx-auto text-center mb-8 md:mb-12">
        <p className="text-[11px] md:text-xs text-amber-700 tracking-[0.3em] uppercase mb-3 font-medium">
          Annual Subscription
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

      {/* 02 3つの理由 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mb-4 md:mb-6">
        {REASONS.map((r) => (
          <div
            key={r.title}
            className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 flex md:flex-col items-center md:items-start gap-4 md:gap-4 hover:shadow-md hover:border-amber-200 transition-all"
          >
            <div className="flex-shrink-0 w-11 h-11 md:w-14 md:h-14 bg-primary text-white rounded-xl flex items-center justify-center">
              {r.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm md:text-base font-semibold text-primary mb-1 md:mb-2 leading-snug">
                {r.title}
              </h3>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{r.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 03 新規お申し込み特典 */}
      <div className="relative bg-amber-50/70 border border-amber-200 rounded-2xl overflow-hidden mb-10 md:mb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* 画像 */}
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[480px] bg-amber-100/50 overflow-hidden">
            <Image
              src="/images/rice-keep-bag.jpg"
              alt="新規お申し込み特典のお米保存袋"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover scale-[1.05] md:scale-110"
              style={{ objectPosition: '62% 52%' }}
            />
            {/* GIFTラベル（白文字・白枠・うっすら黒背景） */}
            <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 px-5 py-2 md:px-7 md:py-3 border-2 border-white text-white font-serif text-xl md:text-4xl tracking-[0.2em] bg-black/35 backdrop-blur-[2px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
              GIFT
            </div>
          </div>

          {/* テキスト */}
          <div className="p-6 md:p-10 flex flex-col justify-center">
            <p className="text-[11px] md:text-sm text-amber-700 tracking-[0.25em] uppercase mb-3 font-medium">
              New Member Gift
            </p>
            <h3 className="text-lg md:text-2xl font-semibold text-amber-900 mb-4 leading-snug tracking-tight">
              新規お申し込み特典／お米保存袋をプレゼント
            </h3>
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
            <p className="mt-5 text-[11px] md:text-xs text-amber-700/70 font-bold">
              ※数量限定・なくなり次第終了
            </p>
          </div>
        </div>
      </div>

      {/* 04 商品一覧見出し */}
      <div className="text-center mb-6 mt-10 md:mt-14 pt-6 border-t border-gray-100">
        <p className="text-[11px] text-gray-500 tracking-[0.25em] uppercase mb-3">Products</p>
        <h3 className="text-xl md:text-2xl font-serif font-medium text-primary tracking-wider mb-2">
          定期便商品一覧
        </h3>
        <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
          ご家庭に合った量と品種をお選びください。
          <br className="md:hidden" />
          定期便なら、いつでも<span className="text-amber-700 font-medium">10%OFF</span>でお届けします。
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
  return (
    <section className="mt-16 md:mt-24 border-t border-gray-100 pt-12 md:pt-16">
      {/* 05 イケベジのお米について */}
      <div className="max-w-4xl mx-auto px-2 mb-16 md:mb-24">
        <div className="text-center mb-8">
          <p className="text-[11px] text-gray-500 tracking-[0.25em] uppercase mb-3">About Our Rice</p>
          <h3 className="text-xl md:text-2xl font-serif font-semibold text-primary tracking-wider mb-3">
            イケベジのお米について
          </h3>
          <p className="text-base md:text-lg font-serif text-amber-700">余計なものは足さない。</p>
        </div>
        <p className="text-sm md:text-[15px] text-gray-700 leading-loose text-center max-w-2xl mx-auto mb-8 md:mb-10">
          自然栽培の考えをベースに、佐渡ヶ島の有機資源を活かして土を育てています。
          品種がもともと持っている旨みや香りを、できるだけまっすぐお届けします。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {RICE_VARIETIES.map((v) => (
            <div
              key={v.name}
              className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 hover:shadow-md hover:border-amber-200 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-600">●</span>
                <h4 className="text-base md:text-lg font-serif font-medium text-primary">{v.name}</h4>
              </div>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[11px] md:text-xs text-gray-500 text-center">
          ※販売商品・在庫状況により、選べる品種は変更になる場合があります。
        </p>
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
          <p className="text-[11px] text-amber-700 tracking-[0.3em] uppercase mb-4 font-medium">Closing</p>
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
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
