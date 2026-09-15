const VIDEO = '/videos/hero.mp4';

export default function HeroStory() {
  return (
    <section className="bg-white px-4 pb-10 pt-4 md:px-8 md:pb-16 md:pt-8">
      <div className="mx-auto w-full max-w-[1600px] overflow-hidden bg-black">
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
