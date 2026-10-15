import Link from 'next/link';
import CircleButton from './CircleButton';
import FadeIn from '@/components/FadeIn';

const TILES = [
  { title: 'お米', href: '/collections/rice', image: '/images/renewal/lineup/rice.webp' },
  { title: '原木しいたけ', href: '/collections/shiitake', image: '/images/renewal/lineup/shiitake.webp' },
  { title: 'その他', href: '/collections/crescent', image: '/images/crescentmoon/589F7B72-C537-4904-A9AD-55F5EDFF1A71.jpg' },
];

export default function Lineup() {
  return (
    <section id="products" className="bg-white pb-32 md:pb-48">
      <ul className="site-shell grid grid-cols-2 gap-3 bg-white md:gap-5 lg:grid-cols-3 lg:gap-6">
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
        <li className="flex aspect-square items-end justify-end lg:hidden">
          <Link href="/collections" className="site-pill-link">
            商品一覧へ →
          </Link>
        </li>
      </ul>
      <div className="site-shell mt-10 hidden justify-end lg:flex">
        <Link href="/collections" className="site-pill-link">
          商品一覧へ →
        </Link>
      </div>
    </section>
  );
}
