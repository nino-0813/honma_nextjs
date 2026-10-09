import Link from 'next/link';
import CircleButton from './CircleButton';
import FadeIn from '@/components/FadeIn';

const TILES = [
  { en: 'Rice', ja: 'お米', href: '/collections/rice', image: '/images/renewal/lineup/rice.webp' },
  { en: 'Shiitake', ja: '原木しいたけ', href: '/collections/shiitake', image: '/images/renewal/lineup/shiitake.webp' },
  { en: 'Others', ja: 'その他', href: '/collections/crescent', image: '/images/renewal/lineup/others.webp' },
];

export default function Lineup() {
  return (
    <section id="products" className="bg-white px-4 pb-32 md:px-8 md:pb-48 lg:px-10">
      <ul className="grid grid-cols-2 gap-px bg-white lg:grid-cols-3">
        {TILES.map((tile, index) => (
          <li key={tile.ja} className={index === 2 ? 'col-start-1 lg:col-start-auto' : ''}>
            <FadeIn delay={index * 70}>
              <Link href={tile.href} aria-label={`${tile.ja}の商品を見る`} className="group block">
                <span className="relative block aspect-square overflow-hidden bg-dim md:aspect-[16/10]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tile.image} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]" />
                  <span className="absolute inset-0 bg-black/25 transition-colors duration-300 group-hover:bg-black/35" />
                  <span className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                    <span className="font-serif text-lg tracking-[0.04em] drop-shadow-sm md:text-[28px] lg:text-[34px]">{tile.en}</span>
                    <span className="mt-1 text-[9px] tracking-[0.18em] drop-shadow-sm md:mt-2 md:text-xs">{tile.ja}</span>
                    <span className="mt-3 scale-75 md:mt-6 md:scale-100"><CircleButton icon="arrow" variant="light" /></span>
                  </span>
                </span>
              </Link>
            </FadeIn>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex justify-end md:mt-14">
        <Link href="/collections" className="inline-flex min-h-10 items-center rounded-full border border-gray-300 px-6 text-[10px] text-primary transition-colors hover:border-primary md:min-h-11 md:px-7 md:text-xs">
          商品一覧へ →
        </Link>
      </div>
    </section>
  );
}
