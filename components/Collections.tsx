import React from 'react';
import Link from 'next/link';
import { Collection } from '../types';

// 400px/600px/800px/1200px の srcset でレスポンシブ配信（モバイル最適化）
const collections: Collection[] = [
  { id: '1', title: 'コシヒカリ', handle: 'koshihikari', image: '/images/home/collections/collection_koshihikari_1200.webp', imageMobile: '/images/home/collections/collection_koshihikari_800.webp', imageMobile600: '/images/home/collections/collection_koshihikari_600.webp', imageMobile400: '/images/home/collections/collection_koshihikari_400.webp', path: '/collections/rice/koshihikari' },
  { id: '2', title: '亀の尾', handle: 'kamenoo', image: '/images/home/collections/collection_kamenoo_1200.webp', imageMobile: '/images/home/collections/collection_kamenoo_800.webp', imageMobile600: '/images/home/collections/collection_kamenoo_600.webp', imageMobile400: '/images/home/collections/collection_kamenoo_400.webp', path: '/collections/rice/kamenoo' },
  { id: '3', title: 'にこまる', handle: 'nikomaru', image: '/images/home/collections/4_1200.webp', imageMobile: '/images/home/collections/4_800.webp', imageMobile600: '/images/home/collections/4_600.webp', imageMobile400: '/images/home/collections/4_400.webp', path: '/collections/rice/nikomaru' },
  { id: '4', title: '年間契約', handle: 'yearly', image: '/images/home/collections/2_1200.webp', imageMobile: '/images/home/collections/2_800.webp', imageMobile600: '/images/home/collections/2_600.webp', imageMobile400: '/images/home/collections/2_400.webp', path: '/collections/rice/yearly' },
];

const Collections = () => {
  return (
    <section className="py-8 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4 bg-white">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={collection.path || `/collections/rice/${collection.handle}`}
            className="group relative overflow-hidden bg-gray-200 block aspect-[2.5/1] md:aspect-auto border border-gray-200/40 md:border-0"
          >
            <img
              src={collection.image}
              srcSet={collection.imageMobile ? `${collection.imageMobile400 ? `${collection.imageMobile400} 400w, ` : ''}${collection.imageMobile600 ? `${collection.imageMobile600} 600w, ` : ''}${collection.imageMobile} 800w, ${collection.image} 1200w` : undefined}
              sizes="(max-width: 768px) 100vw, 50vw"
              alt={collection.title}
              width={400}
              height={160}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-black/15 to-transparent" />
              <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-black/15 to-transparent" />
              <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-black/15 to-transparent" />
            </div>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-black/8 to-transparent" />
              <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-black/8 to-transparent" />
              <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-black/8 to-transparent" />
              <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-black/8 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <div className="absolute inset-0 flex items-end justify-start p-4 md:p-6 z-10">
              <h3 className="text-white text-lg md:text-xl font-serif tracking-wider font-bold relative inline-block drop-shadow-lg max-w-[90%]">
                {collection.title}
                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full" />
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Collections;