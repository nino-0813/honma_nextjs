'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Reason = {
  title: string;
  description: string;
};

const REASONS: Reason[] = [
  {
    title: 'いつでも10%OFF',
    description: '通常価格よりいつでも10%OFFでお届け',
  },
  {
    title: '瑞々しいお米を一年中',
    description: '専用の保冷庫で保管、管理したお米を、発送直前に精米',
  },
];

export default function YearlySubscriptionLP() {
  return (
    <section className="mt-12 md:mt-16 mb-10 md:mb-16">
      {/* 01 キャッチコピー */}
      <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
        <h2 className="text-xl md:text-3xl font-serif font-semibold text-primary leading-[1.55] md:leading-[1.4] mb-4">
          ともに作り、守り、育てていく
        </h2>
      </div>

      {/* 02 定期便で届ける2つの価値 */}
      <div className="mb-10 grid border-y border-gray-200 md:mb-14 md:grid-cols-2 md:divide-x md:divide-gray-200">
        {REASONS.map((reason) => (
          <div key={reason.title} className="flex min-h-48 flex-col justify-center px-6 py-10 text-center md:min-h-64 md:px-12 md:py-14">
            <h3 className="font-serif text-xl font-semibold leading-relaxed tracking-[0.06em] text-primary md:text-2xl">
              {reason.title}
            </h3>
            <p className="mt-5 text-sm leading-loose text-gray-600 md:text-base">
              {reason.description}
            </p>
          </div>
        ))}
      </div>

      {/* 03 新規お申し込み特典 */}
      <div className="relative mb-10 overflow-hidden bg-yuunagi-soft/70 md:mb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* 画像 */}
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[420px] bg-yuunagi-soft/50 overflow-hidden">
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
              <p className="font-serif text-4xl tracking-[0.2em] leading-none md:text-5xl">
                Gift
              </p>
            </div>
          </div>

          {/* テキスト */}
          <div className="p-6 md:py-12 md:px-12 flex flex-col justify-center">
            <div className="mb-7 md:mb-9">
              <p className="mb-1 font-serif text-xl font-medium leading-snug tracking-[0.04em] text-yuunagi-ink md:text-2xl">
                新規お申し込み特典
              </p>
              <p className="mb-2 text-xs leading-relaxed tracking-[0.06em] text-yuunagi-ink/80 md:text-sm">
                保存袋のプロ × お米のプロが共同開発
              </p>
              <h3 className="font-serif text-[26px] font-bold leading-[1.4] tracking-[0.03em] text-yuunagi-ink md:text-[32px]">
                究極のお米保存袋をプレゼント
              </h3>
            </div>

            <ul className="space-y-3 md:space-y-4 font-medium mb-8 md:mb-10">
              {['防虫・防湿に強い専用素材', '冷蔵庫不要で、常温保存が可能'].map(
                (item) => (
                  <li key={item} className="flex items-start gap-3 text-lg leading-relaxed text-yuunagi-ink/90 md:text-xl">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6 text-yuunagi flex-shrink-0 mt-0.5"
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

            <div className="pt-4 border-t border-yuunagi-soft/60 space-y-1.5">
              <p className="text-[10px] leading-relaxed text-yuunagi-ink/75 font-bold">
                ※数量限定・なくなり次第終了
              </p>
              <p className="text-[10px] leading-relaxed text-yuunagi-ink/75">
                ※お米保存袋は1アカウントにつきおひとつまでとなります。複数種類のお米や期間の異なる定期便をご注文いただいてもプレゼントはおひとつとなります。
              </p>
              <Link href="/rice-keep" className="mt-4 inline-flex text-sm md:text-base font-semibold text-yuunagi-ink underline underline-offset-4">
                お米保存袋「Rice Keep」を見る →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 04 商品一覧見出し */}
      <div id="ikevege-subscription" className="text-center mb-6 mt-20 md:mt-28 pt-6 border-t border-gray-100 scroll-mt-28">
        <h3 className="mx-auto max-w-3xl font-serif text-lg font-medium leading-loose tracking-wider text-primary md:text-2xl">
          田んぼから食卓までのあいだに、できることを一つずつ積み重ねてお届けします。
        </h3>
      </div>
    </section>
  );
}

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: '何kgから申し込めますか？',
    a: '商品一覧より、ご家庭に合った量をお選びいただけます。\nまずは5kgからのご利用がおすすめです。',
  },
  {
    q: '初回のお届けはいつになりますか？',
    a: '毎月10日までのお申し込みで、当月15日頃に発送いたします。\n11日以降のお申し込みは、翌月からの発送開始となります。\n2026年度産のお米からのスタートとなるため、コシヒカリ・亀の尾は2026年10月10日、にこまるは2026年11月10日までのお申し込みで初回発送となります。\n詳しくは各商品ページをご覧ください。',
  },
  {
    q: 'お届け日は変更できますか？',
    a: 'お届け日の指定は承っておりません。',
  },
  {
    q: '配送先を変更できますか？',
    a: 'お問い合わせ先までご連絡ください。\n配送先によっては、送料が変更となる場合があります。\n変更期限は、次回発送予定月の9日までです。',
  },
  {
    q: '毎月の量を変更できますか？',
    a: '毎月の量は変更できません。\n量を変更したい場合は、一度解約後、ご希望の量で新しくお申し込みください。',
  },
  {
    q: 'スキップはできますか？',
    a: 'はい、可能です。\nお米が余ってしまった場合などは、マイページより次回配送をスキップできます。（2回連続は不可）\n※次回発送予定月の9日までにお手続きください。',
  },
  {
    q: 'お届けサイクルは変更できますか？',
    a: 'マイページから変更できます。\nご不明な場合は、お気軽にお問い合わせください。',
  },
  {
    q: 'お米が足りなくなりそうです。次回のお届けを早めることはできますか？',
    a: '申し訳ございません。配送サイクルの変更は次回お届け分以降からの反映となるため、現在予定されているお届け日を早めることはできません。\nもしお米が早めに必要な場合は、一度マイページから定期購入をキャンセルし、ご希望のタイミングで新たにお申し込みいただくことでお届け日を調整いただけます。',
  },
  {
    q: '解約に回数制限はありますか？',
    a: 'ございません。\n2回目以降の発送分は、次回発送予定月の9日までに解約申込いただければストップできます。\nなお、お申し込み完了後の初回分のキャンセルは、決済が完了しているためお受けできかねますのでご了承ください。',
  },
  {
    q: '新米はいつから届きますか？',
    a: 'コシヒカリ・亀の尾は毎年10月、にこまるは毎年11月より新米へ切り替わります。',
  },
  {
    q: '注文ごとに精米していますか？',
    a: 'よりおいしく召し上がっていただくため、発送前に精米したお米をお届けしています。',
  },
  {
    q: '保存方法は？',
    a: '直射日光・高温多湿を避け、涼しい場所で保管してください。\n新規お申し込み特典として、ご家庭でも保管しやすい「お米保存袋」をご用意しています。',
  },
  {
    q: 'お米保存袋のプレゼントはひとつだけですか？',
    a: 'お米保存袋は1アカウントにつき、おひとつまでとなります。\n複数種類のお米や期間の異なる定期便をご注文いただいてもプレゼントはおひとつとなります。',
  },
  {
    q: 'お米の賞味期限はありますか？',
    a: '賞味期限の表示はありません。\nおいしく召し上がっていただくため、精米後1か月程度を目安にお召し上がりください。',
  },
  {
    q: 'いつ決済されますか？',
    a: '初回はお申し込み時、2回目以降は発送予定月の10日に決済されます。',
  },
  {
    q: 'クレジットカードを変更できますか？',
    a: 'マイページの「定期購入」タブより変更いただけます。',
  },
  {
    q: '解約はどこからできますか？',
    a: 'マイページよりお手続きいただけます。\n操作がわからない場合は、お問い合わせください。',
  },
];

