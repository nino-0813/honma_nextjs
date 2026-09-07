import Link from 'next/link';
import Image from 'next/image';
import SectionHeading from './SectionHeading';
import FadeIn from '@/components/FadeIn';

/**
 * ホームではブランドメッセージだけを簡潔に伝え、詳細は /about に集約する。
 */
export default function BrandAbout() {
  return (
    <section id="ikevege-message" className="bg-[#f7f2df] pb-20 pt-40 md:pb-32 md:pt-56">
      <div className="mx-auto max-w-[1280px] px-6 md:px-14">
        <FadeIn>
          <div className="flex items-end justify-between gap-6">
            <SectionHeading en="Pick up" ja="イケベジとは" />
            <span className="hidden rotate-3 rounded-full bg-hekishoku px-5 py-2 text-xs font-medium tracking-[0.2em] text-white md:block">
              FROM SADO
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={80}>
          <div className="mt-12 overflow-hidden rounded-[32px] rounded-tr-[96px] bg-white shadow-[0_20px_70px_rgba(48,62,45,0.08)] md:rounded-[48px] md:rounded-tr-[160px]">
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="relative min-h-[360px] overflow-hidden md:min-h-[560px]">
                <Image
                  src="/images/about/hero/retreat_2025_56.webp"
                  alt="佐渡の田んぼで笑顔を見せる大人と子どもたち"
                  fill
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover transition-transform duration-700 hover:scale-[1.02] motion-reduce:transition-none"
                />
                <div className="absolute left-6 top-6 rounded-full bg-yuunagi px-4 py-2 text-[11px] font-semibold tracking-[0.16em] text-white md:left-10 md:top-10">
                  佐渡ヶ島から
                </div>
              </div>
              <div className="flex flex-col justify-center px-7 py-12 md:px-12 md:py-16 lg:px-14">
                <p className="font-serif text-3xl font-semibold leading-[1.55] tracking-wide text-primary md:text-[42px]">
                  あんしん、
                  <br />
                  おいしい、
                  <br />
                  いいとき。
                </p>
                <div className="mt-8 flex flex-col gap-5 text-sm leading-loose text-gray-600 md:text-base">
              <p className="whitespace-pre-line">{'イケベジは\n日々の暮らしのなかに “ ありのまま ” でいられる姿を想像し'}</p>
                  <p>自然から学び、豊かさを分かち合うことを通じて、佐渡という唯一無二の価値を守り続けます。</p>
                  <Link
                    href="/about"
                    className="mt-2 inline-flex min-h-12 w-fit items-center gap-4 rounded-full bg-hekishoku px-7 py-3 text-xs font-medium text-white transition hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hekishoku focus-visible:ring-offset-2"
                  >
                    イケベジについて
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
