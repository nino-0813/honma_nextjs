'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

function FadeInSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const domRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    const el = domRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, []);
  return (
    <div ref={domRef} className={`opacity-0 translate-y-10 transition-all duration-1000 ease-out ${className}`}>
      {children}
    </div>
  );
}

/**
 * イケてるパートナーズ 協賛企業ロゴ一覧
 * - 必要に応じてここに追記するだけでグリッドが自動的に増えます（最大8社想定）
 */
const PARTNER_LOGOS: { name: string; src: string }[] = [
  { name: 'ClearHome', src: '/images/partners/clearhome.png' },
  { name: 'BLUE ADVANCE', src: '/images/partners/blue-advance.png' },
];

export default function AmbassadorPage() {
  const leftImageRef = useRef<HTMLImageElement>(null);
  const rightImageRef = useRef<HTMLImageElement>(null);
  const imagesSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const sectionEl = imagesSectionRef.current;
    if (!sectionEl) return;
    const syncImageHeights = () => {
      if (rightImageRef.current && leftImageRef.current) {
        const rightHeight = rightImageRef.current.offsetHeight;
        if (rightHeight > 0) {
          const leftContainer = leftImageRef.current.parentElement;
          if (leftContainer) leftContainer.style.height = `${rightHeight}px`;
        }
      }
    };
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && syncImageHeights()),
      { threshold: 0.1 }
    );
    observer.observe(sectionEl);
    window.addEventListener('resize', syncImageHeights);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncImageHeights);
    };
  }, []);

  return (
    <div className="pt-20 animate-fade-in bg-white overflow-x-hidden w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 pb-12 md:pb-16 text-center">
        <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-4">JOIN US</h1>
      </div>

      <div className="relative w-full pb-4 flex justify-center">
        <div className="relative w-full max-w-4xl h-auto md:h-[60vh] overflow-visible md:overflow-hidden mx-auto mb-8 md:mb-12">
          <Image
            src="/images/ambassador/banner/ambassador_banner_design.webp"
            alt="IKEVEGE"
            width={1200}
            height={630}
            className="w-full h-auto md:h-full object-contain md:object-cover object-center object-bottom md:object-center scale-[1.4] md:scale-[1.3]"
          />
        </div>
      </div>

      <section className="pt-12 md:pt-16 pb-16 md:pb-24 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <p className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase mb-4 md:mb-6">CONCEPT</p>
          <div className="mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-serif font-medium tracking-[0.15em] text-primary mb-5 md:mb-7">
              社会を共に創る
            </h2>
            <div className="w-44 md:w-72 h-px bg-amber-600 mx-auto" />
          </div>
          <div className="text-sm md:text-base font-light leading-loose md:leading-loose text-gray-700 space-y-4 md:space-y-6 max-w-2xl mx-auto text-center">
            <p>子どもたちから借りている</p>
            <p>この自然資本の上に生きるものとして</p>
            <p>都市と里山の境界を越えていく。</p>
            <p>どこにいても「自分ごと」として</p>
            <p>手を取り合える社会を。</p>
            <p className="font-medium">イケベジと一緒に。</p>
          </div>
        </div>
      </section>

      {/* OUR PROJECT セクション見出し */}
      <section className="py-10 md:py-14 bg-secondary/30 relative w-full">
        <div className="w-full flex flex-col items-center justify-center px-6">
          <p className="text-[11px] md:text-xs tracking-[0.3em] text-amber-700 font-medium uppercase mb-3 text-center">JOIN US</p>
          <h3 className="text-2xl md:text-4xl font-serif tracking-widest mb-4 text-center">OUR PROJECT</h3>
          <div className="w-12 h-px bg-amber-600" />
        </div>
      </section>

      {/* Project 01: アンバサダー / イケてるパートナーズ */}
      <section ref={imagesSectionRef} className="bg-white pt-16 md:pt-24 pb-10 md:pb-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* パートナー企業ロゴ一覧 */}
            <FadeInSection>
              <div className="relative w-full bg-white rounded-2xl shadow-[0_15px_40px_-12px_rgba(0,0,0,0.18)] p-6 md:p-10">
                {/* 見出し: イケてるパートナーズロゴ */}
                <div className="flex flex-col items-center mb-6 md:mb-8 pb-5 md:pb-6 border-b border-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/joinus/Iketeru_partner_logo_RGB_2409005.webp"
                    className="h-12 md:h-16 w-auto object-contain"
                    alt="イケてるパートナーズ"
                  />
                  <p className="mt-3 md:mt-4 text-[10px] md:text-xs tracking-[0.3em] text-gray-500 uppercase">
                    Partner Companies
                  </p>
                </div>

                {/* 協賛企業ロゴグリッド（最大8社） */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {PARTNER_LOGOS.map((p) => (
                    <div
                      key={p.name}
                      className="aspect-[16/9] bg-white border border-gray-200 rounded-lg flex items-center justify-center p-4 hover:border-amber-200 hover:shadow-sm transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.src}
                        alt={p.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ))}
                </div>

                <p className="mt-5 md:mt-6 text-[10px] md:text-[11px] text-gray-400 text-center">
                  ※ 順不同・敬称略
                </p>
              </div>
            </FadeInSection>

            {/* テキスト */}
            <FadeInSection>
              <div className="md:pl-2">
                <p className="text-[11px] md:text-xs tracking-[0.3em] text-amber-700 font-medium uppercase mb-2">Project 01 — Ambassador</p>
                <h4 className="text-xl md:text-2xl font-serif font-semibold mb-2 leading-snug">
                  イケてるパートナーズ
                </h4>
                <p className="text-sm md:text-base text-gray-600 leading-[2.1] mb-5">
                  1年を通して佐渡の田んぼとつながる、企業向けの「イケベジ版オーナー制度」。
                </p>
                <ul className="space-y-4 md:space-y-5 text-sm md:text-[15px] text-gray-700 mb-5">
                  {[
                    { t: '田植え／生き物調査／稲刈り／新嘗祭への招待' },
                    { t: '収穫できたお米を、用途に合わせて社内配布・贈答・自宅用に' },
                    { t: '公式HPへ企業ロゴを掲載／オリジナル米袋プランも選択可' },
                    { t: 'TOKItoWAの研修・リトリート・ワーケーション特別割引' },
                  ].map((item) => (
                    <li key={item.t} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span>{item.t}</span>
                    </li>
                  ))}
                </ul>
                {/* 1年の流れ */}
                <div className="bg-stone-50 rounded-xl p-4 md:p-5 mb-5">
                  <p className="text-[11px] md:text-xs tracking-[0.2em] text-gray-500 mb-3">YEAR-ROUND TIMELINE</p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs md:text-sm text-gray-700">
                    <div className="flex items-center gap-2"><span className="text-amber-700 font-medium">春</span><span>田植え</span></div>
                    <div className="flex items-center gap-2"><span className="text-amber-700 font-medium">夏</span><span>生き物調査・草刈り</span></div>
                    <div className="flex items-center gap-2"><span className="text-amber-700 font-medium">秋</span><span>稲刈り・収穫体験</span></div>
                    <div className="flex items-center gap-2"><span className="text-amber-700 font-medium">冬</span><span>新嘗祭・新米お届け</span></div>
                  </div>
                </div>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-primary text-white text-xs md:text-sm tracking-[0.2em] uppercase px-6 md:px-8 py-3 rounded-full hover:bg-amber-700 transition-colors"
                >
                  パートナーズの相談をする
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Project 02: いきもの調査隊 */}
      <section className="bg-stone-50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* テキスト（左） */}
            <FadeInSection>
              <div className="md:order-1 order-2">
                <p className="text-[11px] md:text-xs tracking-[0.3em] text-amber-700 font-medium uppercase mb-2">Project 02 — Biodiversity</p>
                <h4 className="text-xl md:text-2xl font-serif font-semibold mb-2 leading-snug">
                  佐渡Kids生きもの調査隊
                </h4>
                <p className="text-sm md:text-base text-gray-700 leading-[2.1] mb-5">
                  佐渡の田んぼで、子どもたちが「環境や生きものにやさしい米づくり」と
                  「田んぼの生きもの調査」を1年かけて体験するプログラム。
                  田んぼはお米を育てる場所であると同時に、たくさんの生きものが育まれる場所。
                  その気づきを実体験から学んでいきます。
                </p>
                <ul className="space-y-4 md:space-y-5 text-sm md:text-[15px] text-gray-700 mb-6">
                  {[
                    '佐渡島内の小学1〜6年生の定員40名',
                    '2026年度で19年目を迎える、佐渡の環境学習を支えるプログラム',
                    '首都圏でのお米の販売や活動報告',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-nowrap items-center gap-4 md:gap-6">
                  <a
                    href="https://sado-ikimonoken.jp/sadokids2025/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-primary border border-primary text-xs md:text-sm tracking-[0.2em] uppercase px-6 md:px-8 py-3 rounded-full hover:bg-primary hover:text-white transition-colors flex-shrink-0 whitespace-nowrap"
                  >
                    公式ホームページを見る
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                  {/* SADO KIDS ロゴ */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/joinus/sadokids-logo.png"
                    alt="SADO KIDS 生きもの調査隊"
                    className="h-32 md:h-40 w-auto object-contain flex-shrink min-w-0"
                  />
                </div>
              </div>
            </FadeInSection>

            {/* 画像（右） */}
            <FadeInSection>
              <div className="md:order-2 order-1 relative w-full aspect-[4/3] bg-stone-100 overflow-hidden rounded-2xl shadow-[0_20px_45px_-10px_rgba(0,0,0,0.25)]">
                <Image
                  src="/images/joinus/sadokids-fieldwork.jpg"
                  alt="佐渡Kids生きもの調査隊で生きものを観察する子どもたち"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Project 03: クラウドファンディング */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            {/* 画像（左・少しだけ控えめ） */}
            <FadeInSection className="md:col-span-7">
              <div className="relative w-full bg-white overflow-hidden rounded-2xl shadow-[0_20px_45px_-12px_rgba(0,0,0,0.22)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={rightImageRef}
                  src="/images/joinus/crowdfunding-main.jpg"
                  className="w-full h-auto block"
                  alt="クラウドファンディング達成: 4,358,749円 / 149人 / 290%"
                />
              </div>
            </FadeInSection>

            {/* テキスト（右・読み込ませる文字幅） */}
            <FadeInSection className="md:col-span-5">
              <div className="md:pl-2">
                <p className="text-[11px] md:text-xs tracking-[0.3em] text-amber-700 font-medium uppercase mb-2">Project 03 — Crowdfunding</p>
                <h4 className="text-xl md:text-2xl font-serif font-semibold mb-2 leading-snug">
                  佐渡の小学生と世界一へ！
                </h4>
                <p className="text-sm md:text-[15px] font-medium text-amber-700 mb-4">
                  「子どもが農家を夢見る島」たった一羽のトキがもたらしたもの
                </p>
                <div className="text-sm md:text-base text-gray-700 leading-[2.1] space-y-4 mb-6">
                  <p>
                    佐渡の小学生たちが「農家になりたい」と言える島を目指して。
                    私たちは、スマート農業の技術と佐渡の栽培技術を掛け合わせ、
                    地域の子どもたちと「世界一のお米づくり」に挑戦しています。
                  </p>
                  <p>
                    このたび、スマート農機を導入するためのクラウドファンディングに挑戦し、
                    <span className="font-semibold">149名の方々から4,358,749円</span>
                    ものご支援をいただくことができました。心より感謝申し上げます。
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="https://for-good.net/project/1003099"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-amber-700 text-white text-xs md:text-sm tracking-[0.2em] uppercase px-6 md:px-8 py-3 rounded-full hover:bg-amber-800 transition-colors"
                  >
                    プロジェクトの詳細を見る
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      <div className="pb-16 md:pb-24" />
    </div>
  );
}
