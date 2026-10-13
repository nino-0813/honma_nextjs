import Link from 'next/link';
import FadeIn from '@/components/FadeIn';

const COMMUNITY_IMAGES = [
  { src: '/images/home/community/bamboo-grove.webp', alt: '竹林で竹を見上げる農家' },
  { src: '/images/home/community/rice-planting.webp', alt: '泥の中で苗を手にする田植え体験' },
  { src: '/images/home/community/bamboo-rice.webp', alt: '竹筒にお米を入れる体験' },
  { src: '/images/home/community/orchard.webp', alt: '果樹園で作業する人たち' },
];

export default function SubscriptionCTA() {
  return (
    <section className="bg-white pb-32 text-primary md:pb-48">
      <div className="site-shell">
        <FadeIn>
          <div className="site-reading-column">
            <p className="mb-4 text-[10px] tracking-[0.24em] text-gray-500 md:text-xs">イケベジ定期便</p>
            <h2 className="font-serif text-[26px] font-semibold leading-[1.55] tracking-[0.08em] md:text-[42px] lg:text-[50px]">4700人とつくる<br className="md:hidden" />イケベジ定期便</h2>
            <div className="site-reading-text mt-8 space-y-10 font-serif text-gray-600 md:mt-12">
              <p>
                イケベジがお米をつくる佐渡・豊田集落には、<br />
                東京ドーム約10個分の田んぼが広がっています。<br />
                川から約4kmの水路で水を引き、<br />
                地域の農家が力を合わせて、この風景と稲作を守ってきました。
              </p>
              <p>
                時代が移り変わるなかで、<br />
                この営みを食べる人と一緒に次へつないでいきたい。<br />
                お米を食べることが、農家を増やしている実感につながるように。<br />
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
          <Link href="/collections/rice/yearly?view=lp" className="inline-flex min-h-11 items-center rounded-full border border-primary bg-white px-8 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white md:min-h-12 md:px-10 md:text-sm">
            定期便をはじめる →
          </Link>
        </div>
      </div>
    </section>
  );
}
