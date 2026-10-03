import Link from 'next/link';
import FadeIn from '@/components/FadeIn';

const COMMUNITY_IMAGES = [
  { src: '/images/renewal/activities/harvest-retreat.webp', alt: '田んぼに集うイケベジの仲間たち' },
  { src: '/images/renewal/about/safety.webp', alt: '苗を育てる農作業' },
  { src: '/images/renewal/about/delicious.webp', alt: 'お米の食味分析鑑定コンクール' },
  { src: '/images/renewal/about/smiles.webp', alt: '佐渡の田んぼに集まった子どもたち' },
];

export default function SubscriptionCTA() {
  return (
    <section className="bg-white px-[10%] pb-32 text-primary md:pb-48">
      <div className="mx-auto max-w-[1440px]">
        <FadeIn>
          <div className="max-w-[820px]">
            <h2 className="font-serif text-[26px] font-semibold leading-[1.55] tracking-[0.08em] md:text-[42px] lg:text-[50px]">4700人とつくる里山</h2>
            <div className="mt-8 space-y-6 font-serif text-[10px] leading-[2.25] tracking-[0.04em] text-gray-600 md:mt-12 md:text-[14px] md:leading-[2.35]">
              <p>イケベジは佐渡ヶ島と共にこれからも前に進み続けます。<br />その佐渡の中で、イケベジが生まれ継ないでいく集落が「豊田集落」</p>
              <p>定期便は、リーズナブルに安定してお届けする仕組みであると共に、<br />お客様とイケベジが一緒に歩んでいくための形です。</p>
              <p>無意識の日常の一杯のご飯が、着実に日本の農業を変え、<br />この「豊田集落」を繋いでいく一杯になります。</p>
            </div>
          </div>
        </FadeIn>
        <FadeIn className="mt-16 md:mt-24">
          <div className="grid grid-cols-2 overflow-hidden">
            {COMMUNITY_IMAGES.map((image) => (
              <div key={image.src} className="aspect-[4/3] overflow-hidden bg-dim">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.src} alt={image.alt} loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </FadeIn>
        <div className="mt-16 text-center md:mt-24">
          <Link href="/collections/rice/yearly?view=lp" className="inline-flex min-h-11 items-center rounded-full border border-primary bg-white px-8 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white md:min-h-12 md:px-10 md:text-sm">
            定期便をはじめる →
          </Link>
        </div>
      </div>
    </section>
  );
}
