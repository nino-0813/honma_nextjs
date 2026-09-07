import Image from 'next/image';
import TokiCharacter from './TokiCharacter';

/** 商品と活動を紹介する「もっと知る」ビジュアル。 */
export default function LearnMore() {
  return (
    <section className="relative overflow-hidden bg-white py-10 md:py-16">
      <TokiCharacter character="front" className="bottom-2 left-[-24px] h-24 w-24 md:bottom-6 md:left-5 md:h-32 md:w-32" />
      <h2 className="sr-only">もっと知る</h2>
      <div className="scrollbar-hide overflow-x-auto px-3 md:px-8">
        <div className="mx-auto min-w-[780px] max-w-[1280px] md:min-w-0">
          <Image
            src="/images/renewal/learn-more-feature.webp"
            alt="イケベジのお米ギフトセット、こだわり米、食育活動レポート"
            width={1944}
            height={809}
            sizes="(min-width: 1340px) 1280px, (min-width: 768px) 100vw, 780px"
            className="h-auto w-full object-contain"
          />
        </div>
      </div>
    </section>
  );
}
