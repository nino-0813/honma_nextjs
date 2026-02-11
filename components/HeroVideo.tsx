'use client';

import React, { useState, useEffect } from 'react';

const HERO_IMG_400 = '/images/home/parallax/sunset_riceplanting_7_400.webp';
const HERO_IMG_800 = '/images/home/parallax/sunset_riceplanting_7_800.webp';
const HERO_IMG_1200 = '/images/home/parallax/sunset_riceplanting_7_1200.webp';

const HeroVideo = () => {
  const mp4Url = process.env.NEXT_PUBLIC_HERO_VIDEO_URL ?? '';
  const useMp4 = Boolean(mp4Url);

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

  useEffect(() => {
    if (!useMp4 || mp4Failed) return;
    const timer = setTimeout(() => {
      if (isLoading) setMp4Failed(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [useMp4, mp4Failed, isLoading]);

  // MP4 が設定されていない、または読み込み失敗時: プレースホルダー画像を表示
  const showPlaceholder = !useMp4 || mp4Failed;

  return (
    <div className="relative w-full bg-gray-50">
      {/* Mobile */}
      <div className="md:hidden w-full h-[55vh] relative overflow-hidden">
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
            onLoadedData={handleMp4Loaded}
            onError={handleMp4Error}
          />
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block relative w-full h-[80vh] overflow-hidden">
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
            className={`absolute inset-0 w-full h-full object-cover scale-150 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={handleMp4Loaded}
            onError={handleMp4Error}
          />
        )}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none"></div>
      </div>
    </div>
  );
};

export default HeroVideo;
