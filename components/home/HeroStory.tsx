const VIDEO = '/videos/hero.mp4';

export default function HeroStory() {
  return (
    <section className="bg-white px-4 pb-14 pt-[calc(64px+4vw)] md:px-8 md:pb-20 md:pt-[calc(80px+5vw)]">
      <div className="mx-auto w-[92%] max-w-[1440px] overflow-hidden bg-black md:w-[90%]">
        <video
          src={VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="aspect-video h-auto w-full object-cover"
        />
      </div>
    </section>
  );
}
