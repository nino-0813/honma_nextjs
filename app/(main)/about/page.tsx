'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AboutEditorial from '@/components/about/AboutEditorial';

type FadeInSectionProps = {
  children: React.ReactNode;
  className?: string;
};

const FadeInSection = ({ children, className = '' }: FadeInSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('opacity-100', 'translate-y-0');
          element.classList.remove('opacity-0', 'translate-y-8');
          observer.unobserve(element);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`translate-y-8 opacity-0 transition-all duration-1000 ease-out ${className}`}>
      {children}
    </div>
  );
};

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="page-top-offset w-full overflow-x-hidden bg-white text-[#1c1d1d]">
      <header className="px-6 pb-14 pt-16 text-center md:pb-20 md:pt-24">
        <p className="text-[11px] tracking-[0.24em] text-gray-500">自然の“イケてる”を、暮らしのそばへ。</p>
        <h1 className="mt-5 font-serif text-[26px] font-medium leading-[1.8] tracking-[0.13em] md:text-[38px]">農を通じて、<br className="md:hidden" />人と自然のいい関係をつくる。</h1>
        <div className="mx-auto mt-6 max-w-[760px] space-y-2 text-[12px] leading-[2.1] tracking-[0.08em] text-gray-600 md:text-sm">
          <p>イケベジは、新潟県・佐渡ヶ島を拠点に活動する農業ブランドです。</p>
          <p>農薬や化学肥料に頼らず、酒粕や牡蠣殻、竹など島の資源を土に還しながら、お米と原木しいたけを育てています。</p>
          <p>その作物を届けること。田んぼをひらき、体験や学びの場をつくること。</p>
          <p>イケベジは、農を起点に、自然の在り方を社会へと伝える「通訳」で在り続けます。</p>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1120px] px-4 md:px-6">
        <div className="aspect-[16/10] overflow-hidden md:aspect-video">
          <img src="/images/about/hero/about_hero_taue_92.webp" alt="田んぼのそばで過ごす子どもたち" className="h-full w-full object-cover object-center" />
        </div>
      </section>

      <section className="px-4 py-20 md:px-6 md:py-28">
        <FadeInSection className="mx-auto max-w-[1120px] text-left">
          <h2 className="text-[25px] font-medium leading-[1.9] tracking-[0.14em] md:text-[34px]">
            子どもたちが<br />「ここに生まれてよかった」と<br />思える社会を。
          </h2>
          <div className="mt-10 max-w-[680px] space-y-5 text-[13px] font-light leading-[2.15] tracking-[0.08em] text-gray-600 md:mt-12 md:text-sm">
            <p>自然界では、多様な命が、無理なく、<br />あるがままに響き合い、めぐり続けている。<br />その在り方を、私たちは“イケてる”と呼んでいます。</p>
            <p>そんな“イケてる”社会を小さな島の集落から、一歩ずつ。</p>
          </div>
        </FadeInSection>
      </section>

      <section className="bg-[#f7f6f0] px-4 py-24 md:px-6 md:py-28">
        <FadeInSection className="mx-auto max-w-[1120px]">
          <h2 className="text-left text-[24px] font-medium tracking-[0.2em] md:text-[32px]">きょうも しぜんと いいときを。</h2>
          <div className="mt-12 max-w-[720px] space-y-7 text-left text-[13px] font-light leading-[2.3] tracking-[0.09em] text-gray-600 md:text-sm">
            <p>「しぜんと」には、自然と向き合うこと、そして気負わず自然体でいること。そのふたつの意味を込めています。</p>
            <p>イケベジが届けたいのは、特別な日のごちそうではなく、毎日のなかにある、ささやかな「いいとき」です。</p>
          </div>

          <div className="mt-14 max-w-[680px] space-y-7 text-left text-[13px] font-light leading-[2.3] tracking-[0.09em] text-gray-600 md:mt-16 md:text-sm">
            <p>ひと粒のお米の向こうには、<br />山から流れてくる水や、田んぼに集う生きもの、<br />トキが舞う空と、長い年月をかけて受け継がれてきた田んぼがあります。</p>
            <p>あなたの「いいとき」は、自然が重ねてきた時間とつながっている。<br />ありのままのあなたで、<br />きょうも、しぜんと。</p>
          </div>
          <div className="mt-14 text-center md:mt-16">
            <p className="text-[19px] leading-relaxed tracking-[0.07em] md:text-[26px]">毎日のごはんに、佐渡の田んぼをひとつ。</p>
            <Link href="/collections" className="mt-7 inline-block border-b border-[#1c1d1d] pb-1 text-[13px] tracking-[0.1em] transition-opacity hover:opacity-60">商品一覧を見る　→</Link>
          </div>
          <div className="mx-auto mt-14 w-full max-w-[640px] overflow-hidden md:mt-16">
            <img src="/images/about/closing/good-times-collage-2x8.png" alt="イケベジと地域の人たちが自然の中で過ごす様子" className="block h-auto w-full" />
          </div>
        </FadeInSection>
      </section>

      <AboutEditorial />
    </main>
  );
}
