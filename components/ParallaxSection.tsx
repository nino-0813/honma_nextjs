import React from 'react';
import Link from 'next/link';

const ParallaxSection = () => {
  return (
    <section className="relative py-8 md:py-16 overflow-x-hidden w-full">
      {/* Mobile Layout: Image with Overlay Box */}
      <div className="md:hidden">
        <div className="w-full h-[450px] relative overflow-hidden">
          <img 
            src="/images/home/parallax/sunset_riceplanting_7_400.webp"
            srcSet="/images/home/parallax/sunset_riceplanting_7_400.webp 400w, /images/home/parallax/sunset_riceplanting_7_800.webp 800w, /images/home/parallax/sunset_riceplanting_7_1200.webp 1200w"
            sizes="(max-width: 768px) 100vw, 100vw"
            alt="IKEVEGE"
            width={400}
            height={225}
            className="w-full h-full object-cover"
            style={{ objectPosition: '18% center' }}
            loading="lazy"
          />
        </div>
        
        {/* Content Box - Below Image */}
        <div className="bg-white -mt-8 mx-4 rounded-lg shadow-lg border border-gray-100 relative z-10">
          <div className="px-5 py-6">
            {/* Label */}
            <div className="text-center mb-3">
              <span className="text-[9px] font-bold tracking-[0.25em] text-gray-400 uppercase">
                ABOUT US
              </span>
              <div className="w-8 h-px bg-primary/30 mx-auto mt-2 mb-3"></div>
            </div>
            
            {/* Main Heading */}
            <h2 className="text-xl font-serif font-medium tracking-[0.3em] text-primary text-center mb-4 leading-tight">
              Farm to Social
            </h2>
            
            {/* Description */}
            <p className="text-sm md:text-base font-medium md:font-normal leading-relaxed md:leading-relaxed text-gray-600 text-center px-2 mb-6 md:mb-8">
              商品を生産して終わりではなく、農を<br />
              起点に社会にとって意味のある存在で<br />
              在り続けたいと考えています。
            </p>
            
            {/* CTA Button */}
            <div className="text-center mb-6 md:mb-0">
              <Link href="/about" className="inline-flex items-center gap-1.5 group">
                <span className="text-primary font-serif tracking-[0.15em] text-[10px] uppercase border-b border-primary/50 pb-0.5 transition-all duration-300 group-hover:border-primary group-hover:text-gray-700">
                  VIEW MORE
                </span>
                <svg 
                  className="w-3 h-3 text-primary/70 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout: Parallax Background with Overlay Box */}
      <div className="hidden md:flex h-[650px] items-center overflow-hidden relative">
        <div className="absolute inset-0">
          <img 
            src="/images/home/parallax/sunset_riceplanting_7_800.webp"
            srcSet="/images/home/parallax/sunset_riceplanting_7_400.webp 400w, /images/home/parallax/sunset_riceplanting_7_800.webp 800w, /images/home/parallax/sunset_riceplanting_7_1200.webp 1200w"
            sizes="(max-width: 768px) 100vw, 100vw"
            alt="IKEVEGE"
            width={800}
            height={450}
            className="w-full h-full object-cover parallax-bg"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 flex justify-center lg:justify-end">
          <div className="bg-white/90 backdrop-blur-sm p-12 max-w-lg shadow-2xl">
              <p className="text-sm font-bold tracking-widest mb-4 text-gray-500 uppercase">About Us</p>
              <h2 className="text-4xl font-serif mb-6 text-primary tracking-[0.2em]">Farm to Social</h2>
              <p className="text-sm md:text-base font-medium md:font-normal leading-relaxed md:leading-relaxed text-gray-600 mb-8">
                商品を生産して終わりではなく、農を<br />
                起点に社会にとって意味のある存在で<br />
                在り続けたいと考えています。
              </p>
              <Link href="/about" className="inline-block border-b border-primary pb-1 text-primary hover:text-gray-600 transition-colors uppercase text-sm tracking-widest">
                View More
              </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParallaxSection;