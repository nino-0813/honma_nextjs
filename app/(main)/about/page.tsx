'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface FadeInSectionProps {
  children?: React.ReactNode;
  className?: string;
}

const FadeInSection = ({ children, className = '' }: FadeInSectionProps) => {
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
    const currentElement = domRef.current;
    if (currentElement) observer.observe(currentElement);
    return () => {
      if (currentElement) observer.unobserve(currentElement);
    };
  }, []);
  return (
    <div ref={domRef} className={`opacity-0 translate-y-10 transition-all duration-1000 ease-out ${className}`}>
      {children}
    </div>
  );
};

interface ScrollGrayscaleImageProps {
  src: string;
  alt: string;
  className?: string;
}

const ScrollGrayscaleImage = ({ src, alt, className = '' }: ScrollGrayscaleImageProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => setIsInView(entry.isIntersecting)),
      { threshold: 0.6, rootMargin: '0px 0px -100px 0px' }
    );
    const currentImg = imgRef.current;
    if (currentImg) observer.observe(currentImg);
    return () => {
      if (currentImg) observer.unobserve(currentImg);
    };
  }, []);
  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={`w-full h-full object-cover transition-all duration-1000 ${isInView ? 'grayscale-0' : 'grayscale'} ${className}`}
    />
  );
};

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-20 animate-fade-in bg-white overflow-x-hidden w-full">
      <div className="relative w-full">
        <div className="relative z-10 bg-white pt-4 md:pt-8 pb-12 md:pb-16 flex flex-col items-center justify-center text-black">
          <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-2">ABOUT US</h1>
        </div>
        <div className="relative w-full pb-4 flex justify-center">
          <div className="relative w-full max-w-4xl h-auto md:h-[60vh] overflow-hidden mx-auto">
            <img
              src="/images/about/hero/about_hero_taue_92.webp"
              alt="IKEVEGE"
              width={1200}
              height={800}
              className="w-full h-auto md:h-full object-contain md:object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-black/15" />
          </div>
        </div>
      </div>

      <section className="pt-12 md:pt-16 pb-16 md:pb-24 bg-white relative overflow-hidden">
        <div className="absolute top-8 md:top-10 right-6 md:right-12 text-6xl md:text-[5.5rem] font-serif opacity-[0.03] vertical-text pointer-events-none hidden md:block">
          自然と共に
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <FadeInSection>
            <p className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase mb-4 md:mb-8">CONCEPT</p>
            <h2 className="text-2xl md:text-4xl font-serif font-medium tracking-widest leading-relaxed mb-4">
              <span className="relative inline-block">
                Farm to Social
                <span className="absolute bottom-0 left-0 w-full h-px bg-primary -bottom-2 md:-bottom-2" />
              </span>
              <br />
              <span className="text-base md:text-2xl mt-2 md:mt-4 block text-gray-600">農から社会へ</span>
            </h2>
            <div className="mb-8 md:mb-16" />
            <div className="text-sm md:text-base font-light leading-loose md:leading-loose text-gray-700 space-y-4 md:space-y-6 max-w-2xl mx-auto">
              <p>自然界では、多様な命が、無理なく、<br />あるがままに響き合い、永遠にめぐっている。</p>
              <p>そんな「ありのまま」が調和する<br />&quot;イケてる&quot;社会をつくりたい。</p>
              <p>子どもたちがここに生まれてよかった<br />と思える社会を創りたい。</p>
            </div>
          </FadeInSection>
        </div>
      </section>

      <section className="py-8 md:py-16 bg-secondary/30 relative">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInSection className="text-center">
            <h3 className="text-2xl md:text-4xl font-serif tracking-widest mb-4">OUR 3 STANCES</h3>
            <div className="w-12 h-px bg-primary mx-auto" />
          </FadeInSection>
        </div>
      </section>

      <section className="py-16 md:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-center mb-32">
          <FadeInSection className="w-full md:w-2/5 relative">
            <div className="aspect-square bg-gray-100 relative z-10 max-w-md mx-auto md:mx-0">
              <ScrollGrayscaleImage src="/images/about/hero/retreat_2025_56.webp" alt="Farmer" />
            </div>
            <div className="absolute -bottom-6 -right-2 w-2/3 h-1/2 border border-primary z-0 hidden md:block" />
          </FadeInSection>
          <FadeInSection className="w-full md:w-1/2 space-y-8">
            <h3 className="text-2xl md:text-3xl font-serif tracking-widest">作り手が楽しむ</h3>
            <div className="text-sm md:text-base space-y-6 text-gray-600 leading-loose font-light font-serif">
              <div className="md:hidden space-y-4">
                <p>イケベジの田んぼではいつもスタッフのルカの大きな歌声が響いています。</p>
                <p>作物は作り手の状態を鏡のように映し出すもの。</p>
                <p>だからこそ、田んぼではまず<br />「自分らしく楽しむこと」を第一に心がけています。</p>
                <p>そして美味しいお米を作り、豊かな生態系を守る。</p>
                <p>その両立こそが私たちのモチベーションです。</p>
              </div>
              <div className="hidden md:block space-y-6">
                <p>イケベジの田んぼではいつもスタッフのルカの大きな歌声が響いています。</p>
                <p>作物は作り手の状態を鏡のように映し出すもの。</p>
                <p>だからこそ、田んぼではまず<br />「自分らしく楽しむこと」を第一に心がけています。</p>
                <p>そして美味しいお米を作り、豊かな生態系を守る。</p>
                <p>その両立こそが私たちのモチベーションです。</p>
              </div>
            </div>
          </FadeInSection>
        </div>

        <div className="flex flex-col md:flex-row-reverse gap-12 md:gap-24 items-center mb-32">
          <FadeInSection className="w-full md:w-2/5 relative">
            <div className="aspect-square bg-gray-100 relative z-10 max-w-md mx-auto md:mx-0">
              <ScrollGrayscaleImage src="/images/about/stories/IMG_8832.webp" alt="Sunset Rice Field" />
            </div>
            <div className="absolute -top-10 -left-10 w-2/3 h-1/2 bg-secondary z-0 hidden md:block" />
          </FadeInSection>
          <FadeInSection className="w-full md:w-1/2 space-y-8 text-left">
            <h3 className="text-2xl md:text-3xl font-serif tracking-widest">引き算のものづくり</h3>
            <div className="text-sm md:text-base space-y-6 text-gray-600 leading-loose font-light font-serif">
              <p>&quot;美味しい&quot;とは、品種が持つ本来の味わいがまっすぐに伝わること。</p>
              <p>個性を邪魔する農薬や化学肥料を使わず、過剰な施肥を避け、できる限り島の資源で土を整える。</p>
              <p>小さな微生物を呼び込み、より大きな生き物が集まり、そして生き絶え、いのちの循環が幾重にも奏でられた良質なアミノ酸で育つお米が、イケてるお米を育みます。</p>
              <p>子どもを育てるように、それぞれの命がのびのびと命を全うする場を創り続けます。</p>
            </div>
            <FadeInSection className="mt-8">
              <Link href="/blog" className="inline-block text-gray-900 hover:text-gray-700 transition-all duration-300 group hover:scale-105 md:hover:scale-105 active:scale-95">
                <div className="font-serif text-base md:text-lg leading-relaxed">
                  <p className="mb-2">read more</p>
                  <p className="mb-2 relative inline-block">
                    栽培のヒミツ
                    <span className="absolute bottom-0 left-0 w-full h-px bg-primary" />
                  </p>
                </div>
              </Link>
            </FadeInSection>
          </FadeInSection>
        </div>

        <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-center mb-32">
          <FadeInSection className="w-full md:w-2/5 relative">
            <div className="aspect-square bg-gray-100 relative z-10 max-w-md mx-auto md:mx-0">
              <ScrollGrayscaleImage src="/images/about/stories/about_story_taue_123.webp" alt="Farmers" />
            </div>
            <div className="absolute -bottom-6 -right-2 w-2/3 h-1/2 border border-primary z-0 hidden md:block" />
          </FadeInSection>
          <FadeInSection className="w-full md:w-1/2 space-y-8">
            <h3 className="text-2xl md:text-3xl font-serif tracking-widest">農へのアクセスを良好に</h3>
            <div className="text-sm md:text-base space-y-6 text-gray-600 leading-loose font-light font-serif">
              <p>近年、農家の減少により、島の子どもたちですら、自然が「身近にはあるものの、生活とは切り離された存在」となりつつあります。</p>
              <p>そこで私たちは、農へのアクセスを良好にし、農家ならではの学びの場を創出しています。</p>
              <p>稲刈りや田植えなど体験価値の高い繁忙期にも、依頼に応える体制を整備しました。</p>
              <p>こうして得られた&quot;原体験&quot;が、島の子どもたちの自然との豊かな関係を育み、未来を創る力へとつながることを願っています。</p>
            </div>
          </FadeInSection>
        </div>
      </section>

      <section className="pt-8 pb-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeInSection>
            <Link href="/blog" className="inline-block text-gray-900 hover:text-gray-700 transition-all duration-300 group hover:scale-105">
              <div className="font-serif text-base md:text-lg leading-relaxed">
                <p className="mb-2">read more</p>
                <p className="mb-2 relative inline-block">
                  BLOG
                  <span className="absolute bottom-0 left-0 w-full h-px bg-primary" />
                </p>
              </div>
            </Link>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
