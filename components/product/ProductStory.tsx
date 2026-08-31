'use client';

import Carousel from '@/components/Carousel';
import { useState } from 'react';
import { SHOW_PLACEHOLDER_BADGE } from '@/components/home/placeholders';
import FadeIn from '@/components/FadeIn';

/**
 * 商品ページ下部のテーマ別セクション（ベースフードの
 * 「だから、おいしい。」「調理の手間なし。」等に相当）。
 *
 * 左に小さなラベルと見出し、右にカードの横スクロール。
 * ※ 文章と写真はすべて仮。実際の取材内容に差し替える前提。
 */
type Card = { title: string; body: string; image: string };
type Theme = { label: string; heading: string; cards: Card[] };

const THEMES: Theme[] = [
  {
    label: 'あんしん',
    heading: 'だから、\nあんしん。',
    cards: [
      {
        title: '農薬にも化学肥料にも頼らない',
        body: '佐渡島のすべての圃場で、農薬と化学肥料を使わずに育てています。子どもに毎日食べさせられるかどうかが、私たちの基準です。',
        image: '/images/about/stories/about_story_taue_123.webp',
      },
      {
        title: '島の有機資源だけで土をつくる',
        body: '外から資材を持ち込むのではなく、島の中で循環する有機資源で土を磨き上げています。土の力が戻れば、稲は自分の力で育ちます。',
        image: '/images/about/stories/IMG_8832.webp',
      },
      {
        title: '生きものを育てる農法',
        body: '佐渡市が定める「生き物を育む農法」をすべての圃場で実施しています。田んぼは、お米だけを育てる場所ではありません。',
        image: '/images/joinus/sadokids-fieldwork.jpg',
      },
    ],
  },
  {
    label: 'おいしい',
    heading: 'だから、\nおいしい。',
    cards: [
      {
        title: '世界最高米® 最高金賞',
        body: '第27回米・食味分析鑑定コンクール国際大会の国際総合部門で、最高金賞をいただきました。',
        image: '/images/home/collections/collection_koshihikari_800.webp',
      },
      {
        title: '品種が持つ味を、そのまま',
        body: '余計なものを足さないことで、品種が本来持っている甘みと香りがまっすぐに出ます。一口食べると違いが分かります。',
        image: '/images/usage-scene.jpg',
      },
      {
        title: '出荷直前に精米',
        body: 'お米は生鮮品です。お届けに合わせて精米しているので、いちばんおいしい状態で食卓に届きます。',
        image: '/images/rice-keep-bag.jpg',
      },
    ],
  },
  {
    label: 'いいかお',
    heading: '田んぼが、\n島の循環をつくる。',
    cards: [
      {
        title: '佐渡Kids生きもの調査隊',
        body: '19年目を迎える環境学習プログラム。島の子どもたちと一緒に、田んぼの生きものを1年かけて数えています。',
        image: '/images/joinus/sadokids-fieldwork.jpg',
      },
      {
        title: 'イケてるパートナーズ',
        body: '1年を通して佐渡の田んぼとつながる、企業向けのオーナー制度です。田植えから稲刈りまでご一緒します。',
        image: '/images/joinus/artboard_1_copy.webp',
      },
      {
        title: '集落が続くということ',
        body: '買い続けていただけることで、私たちは翌年の田んぼを計画できます。それがそのまま、佐渡の集落を残すことにつながります。',
        image: '/images/home/parallax/sunset_riceplanting_7_800.webp',
      },
    ],
  },
];

const FAQ_ITEMS = [
  { q: '玄米と白米、分づきの違いは何ですか？', a: '玄米は精米していない状態、白米は完全に精米した状態です。分づきはその中間で、5分づきを目安にしています。栄養と食べやすさのバランスで選んでいただけます。' },
  { q: 'どのくらいで食べきるのがいいですか？', a: 'お米は生鮮品です。精米後は2週間ほどで食べきっていただくのがいちばんおいしい状態です。まとめ買いより、定期便で少しずつ受け取るほうが向いています。' },
  { q: '保存はどうすればいいですか？', a: '直射日光と高温多湿を避け、冷蔵庫の野菜室で保管してください。密閉できる袋に移していただくとより安心です。' },
  { q: '予約商品はいつ届きますか？', a: '商品ページに記載の発送開始予定日以降、順次お届けします。ご注文時にお支払いいただきますが、発送はその日付以降になります。' },
];

export default function ProductStory() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <>
      {THEMES.map((t) => (
        <section key={t.label} className="mt-20 md:mt-28">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-16">
            <FadeIn>
              <p className="text-xs tracking-[0.15em] text-yuunagi-ink mb-2">{t.label}</p>
              <h2 className="text-xl md:text-2xl font-serif font-semibold tracking-wider text-primary whitespace-pre-line leading-relaxed">
                {t.heading}
              </h2>
            </FadeIn>

            <FadeIn delay={80}>
            <Carousel ariaLabel={t.label}>
              {t.cards.map((c, i) => (
                <li key={c.title} className="snap-start shrink-0 w-[260px] md:w-[320px]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-dim">
                    {SHOW_PLACEHOLDER_BADGE && (
                      <span className="absolute top-2 left-2 z-10 rounded-sm bg-yuunagi-ink/90 px-1.5 py-0.5 text-[9px] tracking-wider text-white">
                        仮素材
                      </span>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="mt-3 text-sm font-medium text-primary">{c.title}</h3>
                  <p className="mt-1.5 text-[12px] md:text-[13px] text-gray-600 leading-relaxed">{c.body}</p>
                </li>
              ))}
            </Carousel>
            </FadeIn>
          </div>
        </section>
      ))}

      {/* お客様の声 */}
      <section className="mt-20 md:mt-28">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-16">
          <div>
            <p className="text-[32px] md:text-[46px] font-sans font-bold tracking-tight text-yuunagi leading-none">Reviews</p>
            <p className="mt-1.5 flex items-center gap-2.5 text-sm md:text-base font-medium text-primary">
              <span className="inline-block w-3 h-3 rounded-full bg-hekishoku shrink-0" aria-hidden="true" />
              お客様の声
            </p>
          </div>
          <div className="flex items-center justify-center border border-dashed border-gray-300 bg-secondary/30 py-14 px-6 text-center">
            <p className="text-[13px] text-gray-500 leading-relaxed">
              レビューはまだ登録されていません。
              <br />
              管理画面から追加すると、ここに表示されます。
            </p>
          </div>
        </div>
      </section>

      {/* よくある質問 */}
      <section className="mt-20 md:mt-28">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-16">
          <div>
            <p className="text-[32px] md:text-[46px] font-sans font-bold tracking-tight text-yuunagi leading-none">FAQ</p>
            <p className="mt-1.5 flex items-center gap-2.5 text-sm md:text-base font-medium text-primary">
              <span className="inline-block w-3 h-3 rounded-full bg-hekishoku shrink-0" aria-hidden="true" />
              よくある質問
            </p>
          </div>
          <ul className="border-t border-gray-200">
            {FAQ_ITEMS.map((f) => {
              const isOpen = openFaq === f.q;
              return (
                <li key={f.q} className="border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : f.q)}
                    aria-expanded={isOpen}
                    className="w-full flex items-start justify-between gap-4 py-5 text-left text-sm md:text-[15px] text-primary"
                  >
                    {f.q}
                    <svg className={`shrink-0 mt-1 w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className={`accordion-body ${isOpen ? 'is-open' : ''}`}>
                    <div>
                      <p className="pb-5 text-[13px] text-gray-600 leading-loose">{f.a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
