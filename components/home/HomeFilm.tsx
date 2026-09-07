import FadeIn from '@/components/FadeIn';
import TokiCharacter from './TokiCharacter';

/** 参考サイト中央の横長ムービー枠を、イケベジの田んぼ動画で再構成。 */
export default function HomeFilm() {
  return (
    <section className="relative overflow-hidden bg-white px-6 py-20 md:px-12 md:py-28">
      <TokiCharacter character="fast" motion="fly" className="right-[-28px] top-6 h-24 w-24 md:right-8 md:top-10 md:h-32 md:w-32" />
      <FadeIn className="mx-auto max-w-[1040px]">
        <div className="relative aspect-video overflow-hidden rounded-[24px] bg-primary md:rounded-[36px]">
          <video
            src="/videos/hero.mp4"
            poster="/images/home/parallax/sunset_riceplanting_7_1200.webp"
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-xs font-medium tracking-[0.16em] text-gray-500">IKEVEGE / SADO ISLAND</p>
          <p className="text-xs text-gray-500">田んぼから、食卓まで。</p>
        </div>
      </FadeIn>
    </section>
  );
}
