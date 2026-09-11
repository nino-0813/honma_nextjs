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
              4700人とつくる里山
            </h2>
            <div className="mt-7 flex flex-col gap-4 text-sm leading-loose text-gray-600 md:text-base">
              <p>イケベジは佐渡ヶ島と共に、これからも前に進み続けます。<br />その佐渡の中で、イケベジが生まれ進むべき経路が「農田集落」です。</p>
              <p>定期便は、リーズナブルに安定してお届けする仕組みであると共に、<br className="hidden md:block" />お客様とイケベジが一緒に歩んでいくための形です。</p>
              <p>無意識の日常の一杯のご飯が、着実に日本の農業を変え、<br className="hidden md:block" />この「農田集落」を繋いでいく一杯になります。</p>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={140}>
          <div className="mx-auto mt-12 aspect-[16/9] max-w-6xl overflow-hidden bg-dim md:mt-16 md:aspect-[16/7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/about/stories/about_story_taue_123.webp" alt="佐渡の田んぼで田植えをする人々" loading="lazy" className="h-full w-full object-cover" />
          </div>
        </FadeIn>

        <div className="mt-12 text-center">
          <Link
            href="/collections/rice/yearly?view=lp"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-10 py-4 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
