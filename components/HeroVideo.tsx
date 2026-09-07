'use client';

import React, { useState, useEffect } from 'react';

const HERO_IMG_400 = '/images/home/parallax/sunset_riceplanting_7_400.webp';
const HERO_IMG_800 = '/images/home/parallax/sunset_riceplanting_7_800.webp';
const HERO_IMG_1200 = '/images/home/parallax/sunset_riceplanting_7_1200.webp';

/** リブランディング用のトップ動画 */
const DEFAULT_HERO_VIDEO = '/videos/hero.mp4';

const HeroVideo = () => {
  const mp4Url = DEFAULT_HERO_VIDEO;
  const useMp4 = true; // 常に動画を試す。失敗時は画像にフォールバック

  const [isLoaded, setIsLoaded] = useState(!useMp4);
  const [isLoading, setIsLoading] = useState(useMp4);
  const [mp4Failed, setMp4Failed] = useState(false);

  const handleMp4Error = () => {
    if (!isLoaded) setMp4Failed(true);
  };
  const handleMp4Loaded = () => {
    setIsLoading(false);
    setIsLoaded(true);
  };

  const loadTimeoutMs = 8000;
  useEffect(() => {
    if (!useMp4 || mp4Failed) return;
    const timer = setTimeout(() => {
      if (isLoading) setMp4Failed(true);
    }, loadTimeoutMs);
    return () => clearTimeout(timer);
  }, [useMp4, mp4Failed, isLoading, loadTimeoutMs]);

  // MP4 が設定されていない、または読み込み失敗時: プレースホルダー画像を表示
  const showPlaceholder = !useMp4 || mp4Failed;

  return (
    <section id="home-hero" className="relative w-full overflow-hidden bg-[#f7f2df] pb-12 md:pb-20 md:pr-[9vw]">
      {/* Mobile */}
      <div className="relative h-[78svh] w-[94%] overflow-hidden rounded-br-[72px] md:hidden">
        {useMp4 && isLoading && !mp4Failed && (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {showPlaceholder ? (
          <img
            src={HERO_IMG_400}
            srcSet={`${HERO_IMG_400} 400w, ${HERO_IMG_800} 800w, ${HERO_IMG_1200} 1200w`}
            sizes="(max-width: 768px) 100vw, 100vw"
            alt="IKEVEGE"
            width={400}
            height={225}
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
          />
        ) : (
          <video
            src={mp4Url}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={handleMp4Loaded}
            onError={handleMp4Error}
          />
        )}
      </div>

      {/* Desktop */}
      <div className="relative hidden h-[calc(100svh-64px)] min-h-[700px] max-h-[980px] w-full overflow-hidden rounded-br-[clamp(96px,10vw,180px)] md:block">
        {useMp4 && isLoading && !mp4Failed && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
            <div className="text-white text-sm animate-pulse">読み込み中...</div>
          </div>
        )}
        {showPlaceholder ? (
          <img
            src={HERO_IMG_800}
            srcSet={`${HERO_IMG_400} 400w, ${HERO_IMG_800} 800w, ${HERO_IMG_1200} 1200w`}
            sizes="(max-width: 768px) 100vw, 100vw"
            alt="IKEVEGE"
            width={800}
            height={450}
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
          />
        ) : (
          <video
            src={mp4Url}
            className={`absolute inset-0 h-full w-full scale-[1.18] object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={handleMp4Loaded}
            onError={handleMp4Error}
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 px-6 text-white md:bottom-32 md:px-12">
        <p className="text-[10px] font-medium uppercase tracking-[0.34em] drop-shadow md:text-xs">
          From Sado Island, Niigata
        </p>
        <h2 className="mt-4 max-w-[12em] font-serif text-3xl font-semibold leading-[1.55] tracking-[0.12em] drop-shadow-lg md:text-5xl lg:text-6xl">
          佐渡の自然を、
          <br />
          おいしさに。
        </h2>
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex h-24 w-24 rotate-6 items-center justify-center rounded-full bg-yuunagi text-center text-xs font-semibold leading-relaxed text-white shadow-lg md:bottom-10 md:right-[3vw] md:h-32 md:w-32 md:text-sm">
        あんしん、
        <br />
        おいしい、
        <br />
        いいとき。
      </div>

      <a
        href="#ikevege-message"
        className="absolute bottom-4 left-1/2 z-20 hidden min-h-11 -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white md:flex"
      >
        <span className="h-12 w-px animate-pulse bg-white" />
        Scroll
      </a>
    </section>
  );
};

export default HeroVideo;
