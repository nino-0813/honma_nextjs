import Image from 'next/image';

/** 新デザイン用の静止画ヒーロー。 */
const HeroVideo = () => {
  return (
    <section id="home-hero" className="relative h-[100svh] w-full overflow-hidden bg-white">
      <div className="relative h-full w-full overflow-hidden">
        <Image
          src="/images/renewal/hero-sado-sunset.webp"
          alt="佐渡の海に沈む夕日"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <Image
          src="/images/renewal/hero-ikevege-landscape.webp"
          alt="佐渡の田園風景とイケベジのロゴ"
          fill
          priority
          sizes="100vw"
          className="hero-opening-image object-cover object-center"
        />
      </div>
    </section>
  );
};

export default HeroVideo;
