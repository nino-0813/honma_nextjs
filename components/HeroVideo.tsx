import Image from 'next/image';

/** 新デザイン用の静止画ヒーロー。 */
const HeroVideo = () => {
  return (
    <section id="home-hero" className="relative w-full overflow-hidden bg-[#f7f2df] pb-12 md:pb-20 md:pr-[9vw]">
      <div className="relative h-[78svh] w-[94%] overflow-hidden rounded-br-[72px] md:h-[calc(100svh-64px)] md:min-h-[700px] md:max-h-[980px] md:w-full md:rounded-br-[clamp(96px,10vw,180px)]">
        <Image
          src="/images/renewal/hero-sado-sunset.webp"
          alt="佐渡の海に沈む夕日"
          fill
          priority
          sizes="(min-width: 768px) 91vw, 94vw"
          className="object-cover object-center"
        />
        <Image
          src="/images/renewal/hero-ikevege-landscape.webp"
          alt="佐渡の田園風景とイケベジのロゴ"
          fill
          priority
          sizes="(min-width: 768px) 91vw, 94vw"
          className="hero-opening-image object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-black/10" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 px-6 text-white md:bottom-32 md:px-12">
        <p className="text-[10px] font-medium uppercase tracking-[0.34em] drop-shadow md:text-xs">
          From Sado Island, Niigata
        </p>
        <h2 className="mt-4 max-w-[12em] font-serif text-3xl font-semibold leading-[1.55] tracking-[0.12em] drop-shadow-lg md:text-5xl lg:text-6xl">
          佐渡の自然を、
          <br />
          おいしさに。
        </h2>
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex h-24 w-24 rotate-6 items-center justify-center rounded-full bg-yuunagi text-center text-xs font-semibold leading-relaxed text-white shadow-lg md:bottom-10 md:right-[3vw] md:h-32 md:w-32 md:text-sm">
        あんしん、
        <br />
        おいしい、
        <br />
        いいとき。
      </div>

      <a
        href="#ikevege-message"
        className="absolute bottom-4 left-1/2 z-20 hidden min-h-11 -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white md:flex"
      >
        <span className="h-12 w-px animate-pulse bg-white" />
        Scroll
      </a>
    </section>
  );
};

export default HeroVideo;
