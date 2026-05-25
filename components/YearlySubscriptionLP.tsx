'use client';

import React from 'react';
import Link from 'next/link';

type Benefit = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const BENEFITS: Benefit[] = [
  {
    title: 'いつも新鮮',
    description:
      '農場から直送！精米したてのお米をお届けします。炊きたての香りと甘みを、毎日おうちで♪',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M5.636 5.636l12.728 12.728M3 12h18M5.636 18.364L18.364 5.636" />
      </svg>
    ),
  },
  {
    title: 'お米不足の心配なし',
    description:
      '定期便ならお客様の分をしっかり確保！売り切れの心配なく、安心して続けられます。',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
  {
    title: '数量変更・スキップも自由自在',
    description:
      'お届け頻度や数量を、ライフスタイルに合わせて自由に調整OK！マイページから簡単に変更できます♪',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: '家計管理もらくらく',
    description:
      'いつも同じ条件でお届けだから安心！家計管理もらくらく続けられます。',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
];

export default function YearlySubscriptionLP() {
  return (
    <section className="mb-12 md:mb-16">
      {/* タイトル */}
      <div className="mb-8 text-center">
        <p className="text-xs text-gray-500 tracking-[0.2em] uppercase mb-2">Annual Subscription</p>
        <h2 className="text-2xl md:text-3xl font-serif font-medium text-primary tracking-wider inline-block border-b-2 border-amber-600 pb-2">
          年間契約で毎日らくらく♪
        </h2>
        <p className="mt-4 text-sm md:text-base text-gray-600">
          精米したてのお米が、手間なく、らくらく届く。
        </p>
      </div>

      {/* 4ベネフィット */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 flex gap-4 hover:shadow-md transition-shadow"
          >
            <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 bg-primary text-white rounded-lg flex items-center justify-center">
              {b.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-medium text-primary mb-2">{b.title}</h3>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{b.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 新規お申込み特典 */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 md:p-6 mb-10 flex gap-4">
        <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 bg-amber-600 text-white rounded-lg flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-medium text-amber-900 mb-1">新規お申込み特典</h3>
          <p className="text-xs md:text-sm text-amber-800 leading-relaxed">
            年間契約に新規でお申し込みのお客様に、IKEVEGEオリジナルエコバッグをプレゼント！
            <br />
            （先着順・なくなり次第終了）
          </p>
        </div>
      </div>

      {/* 商品一覧見出し */}
      <div className="text-center mb-6 mt-12 md:mt-16">
        <p className="text-xs text-gray-500 tracking-[0.2em] uppercase mb-2">Products</p>
        <h3 className="text-lg md:text-xl font-serif font-medium text-primary tracking-wider">
          年間契約のお米一覧
        </h3>
        <p className="mt-2 text-xs md:text-sm text-gray-500">
          お好みのお米を選び、配送頻度をご指定ください。
        </p>
      </div>
    </section>
  );
}

export function YearlySubscriptionFooter() {
  return (
    <section className="mt-16 md:mt-24 border-t border-gray-100 pt-12 md:pt-16">
      {/* よくある質問 */}
      <div className="max-w-3xl mx-auto px-2 mb-12 md:mb-16">
        <div className="text-center mb-8">
          <p className="text-xs text-gray-500 tracking-[0.2em] uppercase mb-2">FAQ</p>
          <h3 className="text-lg md:text-xl font-serif font-medium text-primary tracking-wider">
            よくある質問
          </h3>
        </div>
        <div className="space-y-4">
          {[
            {
              q: '配送頻度はどのくらいから選べますか？',
              a: '商品ごとに、毎月／2ヶ月毎／3ヶ月毎などお選びいただけます。商品ページの「お届け頻度」よりご確認ください。',
            },
            {
              q: '途中で配送をスキップ・数量変更できますか？',
              a: 'マイページの「定期購入」より、いつでも変更・スキップ操作が行えます。',
            },
            {
              q: '途中で解約できますか？',
              a: '年間契約は途中解約をお受けできません。毎年6月〜8月末までの間にキャンセル希望をご連絡いただかない場合、自動更新となります。',
            },
            {
              q: '支払い方法は？',
              a: 'クレジットカード決済となります。初回はご注文時、2回目以降はお届け日の直前に自動で決済されます。',
            },
          ].map((item, i) => (
            <details
              key={i}
              className="group border border-gray-200 rounded-lg bg-white open:shadow-sm transition-shadow"
            >
              <summary className="flex items-center justify-between cursor-pointer p-4 list-none">
                <span className="text-sm md:text-base font-medium text-primary">Q. {item.q}</span>
                <svg
                  className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">A. {item.a}</div>
            </details>
          ))}
        </div>
      </div>

      {/* 送料について */}
      <div className="max-w-3xl mx-auto px-2 mb-8">
        <div className="text-center mb-6">
          <p className="text-xs text-gray-500 tracking-[0.2em] uppercase mb-2">Shipping</p>
          <h3 className="text-lg md:text-xl font-serif font-medium text-primary tracking-wider">
            送料について
          </h3>
        </div>
        <div className="bg-gray-50 rounded-lg p-5 md:p-6 text-sm text-gray-600 leading-relaxed space-y-2">
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
    </section>
  );
}
