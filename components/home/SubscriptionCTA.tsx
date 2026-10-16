import Link from 'next/link';
import FadeIn from '@/components/FadeIn';

const COMMUNITY_IMAGES = [
  { src: '/images/home/community-v2/sado-rice-fields.webp', alt: '佐渡の海と山を望む田園風景' },
  { src: '/images/home/community-v2/harvest-road.webp', alt: '収穫期の田んぼで農作業をする人たち' },
  { src: '/images/home/community-v2/family-rice-field.webp', alt: '佐渡の田んぼを歩く親子' },
  { src: '/images/home/community-v2/wild-berries.webp', alt: '野いちごを摘む親子の手' },
];

function SubscriptionCopy() {
  return (
    <>
      <p>
        イケベジは佐渡ヶ島と共にこれからも前に進み続けます。<br />
        その佐渡の中で、イケベジが生まれ継ないでいく集落が「豊田集落」
      </p>
      <p>
        定期便は、リーズナブルに安定してお届けする仕組みであると共に、<br />
        お客様とイケベジが一緒に歩んでいくための形です。
      </p>
      <p>
        無意識の日常の一杯のご飯が、着実に日本の農業を変え、<br />
        この「豊田集落」を繋いでいく一杯になります。
      </p>
    </>
  );
}

export default function SubscriptionCTA({ desktopSplit = false }: { desktopSplit?: boolean }) {
  return (
    <section className="bg-white pb-32 text-primary md:pb-48">
      <div className="site-shell md:hidden">
        <FadeIn>
          <div className="site-reading-column">
            {desktopSplit && <h2 className="font-serif text-[26px] font-semibold leading-[1.55] tracking-[0.08em] md:text-[42px] lg:text-[50px]">4700人とつくる<br className="md:hidden" />イケベジ定期便</h2>}
            <div className="site-reading-text subscription-reading-text mt-8 space-y-10 font-serif text-gray-600 md:mt-12">
              <SubscriptionCopy />
            </div>
          </div>
        </FadeIn>
        <FadeIn className="mx-2 mt-8 md:mt-12">
          <div className="grid grid-cols-2 overflow-hidden">
            {COMMUNITY_IMAGES.map((image) => (
              <div key={image.src} className="aspect-[3/2] overflow-hidden bg-dim">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.src} alt={image.alt} loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </FadeIn>
        <div className="mx-2 mt-8 text-left md:mt-12 md:text-center">
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
                  <h2 className="font-serif text-[42px] font-semibold leading-[1.55] tracking-[0.08em] lg:text-[50px]">
                    4700人とつくる<br />イケベジ定期便
                  </h2>
                  <div className="site-reading-text subscription-reading-text mt-12 space-y-10 font-serif text-gray-600">
                    <SubscriptionCopy />
                  </div>
                </div>
              </FadeIn>
              <div className="mt-16 flex justify-end">
                <Link href="/collections/rice/yearly?view=lp" className="site-pill-link">
                  定期便を始める →
                </Link>
              </div>
            </div>

            <div className="relative min-h-0 overflow-hidden">
              <FadeIn className="absolute inset-y-0 right-0 grid w-2/3 min-h-0 grid-rows-4 overflow-hidden">
                {COMMUNITY_IMAGES.map((image) => (
                  <div key={image.src} className="min-h-0 overflow-hidden bg-dim">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.src} alt={image.alt} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                ))}
              </FadeIn>
            </div>
          </div>
        </div>
      ) : (
        <div className="site-shell hidden md:block">
          <div className="grid grid-cols-[280px_1fr] gap-16">
            <FadeIn>
              <p className="font-serif text-xl font-semibold tracking-wider text-primary md:text-2xl">イケベジ定期便</p>
            </FadeIn>
            <FadeIn>
              <div className="site-reading-text subscription-reading-text space-y-10 text-left font-serif text-gray-600">
                <SubscriptionCopy />
              </div>
              <div className="mt-12 text-left">
                <Link href="/collections/rice/yearly?view=lp" className="site-pill-link">
                  定期便を始める →
                </Link>
              </div>
            </FadeIn>
          </div>
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
        </div>
      )}
    </section>
  );
}
