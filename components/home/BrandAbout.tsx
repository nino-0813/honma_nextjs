import Link from 'next/link';
import Image from 'next/image';
import FadeIn from '@/components/FadeIn';

/**
 * ホームではブランドメッセージだけを簡潔に伝え、詳細は /about に集約する。
 */
export default function BrandAbout() {
  return (
    <section className="bg-white py-20 md:py-32">
      <div className="mx-auto max-w-[1280px] px-6 md:px-14">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-20">
          <FadeIn className="lg:sticky lg:top-28">
            <div className="relative aspect-[4/3] overflow-hidden bg-dim">
              <Image
                src="/images/about/hero/about_hero_taue_92.webp"
                alt="佐渡の田んぼで田植えをする人々"
                fill
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="object-cover"
              />
            </div>
          </FadeIn>

          <div>
            <FadeIn className="flex min-h-[62vh] items-center py-12 lg:min-h-[72vh]">
              <h2 className="font-serif text-[50px] font-semibold leading-[1.42] tracking-[0.08em] text-primary sm:text-[60px] md:text-[72px] lg:text-[76px]">
                あんしん、<br />おいしい、<br />いいとき。
              </h2>
            </FadeIn>

            <FadeIn className="flex min-h-[62vh] items-center py-16 lg:min-h-[72vh]">
              <div className="space-y-9 text-base leading-[2.15] text-gray-600 md:text-lg">
                <p>
                  ヒトと自然が共生していく道を選んだこの島には<br className="hidden xl:block" />
                  絶滅危惧種のトキと共生するために<br className="hidden xl:block" />
                  島の全ての農家がその取り組みに関わってきた歴史があります。
                </p>
                <p>そのバトンを受け取りイケベジは始まりました。</p>
              </div>
            </FadeIn>

            <FadeIn className="flex min-h-[62vh] items-center py-16 lg:min-h-[72vh]">
              <div className="space-y-9 text-base leading-[2.15] text-gray-600 md:text-lg">
                <p>
                  自然のチカラに寄り添ってつくった食べものが<br className="hidden xl:block" />
                  みんなの活力になり、なんてことのない日常でも<br className="hidden xl:block" />
                  格別な時間（とき）に感じられますように。
                </p>
                <p className="font-serif text-xl font-semibold tracking-[0.12em] text-primary md:text-2xl">
                  「きょうも しぜんと いいときを。」
                </p>
                <Link href="/about" className="inline-flex min-h-11 w-fit items-center rounded-full border border-gray-300 px-6 py-3 text-xs leading-normal text-primary transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hekishoku focus-visible:ring-offset-2">
                  詳しく知る →
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
