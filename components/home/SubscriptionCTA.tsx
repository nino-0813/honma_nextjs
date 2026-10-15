import Link from 'next/link';
import FadeIn from '@/components/FadeIn';

const COMMUNITY_IMAGES = [
  { src: '/images/home/community-v2/sado-rice-fields.webp', alt: '佐渡の海と山を望む田園風景' },
  { src: '/images/home/community-v2/harvest-road.webp', alt: '収穫期の田んぼで農作業をする人たち' },
  { src: '/images/home/community-v2/family-rice-field.webp', alt: '佐渡の田んぼを歩く親子' },
  { src: '/images/home/community-v2/wild-berries.webp', alt: '野いちごを摘む親子の手' },
];

export default function SubscriptionCTA({ desktopSplit = false }: { desktopSplit?: boolean }) {
  return (
    <section className="bg-white pb-32 text-primary md:pb-48">
      <div className="site-shell md:hidden">
        <FadeIn>
          <div className="site-reading-column">
            <p className="mb-4 text-[10px] tracking-[0.24em] text-gray-500 md:text-xs">イケベジ定期便</p>
            <h2 className="font-serif text-[26px] font-semibold leading-[1.55] tracking-[0.08em] md:text-[42px] lg:text-[50px]">4700人とつくる<br className="md:hidden" />イケベジ定期便</h2>
            <div className="site-reading-text subscription-reading-text mt-8 space-y-10 font-serif text-gray-600 md:mt-12">
              <p>
                イケベジがお米をつくる佐渡・豊田集落には、東京ドーム約10個分の田んぼが広がっています。川から約4kmの水路で水を引き、
                地域の農家が力を合わせて、この風景と稲作を守ってきました。
              </p>
              <p>
                時代が移り変わるなかで、この営みを食べる人と一緒に次へつないでいきたい。お米を食べることが、農家を増やしている実感につながるように。
                そんな思いで、この定期便を始めました。
              </p>
            </div>
          </div>
        </FadeIn>
        <FadeIn className="mt-8 md:mt-12">
          <div className="grid grid-cols-2 overflow-hidden">
            {COMMUNITY_IMAGES.map((image) => (
              <div key={image.src} className="aspect-[3/2] overflow-hidden bg-dim">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.src} alt={image.alt} loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </FadeIn>
        <div className="mt-8 text-left md:mt-12 md:text-center">
          <Link href="/collections/rice/yearly?view=lp" className="site-pill-link">
            定期便を始める →
          </Link>
        </div>
      </div>

      {desktopSplit ? (
        <div className="site-shell hidden md:block">
          <div className="grid grid-cols-2 items-stretch gap-20 lg:gap-32">
            <div className="flex min-w-0 flex-col justify-center">
              <FadeIn>
                <div className="site-reading-column">
                  <p className="mb-4 text-xs tracking-[0.24em] text-gray-500">イケベジ定期便</p>
                  <h2 className="font-serif text-[42px] font-semibold leading-[1.55] tracking-[0.08em] lg:text-[50px]">
                    4700人とつくる<br />イケベジ定期便
                  </h2>
                  <div className="site-reading-text subscription-reading-text mt-12 space-y-10 font-serif text-gray-600">
                    <p>
                      イケベジがお米をつくる佐渡・豊田集落には、東京ドーム約10個分の田んぼが広がっています。川から約4kmの水路で水を引き、
                      地域の農家が力を合わせて、この風景と稲作を守ってきました。
                    </p>
                    <p>
                      時代が移り変わるなかで、この営みを食べる人と一緒に次へつないでいきたい。お米を食べることが、農家を増やしている実感につながるように。
                      そんな思いで、この定期便を始めました。
                    </p>
                  </div>
                </div>
              </FadeIn>
              <div className="mt-16 flex justify-end">
                <Link href="/collections/rice/yearly?view=lp" className="site-pill-link">
                  定期便を始める →
                </Link>
              </div>
            </div>

            <FadeIn className="grid min-h-0 grid-rows-4 overflow-hidden">
              {COMMUNITY_IMAGES.map((image) => (
                <div key={image.src} className="min-h-0 overflow-hidden bg-dim">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.src} alt={image.alt} loading="lazy" className="h-full w-full object-cover" />
                </div>
              ))}
            </FadeIn>
          </div>
        </div>
      ) : (
        <div className="site-shell hidden md:block">
          <FadeIn>
            <div className="site-reading-column">
              <p className="mb-4 text-xs tracking-[0.24em] text-gray-500">イケベジ定期便</p>
              <h2 className="font-serif text-[42px] font-semibold leading-[1.55] tracking-[0.08em] lg:text-[50px]">4700人とつくるイケベジ定期便</h2>
              <div className="site-reading-text subscription-reading-text mt-12 space-y-10 font-serif text-gray-600">
                <p>
                  イケベジがお米をつくる佐渡・豊田集落には、東京ドーム約10個分の田んぼが広がっています。川から約4kmの水路で水を引き、
                  地域の農家が力を合わせて、この風景と稲作を守ってきました。
                </p>
                <p>
                  時代が移り変わるなかで、この営みを食べる人と一緒に次へつないでいきたい。お米を食べることが、農家を増やしている実感につながるように。
                  そんな思いで、この定期便を始めました。
                </p>
              </div>
            </div>
          </FadeIn>
          <FadeIn className="mt-12">
            <div className="grid grid-cols-2 overflow-hidden">
              {COMMUNITY_IMAGES.map((image) => (
                <div key={image.src} className="aspect-[3/2] overflow-hidden bg-dim">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.src} alt={image.alt} loading="lazy" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </FadeIn>
          <div className="mt-12 text-center">
            <Link href="/collections/rice/yearly?view=lp" className="site-pill-link">
              定期便を始める →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
