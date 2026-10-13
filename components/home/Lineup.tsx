import Link from 'next/link';
import CircleButton from './CircleButton';
import FadeIn from '@/components/FadeIn';

const TILES = [
  { title: 'お米', href: '/collections/rice', image: '/images/renewal/lineup/rice.webp' },
  { title: '原木しいたけ', href: '/collections/shiitake', image: '/images/renewal/lineup/shiitake.webp' },
  { title: 'その他', href: '/collections/crescent', image: '/images/renewal/lineup/others.webp' },
];

export default function Lineup() {
  return (
    <section id="products" className="bg-white px-6 pb-32 md:px-[10%] md:pb-48">
      <ul className="mx-auto grid max-w-[1440px] grid-cols-2 gap-3 bg-white md:gap-5 lg:grid-cols-3 lg:gap-6">
        {TILES.map((tile, index) => (
          <li key={tile.title} className={index === 2 ? 'col-start-1 lg:col-start-auto' : ''}>
            <FadeIn delay={index * 70}>
              <Link href={tile.href} aria-label={`${tile.title}の商品を見る`} className="group block">
                <span className="relative block aspect-square overflow-hidden bg-dim">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tile.image} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]" />
                  <span className="absolute inset-0 bg-black/25 transition-colors duration-300 group-hover:bg-black/35" />
                  <span className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                    <span className="font-serif text-lg tracking-[0.08em] drop-shadow-sm md:text-[28px] lg:text-[34px]">{tile.title}</span>
                    <span className="mt-3 scale-75 md:mt-6 md:scale-100"><CircleButton icon="arrow" variant="light" /></span>
                  </span>
                </span>
              </Link>
            </FadeIn>
          </li>
        ))}
      </ul>
      <div className="mx-auto mt-6 flex max-w-[1440px] justify-end md:mt-8">
        <Link href="/collections" className="inline-flex min-h-10 items-center rounded-full border border-gray-300 px-6 text-[10px] text-primary transition-colors hover:border-primary md:min-h-11 md:px-7 md:text-xs">
          商品一覧へ →
        </Link>
      </div>
    </section>
  );
}
