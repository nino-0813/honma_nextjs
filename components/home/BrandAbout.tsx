import Link from 'next/link';
import Image from 'next/image';
import FadeIn from '@/components/FadeIn';

/**
 * ホームではブランドメッセージだけを簡潔に伝え、詳細は /about に集約する。
 */
export default function BrandAbout() {
  return (
    <section className="bg-white py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6 md:px-14">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <FadeIn>
            <p className="font-serif text-[48px] font-semibold leading-[1.42] tracking-[0.08em] text-primary sm:text-[58px] md:text-[72px] lg:text-[82px] xl:text-[88px]">
              あんしん、<br />おいしい、<br />いいとき。
            </p>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="relative aspect-square overflow-hidden bg-dim sm:aspect-[4/3] lg:aspect-[5/6]">
              <Image
                src="/images/about/hero/retreat_2025_56.webp"
                alt="佐渡の田んぼで笑顔を見せる大人と子どもたち"
                fill
                sizes="(min-width: 1024px) 38vw, 100vw"
                className="object-cover"
              />
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={180}>
          <div className="mt-14 max-w-4xl text-base leading-[2.15] text-gray-600 md:mt-20 md:text-lg">
            <div className="flex flex-col gap-8 md:gap-10">
              <p>
                ヒトと自然が共生していく道を選んだこの島には<br />
                絶滅危惧種のトキと共生するために<br />
                島の全ての農家がその取り組みに関わってきた歴史があります。
              </p>

              <p>
                そのバトンを受け取りイケベジは始まりました。
              </p>

              <p>
                自然のチカラに寄り添ってつくった食べものが<br />
                みんなの活力になり、なんてことのない日常でも<br />
                格別な時間（とき）に感じられますように。
              </p>

              <p className="font-serif text-xl font-semibold tracking-[0.12em] text-primary md:text-2xl">
                「きょうも しぜんと いいときを。」
              </p>
              <Link
                href="/about"
                className="mt-3 inline-flex min-h-11 w-fit items-center gap-3 rounded-full border border-gray-300 px-6 py-3 text-xs leading-normal text-primary transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hekishoku focus-visible:ring-offset-2"
              >
                詳しく知る →
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
