import Image from 'next/image';
import TokiCharacter from './TokiCharacter';

/** トップページのピックアップビジュアル。 */
export default function BrandAbout() {
  return (
    <section id="ikevege-message" className="relative overflow-hidden bg-white px-3 py-10 md:px-8 md:py-16">
      <TokiCharacter character="side" motion="peek" className="right-[-30px] top-4 h-24 w-24 md:right-6 md:top-8 md:h-32 md:w-32" />
      <h2 className="sr-only">ピックアップ：イケベジのお米ギフトセット</h2>
      <div className="mx-auto max-w-[1180px] overflow-hidden">
        <Image
          src="/images/renewal/pickup-gift-set.webp"
          alt="大切な人へ贈る、イケベジのお米ギフトセット"
          width={1536}
          height={1024}
          sizes="(min-width: 1240px) 1180px, 100vw"
          className="h-auto w-full object-contain"
        />
      </div>
    </section>
  );
}
