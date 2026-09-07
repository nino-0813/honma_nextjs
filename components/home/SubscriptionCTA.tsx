import Link from 'next/link';
import Image from 'next/image';
import SectionHeading from './SectionHeading';
import FadeIn from '@/components/FadeIn';
import TokiCharacter from './TokiCharacter';

/**
 * 定期便（ベースフードの「継続コース」に相当）。
 * 左に大きな宣言 / 右に本文、その下に4つの利点、最後に中央のCTA。
 *
 * 要件どおり、社会的意義と経済メリットの両方でクロージングする。
 */
export default function SubscriptionCTA() {
  return (
    <section className="relative overflow-hidden bg-white py-24 text-primary md:py-36">
      <TokiCharacter character="hello" motion="peek" className="left-[-30px] top-8 h-24 w-24 md:left-8 md:top-14 md:h-32 md:w-32" />
      <TokiCharacter character="logo" className="bottom-8 right-[-22px] h-24 w-24 md:bottom-12 md:right-8 md:h-28 md:w-28" />
      <div className="mx-auto max-w-[1280px] px-6 md:px-12">
        <FadeIn>
          <SectionHeading ja="イケベジ定期便" />
        </FadeIn>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
          <div className="flex items-center">
            <h2 className="sr-only">4700人でつくる里山の風景</h2>
            <Image
              src="/images/renewal/subscription-heading.webp"
              alt="IKEVEGE FROM SADO　4700人でつくる里山の風景"
              width={2172}
              height={410}
              sizes="(min-width: 1024px) 560px, 92vw"
              className="h-auto w-full max-w-[620px]"
            />
          </div>
          <div className="flex flex-col gap-4 text-sm leading-loose text-gray-600 md:text-base">
            <p>
              定期便は、割引の仕組みである前に、お客様とイケベジが一緒に歩んでいくための形です。
            </p>
            <p>
              毎月受け取っていただけることで、私たちは翌年どれだけの田んぼを動かせるかを計画できます。
              続けていただくことが、そのまま佐渡の田んぼを残すことにつながっています。
            </p>
          </div>
        </div>

        <div className="scrollbar-hide mt-14 overflow-x-auto">
          <div className="min-w-[880px] md:min-w-0">
            <Image
              src="/images/renewal/subscription-points.webp"
              alt="定期便の4つの特徴：10%OFF、出荷直前精米、スキップ・変更自由、佐渡の田んぼを支える"
              width={2172}
              height={724}
              sizes="(min-width: 1340px) 1280px, (min-width: 768px) 94vw, 880px"
              className="h-auto w-full"
            />
          </div>
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/collections/rice/yearly?view=lp"
            className="inline-flex min-h-14 items-center gap-3 rounded-full bg-hekishoku px-10 py-4 text-sm font-medium text-white transition-colors hover:bg-primary"
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
