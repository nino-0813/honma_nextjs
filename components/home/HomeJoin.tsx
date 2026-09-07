import Image from 'next/image';
import Link from 'next/link';
import FadeIn from '@/components/FadeIn';

const JOIN_PHOTOS = [
  { src: '/images/renewal/join-marquee/family.webp', alt: '田んぼで親子と過ごすイケベジの活動' },
  { src: '/images/renewal/join-marquee/sunflowers.webp', alt: 'ひまわり畑に立つ仲間' },
  { src: '/images/renewal/join-marquee/camera.webp', alt: 'カメラで発信する仲間' },
  { src: '/images/renewal/join-marquee/market.webp', alt: 'マルシェに出店するイケベジの仲間' },
  { src: '/images/renewal/join-marquee/tractor.webp', alt: '佐渡の田んぼで農作業をする様子' },
];

export default function HomeJoin() {
  return (
    <section className="overflow-hidden bg-white pb-0 pt-20 md:pt-28">
      <FadeIn>
        <div className="mx-auto mb-10 flex max-w-[1320px] items-end justify-between gap-8 px-6 md:mb-14 md:px-12">
          <Link
            href="/join-us"
            className="hidden min-h-12 shrink-0 items-center gap-3 rounded-full border border-primary px-7 py-3 text-xs transition-colors hover:bg-primary hover:text-white md:inline-flex"
          >
            取り組みを見る <span aria-hidden="true">→</span>
          </Link>
          <div className="ml-auto w-full max-w-[720px] md:w-[58%]">
            <h2 className="sr-only">毎日のごはんから、未来の田んぼを育てよう！</h2>
            <Image
              src="/images/renewal/join-heading.webp"
              alt="IKEVEGE FROM SADO　毎日のごはんから、未来の田んぼを育てよう！"
              width={2172}
              height={380}
              sizes="(min-width: 1280px) 720px, (min-width: 768px) 58vw, 92vw"
              className="h-auto w-full"
            />
          </div>
        </div>

        <div className="join-marquee flex w-max gap-4 md:gap-6">
          {[...JOIN_PHOTOS, ...JOIN_PHOTOS].map((photo, index) => (
            <Link
              href="/join-us"
              key={`${photo.src}-${index}`}
              aria-hidden={index >= JOIN_PHOTOS.length}
              tabIndex={index >= JOIN_PHOTOS.length ? -1 : undefined}
              className="group relative block h-[230px] w-[290px] shrink-0 overflow-hidden rounded-[20px] bg-gray-100 md:h-[340px] md:w-[450px] md:rounded-[28px]"
            >
              <Image
                src={photo.src}
                alt={index < JOIN_PHOTOS.length ? photo.alt : ''}
                fill
                sizes="(min-width: 768px) 450px, 290px"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
              />
            </Link>
          ))}
        </div>

        <div className="px-6 pt-8 text-center md:hidden">
          <Link href="/join-us" className="inline-flex min-h-12 items-center gap-3 rounded-full border border-primary px-7 py-3 text-xs">
            取り組みを見る <span aria-hidden="true">→</span>
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}
