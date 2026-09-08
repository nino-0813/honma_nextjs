import Link from 'next/link';
import FadeIn from '@/components/FadeIn';

/**
 * 定期便の社会的意義を、風景写真と共に簡潔に伝える。
 */
export default function SubscriptionCTA() {
  return (
    <section className="bg-white py-20 text-primary md:py-32">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <FadeIn>
          <p className="text-center text-sm font-medium tracking-[0.16em] text-primary">イケベジ定期便</p>
        </FadeIn>

        <div className="mx-auto mt-6 max-w-3xl text-center">
          <FadeIn delay={80}>
            <h2 className="font-serif text-3xl font-semibold leading-[1.55] tracking-wide text-primary md:text-[44px]">
              4700人でつくる里山の風景
            </h2>
            <div className="mt-7 flex flex-col gap-4 text-sm leading-loose text-gray-600 md:text-base">
              <p>定期便は、割引の仕組みである前に、お客様とイケベジが一緒に歩んでいくための形です。</p>
              <p>続けていただくことが、そのまま佐渡の田んぼを残すことにつながっています。</p>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={140}>
          <div className="mx-auto mt-12 aspect-[16/9] max-w-6xl overflow-hidden bg-dim md:mt-16 md:aspect-[16/7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/about/stories/P3A9707.webp" alt="佐渡の田んぼと里山の風景" loading="lazy" className="h-full w-full object-cover" />
          </div>
        </FadeIn>

        <div className="mt-12 text-center">
          <Link
            href="/collections/rice/yearly?view=lp"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-yuunagi px-10 py-4 text-sm font-medium text-white transition-colors hover:bg-yuunagi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yuunagi focus-visible:ring-offset-2"
          >
            定期便をはじめる
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
