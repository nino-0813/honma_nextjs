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
          <p className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase mb-2 md:mb-4">CONCEPT</p>
          <div className="mb-12 md:mb-16">
            <div className="flex justify-center mb-4 md:mb-6">
              <span className="relative inline-block">
                <Image
                  src="/images/joinus/Iketeru_partner_logo_RGB_2409005.webp"
                  alt="イケてるパートナーズ"
                  width={200}
                  height={80}
                  className="h-20 md:h-32 w-auto object-contain"
                />
                <span className="absolute left-1/2 transform -translate-x-1/2 w-3/4 h-px bg-primary -bottom-2 md:-bottom-4" />
              </span>
            </div>
            <span className="text-base md:text-2xl block text-gray-600 mt-10 md:mt-12">社会を共に創る</span>
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
      <section className="pt-16 md:pt-24 pb-10 md:pb-14 bg-secondary/30 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <p className="text-[11px] md:text-xs tracking-[0.3em] text-amber-700 font-medium uppercase mb-3">Our Project</p>
            <h3 className="text-2xl md:text-4xl font-serif tracking-widest mb-4">OUR PROJECT</h3>
            <div className="w-12 h-px bg-amber-600 mx-auto mb-6" />
            <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
              佐渡の里山と都市をつなげるための、3つの取り組みをご紹介します。
              <br className="hidden md:block" />
              ご自身に合うかたちで、ぜひ一緒に動かしていきましょう。
            </p>
          </div>
        </div>
      </section>

      {/* Project 01: アンバサダー / イケてるパートナーズ */}
      <section ref={imagesSectionRef} className="bg-white pt-16 md:pt-24 pb-10 md:pb-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* 画像 */}
            <FadeInSection>
              <div className="relative w-full aspect-[4/5] bg-stone-100 overflow-hidden rounded-2xl shadow-[0_15px_40px_-12px_rgba(0,0,0,0.18)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={leftImageRef}
                  src="/images/joinus/artboard_1_copy.webp"
                  className="w-full h-full object-cover"
                  alt="イケてるパートナーズ"
                />
              </div>
            </FadeInSection>

            {/* テキスト */}
            <FadeInSection>
              <div className="md:pl-2">
                <p className="text-[11px] md:text-xs tracking-[0.3em] text-amber-700 font-medium uppercase mb-2">Project 01 — Ambassador</p>
                <h4 className="text-xl md:text-2xl font-serif font-semibold mb-2 leading-snug">
                  イケてるパートナーズ
                </h4>
                <p className="text-sm md:text-base text-gray-600 mb-5">
                  1年を通して佐渡の田んぼとつながる、企業向けの「イケベジ版オーナー制度」。
                </p>
                <ul className="space-y-2.5 text-sm md:text-[15px] text-gray-700 mb-5">
                  {[
                    { t: '佐渡の里山で田植え／生き物調査／稲刈り／新嘗祭への招待' },
                    { t: 'コシヒカリ約30kg分のお米を、用途に合わせて社内配布・贈答・自宅用に' },
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
                    <div className="flex items-center gap-2"><span className="text-amber-700 font-medium">春</span><span>田植え（6月）</span></div>
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
                  いきもの調査隊
                </h4>
                <p className="text-sm md:text-base text-gray-700 leading-loose mb-5">
                  佐渡の田んぼに集まる生きものたちと、その自然環境を一緒に観察する取り組み。
                  田んぼの上の暮らしを知ることが、おいしいお米のはじまりです。
                </p>
                <ul className="space-y-2 text-sm md:text-[15px] text-gray-700 mb-6">
                  {[
                    '子どもも大人も、地域の方も参加できる学びのプログラム',
                    'お米と生きものがつながる「里山の物語」を体感できる',
                    '専用サイトで活動レポート・募集情報を随時公開',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="https://www.ikimono-sado.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-primary border border-primary text-xs md:text-sm tracking-[0.2em] uppercase px-6 md:px-8 py-3 rounded-full hover:bg-primary hover:text-white transition-colors"
                >
                  公式サイトを見る
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              </div>
            </FadeInSection>

            {/* 画像（右） */}
            <FadeInSection>
              <div className="md:order-2 order-1 relative w-full aspect-[4/3] bg-stone-100 overflow-hidden rounded-2xl shadow-[0_15px_40px_-12px_rgba(0,0,0,0.18)]">
                <Image
                  src="/images/about/stories/about_story_taue_123.jpg"
                  alt="佐渡の田んぼでの生き物調査"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* 画像（左） */}
            <FadeInSection>
              <div className="relative w-full aspect-[3/4] bg-stone-100 overflow-hidden rounded-2xl shadow-[0_15px_40px_-12px_rgba(0,0,0,0.18)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={rightImageRef}
                  src="/images/joinus/crowdfunding_poster.webp"
                  className="w-full h-full object-contain bg-white"
                  alt="クラウドファンディング"
                />
              </div>
            </FadeInSection>

            {/* テキスト（右） */}
            <FadeInSection>
              <div className="md:pl-2">
                <p className="text-[11px] md:text-xs tracking-[0.3em] text-amber-700 font-medium uppercase mb-2">Project 03 — Crowdfunding</p>
                <h4 className="text-xl md:text-2xl font-serif font-semibold mb-2 leading-snug">
                  佐渡の小学生と世界一へ！
                </h4>
                <p className="text-sm md:text-[15px] font-medium text-amber-700 mb-4">
                  スマート農業で創る「子どもが農家を夢見る島」
                </p>
                <div className="text-sm md:text-base text-gray-700 leading-loose space-y-3 mb-6">
                  <p>
                    佐渡の小学生たちが「農家になりたい」と言える島へ。
                    スマート農業の技術と佐渡の自然栽培を掛け合わせ、
                    世界一のお米づくりに、地域の子どもたちと挑戦しています。
                  </p>
                  <p className="text-gray-600 text-sm">
                    プロジェクトの背景・リターン・支援方法は、for Good のページからご覧いただけます。
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="https://for-good.net/project/1003099"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-amber-700 text-white text-xs md:text-sm tracking-[0.2em] uppercase px-6 md:px-8 py-3 rounded-full hover:bg-amber-800 transition-colors"
                  >
                    プロジェクトを応援する
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                  <span className="text-xs text-gray-500">for Good で挑戦中</span>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* クロージング */}
      <section className="relative w-full pb-24 md:pb-32 flex justify-center mt-4">
        <div className="bg-gradient-to-b from-stone-50 to-amber-50/40 rounded-3xl px-6 md:px-12 py-14 md:py-20 max-w-4xl w-full mx-4 text-center">
          <p className="text-[11px] text-amber-700 tracking-[0.3em] uppercase mb-4 font-medium">Closing</p>
          <h3 className="text-xl md:text-3xl font-serif font-semibold text-primary leading-[1.6] md:leading-[1.5] mb-4">
            佐渡の田んぼから、
            <br className="md:hidden" />
            一緒に未来をつくりませんか。
          </h3>
          <div className="w-10 h-px bg-amber-600 mx-auto mb-6" />
          <p className="text-sm md:text-base text-gray-700 leading-loose mb-8">
            気になるプロジェクトが見つかったら、お気軽にご連絡ください。
            <br className="hidden md:block" />
            あなたに合うかたちで、ご一緒できる方法をお伝えします。
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-primary text-white text-xs md:text-sm tracking-[0.2em] uppercase px-8 md:px-10 py-4 rounded-full hover:bg-amber-700 transition-colors"
          >
            お問い合わせ
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
