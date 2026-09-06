import Link from 'next/link';
import SectionHeading from './SectionHeading';
import FadeIn from '@/components/FadeIn';

/**
 * ホームではブランドメッセージだけを簡潔に伝え、詳細は /about に集約する。
 */
export default function BrandAbout() {
  return (
    <section className="bg-white py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-8 md:px-14">
        <FadeIn>
          <SectionHeading ja="イケベジとは" />
        </FadeIn>

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-28">
          <p className="text-3xl md:text-[44px] lg:text-[52px] font-serif font-semibold leading-[1.6] tracking-wide text-primary">
            あんしん、
            <br />
            おいしい、
            <br />
            いいとき。
          </p>
          <div className="flex flex-col gap-5 text-sm md:text-base text-gray-600 leading-loose">
            <p className="whitespace-pre-line">{'イケベジは\n日々の暮らしのなかに “ ありのまま ” でいられる姿を想像し'}</p>
            <p className="whitespace-pre-line">{'「自然から学び、豊かさを分かち合うこと」を通じて\nあんしん と おいしさ から得られる\n" 時別な時間 ( とき )" を提供しつづけ'}</p>
            <p className="whitespace-pre-line">{'「イケてる社会」を創造し\n「佐渡」という唯一無二の価値を守り続けていきます'}</p>
            <Link
              href="/about"
              className="mt-3 inline-flex min-h-11 w-fit items-center gap-3 rounded-full border border-gray-300 px-6 py-3 text-xs text-primary transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hekishoku focus-visible:ring-offset-2"
            >
              イケベジについて詳しく知る
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
