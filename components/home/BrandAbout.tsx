import Image from 'next/image';

/** トップページのピックアップビジュアル。 */
export default function BrandAbout() {
  return (
    <section id="ikevege-message" className="bg-[#faf6ea] px-3 py-10 md:px-8 md:py-16">
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