export function YearlySubscriptionFooter() {
  return (
    <section className="mt-16 md:mt-24 border-t border-gray-100 pt-12 md:pt-16">
      {/* 05 私たちの想い（画像左 + テキスト右） */}
      <div className="max-w-6xl mx-auto px-2 mb-16 md:mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* 画像（左） */}
          <div className="relative aspect-[4/5] overflow-hidden md:aspect-[4/5]">
            <Image
              src="/images/about/stories/P3A0011.jpg"
              alt="佐渡の田んぼに立つイケベジの作り手"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {/* テキスト（右） */}
          <div className="md:pl-2">
            <h3 className="mb-6 font-serif text-xl font-semibold leading-snug tracking-wider text-primary md:mb-8 md:text-2xl">
              私たちの想い
            </h3>
            <div className="space-y-5 text-sm leading-[1.9] text-gray-700 md:space-y-6 md:text-[15px]">
              <p>
                みなさんに安心して、美味しいお米を食べてほしい。
                <br />
                必要な量を、必要なタイミングで、いつでも新鮮な状態で食卓に届けること。
                <br />
                それが、私たちがイケベジ定期便を始めた一番の理由です。
              </p>
              <p>
                定期便は私たち農家にとっても大きな支えにもなります。
                <br />
                繁忙期に販売の心配をすることなく100%「最高の米作り」に集中できる。
              </p>
              <p>
                食べる人と、作る人が、お米を通じてつながる。
                <br />
                お客様とともにお米を作り、地域を守り、未来を育てていく。
                <br />
                私たちにとって、これ以上ないほどありがたく、大切な、お客様との理想のカタチです。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden">
      {/* 06 定期便のご利用について */}
      <div className="max-w-3xl mx-auto px-2 mb-16 md:mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {[
            {
              number: '01',
              title: 'お届けについて',
              body: '毎月1回、発送予定月の15日頃にお届けします。お申し込みの締切は、毎月10日です。',
              notes: [
                'お届け日の指定は承っておりません。',
                '初回発送の時期は品種によって異なります。',
              ],
            },
            {
              number: '02',
              title: '変更・スキップについて',
              body: 'お米が余りそうな月は、マイページより次回配送の１ヶ月スキップができます。（2回連続は不可）配送先やお届けサイクルの変更も可能です。',
              notes: [
                '各種変更は、次回発送予定月の9日までにお手続きください。',
              ],
            },
            {
              number: '03',
              title: '量の変更・解約について',
              body: '2回目以降の発送分は、次回発送予定月の9日までに解約申込いただければストップできます。解約に回数制限はありません。',
              notes: [
                'お申し込み完了後、初回分のキャンセルは決済が完了しているためお受けできかねます。',
                '毎月の量を変更する場合は、一度解約後、ご希望の量で新しくお申し込みください。',
              ],
            },
            {
              number: '04',
              title: '精米・保存について',
              body: 'お米は、発送前に精米してお届けします。届いたあとは、直射日光・高温多湿を避け、涼しい場所で保管してください。',
              notes: [
                '精米後1か月程度を目安にお召し上がりください。',
              ],
            },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
              <p className="text-[10px] md:text-xs font-serif tracking-[0.2em] text-yuunagi-ink mb-1.5">
                {item.number}
              </p>
              <h4 className="text-sm md:text-base font-semibold text-primary mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-yuunagi rounded-full" />
                {item.title}
              </h4>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{item.body}</p>
              {item.notes && item.notes.length > 0 && (
                <ul className="mt-2.5 space-y-1">
                  {item.notes.map((note) => (
                    <li key={note} className="text-[11px] md:text-xs text-gray-500 leading-relaxed">
                      ※{note}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 07 よくある質問 */}
      <div className="max-w-3xl mx-auto px-2 mb-16 md:mb-24">
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="group border border-gray-200 rounded-xl bg-white open:shadow-sm open:border-yuunagi-soft transition-all"
            >
              <summary className="flex items-start justify-between cursor-pointer p-4 md:p-5 list-none gap-3">
                <span className="text-sm md:text-base font-medium text-primary flex gap-2 flex-1 min-w-0">
                  <span className="text-yuunagi flex-shrink-0">Q.</span>
                  <span>{item.q}</span>
                </span>
                <svg
                  className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 md:px-5 pb-4 md:pb-5 text-xs md:text-sm text-gray-600 leading-relaxed flex gap-2">
                <span className="text-yuunagi font-medium flex-shrink-0">A.</span>
                <span className="whitespace-pre-line">{item.a}</span>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* 送料について */}
      <div className="max-w-3xl mx-auto px-2 mb-16 md:mb-24">
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
      </div>

      {/* 06 詳細案内への入口 */}
      <nav aria-label="定期便についての詳細" className="max-w-4xl mx-auto px-2 mb-16 md:mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 border-y border-gray-200 md:divide-x md:divide-gray-200">
          {[
            {
              href: '/subscription-guide',
              title: '定期便のご利用について',
              description: 'お届け・変更・スキップ・解約・保存について',
            },
            {
              href: '/subscription-faq',
              title: 'よくある質問',
              description: '定期便についてよくいただくご質問',
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-h-52 flex-col items-center justify-center px-6 py-12 text-center transition-colors hover:bg-gray-50"
            >
              <h3 className="font-serif text-xl tracking-[0.08em] text-primary md:text-2xl">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-gray-500 md:text-base">
                {item.description}
              </p>
              <span className="mt-7 flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-lg text-primary transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                →
              </span>
            </Link>
          ))}
        </div>
      </nav>

    </section>
  );
}
