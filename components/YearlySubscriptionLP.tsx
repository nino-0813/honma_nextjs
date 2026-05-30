'use client';

import React from 'react';
import Link from 'next/link';

type Reason = {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const REASONS: Reason[] = [
  {
    number: '01',
    title: '毎月、いつでも10%OFF。',
    description:
      '毎日食べるものだから、おいしさと続けやすさの両方を大事にしました。定期便でお申し込みいただくと、通常価格よりいつでも10%OFFでお届け。一度きりのお買い得ではなく、イケベジのお米を日々のごはんとして選んでくださる方への定期便価格です。',
    icon: (
      <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5h6m-6 4.5h6m-6 4.5h3M5.25 4.5h13.5a1.5 1.5 0 011.5 1.5v13.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 9l-4 6M10 9.5a.5.5 0 100-1 .5.5 0 000 1zm4 5a.5.5 0 100-1 .5.5 0 000 1z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: '専用保冷庫で保管。お届けに合わせて精米。',
    description:
      'お米のおいしさは、田んぼで育つ時間だけでなく、収穫後の保管と、精米のタイミングでも変わります。イケベジでは収穫したお米を専用保冷庫で温度管理し、お届けに合わせて精米。田んぼから食卓までのあいだに、できることを一つずつ積み重ねてお届けします。',
    icon: (
      <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12a1.5 1.5 0 011.5 1.5v15a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5v-15A1.5 1.5 0 016 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 11h15M9 6.5v2M9 14v2" />
      </svg>
    ),
  },
  {
    number: '03',
    title: '新規お申し込み特典。お米保存袋をプレゼント。',
    description:
      'お米は届いたあとも、保管が大切です。新しく定期便をお申し込みいただいた方には、ご家庭でもお米をおいしく保管しやすい「冷蔵庫のいらないお米保存袋」をプレゼント。最後の一杯までおいしく食べてもらいたい、そんな思いからご用意した定期便限定の特典です。',
    icon: (
      <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
];

type RiceVariety = {
  name: string;
  tagline: string;
  description: string;
};

const RICE_VARIETIES: RiceVariety[] = [
  {
    name: 'コシヒカリ',
    tagline: 'イケベジの定番米。',
    description:
      '佐渡の自然の中で育った、イケベジの定番米。炊き上がりの香り、甘み、もっちり感を楽しみたい方へ。',
  },
  {
    name: '亀の尾',
    tagline: '昔ながらの素朴な味わい。',
    description:
      '昔ながらの品種を味わいたい方へ。派手さよりも、じんわりとした旨みや素朴な味わいを楽しめるお米です。',
  },
  {
    name: 'にこまる',
    tagline: '冷めてもおいしい。',
    description:
      '粒感があり、冷めてもおいしさを感じやすいお米。お弁当やおにぎりにもおすすめです。',
  },
];

export default function YearlySubscriptionLP() {
  return (
    <section className="mb-12 md:mb-16">
      {/* HERO */}
      <div className="relative mb-16 md:mb-24 pt-4 md:pt-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] md:text-xs text-amber-700 tracking-[0.3em] uppercase mb-4 font-medium">
            Annual Subscription
          </p>
          <h2 className="text-2xl md:text-4xl font-serif font-medium text-primary leading-[1.5] md:leading-[1.4] mb-6">
            毎日のごはんに、
            <br className="md:hidden" />
            佐渡の田んぼをひとつ。
          </h2>
          <div className="w-12 h-px bg-amber-600 mx-auto mb-6" />
          <p className="text-sm md:text-base text-gray-700 leading-loose">
            イケベジのお米を、必要な量だけ、必要なタイミングで。
            <br />
            専用保冷庫で大切に保管したお米を、お届けに合わせて精米し、
            <br className="hidden md:block" />
            毎月あなたの食卓へお届けします。
          </p>
          <p className="mt-6 text-sm md:text-base text-amber-800 leading-relaxed">
            <span className="inline-block bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5">
              通常価格より <span className="font-semibold">10%OFF</span>　/　買い忘れの心配なし
            </span>
          </p>
        </div>
      </div>

      {/* ストーリー：毎月届く、佐渡のごはん */}
      <div className="max-w-3xl mx-auto px-2 mb-16 md:mb-24">
        <div className="text-center mb-8 md:mb-10">
          <p className="text-[11px] text-gray-500 tracking-[0.25em] uppercase mb-3">Story</p>
          <h3 className="text-xl md:text-2xl font-serif font-medium text-primary tracking-wider">
            毎月届く、佐渡のごはん。
          </h3>
        </div>
        <div className="text-sm md:text-[15px] text-gray-700 leading-loose space-y-5 text-center md:text-left">
          <p>お米は、毎日のものです。</p>
          <p>
            朝に炊くごはん。お弁当に入れるごはん。
            <br className="hidden md:block" />
            夜、家族で囲むごはん。ひとりでほっと食べるごはん。
          </p>
          <p>その毎日に、佐渡の田んぼで育ったお米を届けたい。</p>
          <p>
            イケベジの定期便は、
            <br className="hidden md:block" />
            必要な量を、必要なタイミングでお届けする仕組みです。
          </p>
          <ul className="space-y-1.5 pl-0 md:pl-4 list-none text-gray-700">
            <li className="flex items-start justify-center md:justify-start gap-2">
              <span className="text-amber-600 mt-1">―</span>
              <span>買い忘れを減らすこと。</span>
            </li>
            <li className="flex items-start justify-center md:justify-start gap-2">
              <span className="text-amber-600 mt-1">―</span>
              <span>おいしい状態で届けること。</span>
            </li>
            <li className="flex items-start justify-center md:justify-start gap-2">
              <span className="text-amber-600 mt-1">―</span>
              <span>食べる人と田んぼの距離を近づけること。</span>
            </li>
          </ul>
          <p className="pt-2">
            毎月届くお米を通して、イケベジの米づくりを暮らしの中で
            <br className="hidden md:block" />
            味わっていただけたらうれしいです。
          </p>
        </div>
      </div>

      {/* 3つの理由 */}
      <div className="mb-16 md:mb-24">
        <div className="text-center mb-10 md:mb-12">
          <p className="text-[11px] text-gray-500 tracking-[0.25em] uppercase mb-3">Reasons</p>
          <h3 className="text-xl md:text-2xl font-serif font-medium text-primary tracking-wider">
            イケベジ定期便を
            <br className="md:hidden" />
            おすすめする3つの理由
          </h3>
        </div>
        <div className="space-y-5 md:space-y-6">
          {REASONS.map((r) => (
            <div
              key={r.number}
              className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-5 md:gap-7 hover:shadow-md hover:border-amber-200 transition-all"
            >
              <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-3 md:w-32 flex-shrink-0">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary text-white rounded-xl flex items-center justify-center">
                  {r.icon}
                </div>
                <div className="md:mt-1">
                  <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">Reason</p>
                  <p className="font-serif text-2xl md:text-3xl text-amber-700 leading-none">{r.number}</p>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base md:text-lg font-medium text-primary mb-3 leading-snug">
                  {r.title}
                </h4>
                <p className="text-xs md:text-sm text-gray-600 leading-loose">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[11px] md:text-xs text-gray-500 text-center">
          ※特典は数量限定となる場合があります。
        </p>
      </div>

      {/* イケベジのお米について */}
      <div className="mb-16 md:mb-24 bg-stone-50 rounded-2xl px-6 md:px-12 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[11px] text-gray-500 tracking-[0.25em] uppercase mb-3">About Our Rice</p>
            <h3 className="text-xl md:text-2xl font-serif font-medium text-primary tracking-wider mb-3">
              イケベジのお米について
            </h3>
            <p className="text-base md:text-lg font-serif text-amber-700">
              余計なものは足さない。
            </p>
          </div>
          <div className="text-sm md:text-[15px] text-gray-700 leading-loose space-y-5 text-center md:text-left">
            <p>
              イケベジのお米づくりは、自然栽培の考えをベースにしています。
              品種がもともと持っている旨みや香りを、できるだけまっすぐ届けるために。
            </p>
            <p>
              佐渡ヶ島の有機資源を活かし、土を育て、自然の流れにできるだけ寄り添いながら米づくりをしています。
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              {['佐渡の森、里、海。', '田んぼに集まる生きものたち。', '土の中で起きていること。', '日々変わる水と、天気と、稲の姿。'].map(
                (tag) => (
                  <span
                    key={tag}
                    className="text-[11px] md:text-xs px-3 py-1 bg-white border border-stone-200 text-gray-700 rounded-full"
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
            <p className="pt-3">
              その積み重ねの先にある一粒を、毎日のごはんとしてお楽しみください。
            </p>
          </div>
        </div>
      </div>

      {/* 選べるお米 */}
      <div className="mb-12 md:mb-16">
        <div className="text-center mb-8 md:mb-10">
          <p className="text-[11px] text-gray-500 tracking-[0.25em] uppercase mb-3">Variety</p>
          <h3 className="text-xl md:text-2xl font-serif font-medium text-primary tracking-wider mb-3">
            選べるお米
          </h3>
          <p className="text-xs md:text-sm text-gray-600">
            あなたの食卓に合うお米をお選びください。
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {RICE_VARIETIES.map((v) => (
            <div
              key={v.name}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-amber-200 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-600 text-lg">●</span>
                <h4 className="text-lg md:text-xl font-serif font-medium text-primary">{v.name}</h4>
              </div>
              <p className="text-xs md:text-sm font-medium text-amber-700 mb-3">{v.tagline}</p>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[11px] md:text-xs text-gray-500 text-center">
          ※販売商品・在庫状況により、選べる品種は変更になる場合があります。
        </p>
      </div>

      {/* 商品一覧見出し */}
      <div className="text-center mb-6 mt-16 md:mt-24 pt-6 border-t border-gray-100">
        <p className="text-[11px] text-gray-500 tracking-[0.25em] uppercase mb-3">Products</p>
        <h3 className="text-xl md:text-2xl font-serif font-medium text-primary tracking-wider mb-3">
          毎月届く、イケベジのお米。
        </h3>
        <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
          ご家庭に合った量と品種をお選びください。
          <br className="md:hidden" />
          定期便なら、通常価格よりいつでも<span className="text-amber-700 font-medium">10%OFF</span>でお届けします。
        </p>
      </div>
    </section>
  );
}

const RECOMMENDED_FOR: string[] = [
  '毎月お米を買う手間を減らしたい方。',
  'おいしいお米を、いい状態で食べたい方。',
  '農薬に頼らないお米づくりに関心がある方。',
  '佐渡のお米を、暮らしの中で楽しみたい方。',
  '作り手の顔や考えが見えるお米を選びたい方。',
  '子どもにも安心して食べさせられるお米を探している方。',
  'イケベジの活動を、食べることで応援したい方。',
];

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
  {
    q: '精米について教えてください。',
    a: '白米は、お届けに合わせて精米します。玄米でのお届けをご希望の方は、玄米商品をお選びください。',
  },
];

export function YearlySubscriptionFooter() {
  return (
    <section className="mt-16 md:mt-24 border-t border-gray-100 pt-12 md:pt-16">
      {/* こんな方におすすめです */}
      <div className="max-w-4xl mx-auto px-2 mb-16 md:mb-24">
        <div className="text-center mb-8 md:mb-10">
          <p className="text-[11px] text-gray-500 tracking-[0.25em] uppercase mb-3">Recommended For</p>
          <h3 className="text-xl md:text-2xl font-serif font-medium text-primary tracking-wider">
            こんな方におすすめです
          </h3>
        </div>
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 md:p-10">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {RECOMMENDED_FOR.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 text-amber-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-xs md:text-sm text-gray-700 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs md:text-sm text-gray-600 leading-relaxed text-center">
            毎日のごはんを通して、佐渡の田んぼや米づくりに触れてもらう。
            <br />
            そんな入り口として、イケベジのお米の定期便をご利用ください。
          </p>
        </div>
      </div>

      {/* 私たちの想い */}
      <div className="max-w-3xl mx-auto px-2 mb-16 md:mb-24">
        <div className="text-center mb-8 md:mb-10">
          <p className="text-[11px] text-gray-500 tracking-[0.25em] uppercase mb-3">Our Thoughts</p>
          <h3 className="text-xl md:text-2xl font-serif font-medium text-primary tracking-wider mb-3">
            私たちの想い
          </h3>
          <p className="text-base md:text-lg font-serif text-amber-700">
            食べることから、田んぼをひらく。
          </p>
        </div>
        <div className="text-sm md:text-[15px] text-gray-700 leading-loose space-y-5">
          <p>
            みなさんに、安心して、おいしいお米を食べてほしい。
            必要な量を、必要なタイミングで。できるだけ良い状態で。
            毎日の食卓に、無理なく届けていきたい。
          </p>
          <p>それが、イケベジが定期便を始める理由です。</p>
          <p>この定期便は、私たち農家にとっても大きな支えになります。</p>
          <div className="bg-stone-50 rounded-xl p-5 md:p-6 space-y-1.5">
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">― 土を育てる時間。</p>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">― 水を見る時間。</p>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">― 稲の変化に気づく時間。</p>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
              ― 子どもたちや地域の人たちを田んぼに迎える時間。
            </p>
          </div>
          <p>
            定期便でお米を選んでくださる方が増えることで、
            私たちは販売の不安を減らし、より良い米づくりと、田んぼをひらく活動に力を注ぐことができます。
          </p>
          <div className="text-center py-4">
            <p className="font-serif text-base md:text-lg text-primary leading-loose">
              食べる人がいるから、田んぼを続けていける。
              <br />
              田んぼが続くから、そこに生きものが集まり、
              <br />
              子どもたちが学び、地域の風景が残っていく。
            </p>
          </div>
          <p>
            毎月のお米は、その循環を一緒につくっていくための入口です。
          </p>
        </div>
      </div>

      {/* 定期便のご利用について */}
      <div className="max-w-3xl mx-auto px-2 mb-16 md:mb-24">
        <div className="text-center mb-8">
          <p className="text-[11px] text-gray-500 tracking-[0.25em] uppercase mb-3">How It Works</p>
          <h3 className="text-xl md:text-2xl font-serif font-medium text-primary tracking-wider">
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
              <h4 className="text-sm md:text-base font-medium text-primary mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-amber-600 rounded-full" />
                {item.title}
              </h4>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* よくある質問 */}
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

      {/* クロージング */}
      <div className="relative max-w-4xl mx-auto px-2">
        <div className="bg-gradient-to-b from-stone-50 to-amber-50/40 rounded-3xl px-6 md:px-12 py-14 md:py-20 text-center">
          <p className="text-[11px] text-amber-700 tracking-[0.3em] uppercase mb-4 font-medium">Closing</p>
          <h3 className="text-xl md:text-3xl font-serif font-medium text-primary leading-[1.6] md:leading-[1.5] mb-6">
            毎日のごはんに、
            <br className="md:hidden" />
            佐渡の田んぼをひとつ。
          </h3>
          <div className="w-12 h-px bg-amber-600 mx-auto mb-6" />
          <div className="text-sm md:text-[15px] text-gray-700 leading-loose space-y-4 max-w-2xl mx-auto">
            <p>
              朝、炊きたてのごはんをよそう。お弁当に詰める。
              <br />
              夜、茶碗を持ってひと息つく。
            </p>
            <p>毎日のごはんは、暮らしのいちばん近くにあります。</p>
            <p>
              そのごはんが、どこで育ち、誰の手を通り、
              <br className="hidden md:block" />
              どんな田んぼから届いたものなのか。
            </p>
            <p>
              そこに少しでも思いを寄せてもらえたら、
              <br className="hidden md:block" />
              食卓の景色は変わっていくと思っています。
            </p>
          </div>
          <p className="mt-8 text-sm md:text-base text-primary font-medium">
            イケベジのお米の定期便、はじめてみませんか。
          </p>
          <div className="mt-8">
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
      </div>
    </section>
  );
}
