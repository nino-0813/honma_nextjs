'use client';

import { useState } from 'react';

const FAQ_ITEMS = [
  { q: 'お米はどのように研げばよいですか？', a: 'はじめの水はすぐに捨て、指を立てて20回ほどやさしくかき混ぜてください。力を入れて研ぐ必要はありません。' },
  { q: '炊く前の浸水時間はどのくらいですか？', a: '白米は夏30分、冬1時間ほどが目安です。玄米の場合は6時間以上浸水してください。' },
  { q: '玄米と白米、分づきの違いは何ですか？', a: '玄米は精米していない状態、白米は完全に精米した状態です。分づきはその中間で、栄養と食べやすさのバランスでお選びいただけます。' },
  { q: 'どのくらいで食べきるのがよいですか？', a: '精米後は2週間ほどで食べきっていただくのがおすすめです。まとめ買いより、定期便で少しずつ受け取る方法が向いています。' },
  { q: '保存はどうすればよいですか？', a: '直射日光と高温多湿を避け、密閉できる袋に入れて冷蔵庫の野菜室で保管してください。' },
  { q: '予約商品はいつ届きますか？', a: '商品ページに記載の発送開始予定日以降、順次お届けします。' },
];

export default function ProductStory() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <section className="mt-20 md:mt-28">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr] lg:gap-20">
        <h2 className="text-xl font-serif font-semibold tracking-wider text-primary md:text-2xl">よくある質問</h2>
        <ul className="border-t border-gray-200">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openFaq === item.q;
            return (
              <li key={item.q} className="border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : item.q)}
                  aria-expanded={isOpen}
                  className="flex min-h-14 w-full items-start justify-between gap-4 py-5 text-left text-sm text-primary md:text-[15px]"
                >
                  {item.q}
                  <svg className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                    <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className={`accordion-body ${isOpen ? 'is-open' : ''}`}>
                  <div><p className="pb-5 text-[13px] leading-loose text-gray-600">{item.a}</p></div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
