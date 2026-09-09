'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

const VIDEO = '/videos/hero.mp4';
const POSTER = '/images/home/parallax/sunset_riceplanting_7_1200.webp';

export default function HeroStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage || window.matchMedia('(max-width: 1023px)').matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const distance = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / distance));
      stage.style.setProperty('--story-progress', String(progress));
      const ranges = [[0.1, 0.42], [0.38, 0.72], [0.68, 1.01]];
      stage.querySelectorAll<HTMLElement>('[data-story-step]').forEach((item, index) => {
        const [start, end] = ranges[index];
        const fadeIn = Math.min(1, Math.max(0, (progress - start) / 0.08));
        const fadeOut = index === 2 ? 1 : Math.min(1, Math.max(0, (end - progress) / 0.08));
        const opacity = fadeIn * fadeOut;
        item.style.opacity = String(opacity);
        item.style.transform = `translateY(calc(-50% + ${(1 - fadeIn) * 56}px))`;
        item.style.pointerEvents = opacity > 0.6 ? 'auto' : 'none';
      });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-white lg:h-[320vh]">
      <div ref={stageRef} className="mx-auto max-w-[1440px] px-5 pb-20 pt-6 md:px-12 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-hidden lg:py-8" style={{ '--story-progress': 0 } as React.CSSProperties}>
        <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-[20px] bg-gray-200 lg:absolute lg:left-[4%] lg:top-1/2 lg:w-[calc(92%-var(--story-progress)*42%)] lg:-translate-y-1/2 lg:rounded-[calc(24px-var(--story-progress)*10px)]">
          <video src={VIDEO} poster={POSTER} autoPlay muted loop playsInline preload="auto" className="h-full w-full object-cover" />
        </div>

        <div className="mt-14 space-y-20 lg:absolute lg:right-[4%] lg:top-1/2 lg:mt-0 lg:w-[39%] lg:-translate-y-1/2">
          <div data-story-step className="transition-opacity duration-200 lg:absolute lg:inset-x-0 lg:top-1/2 lg:-translate-y-1/2 lg:opacity-0 motion-reduce:transition-none">
            <h1 className="font-serif text-[48px] font-semibold leading-[1.45] tracking-[0.08em] text-primary md:text-[68px] lg:text-[60px]">あんしん、<br />おいしい、<br />いいとき。</h1>
          </div>
          <div data-story-step className="space-y-8 text-base leading-[2.15] text-gray-700 transition-opacity duration-200 lg:absolute lg:inset-x-0 lg:top-1/2 lg:-translate-y-1/2 lg:opacity-0 motion-reduce:transition-none">
            <p>ヒトと自然が共生していく道を選んだこの島には<br />絶滅危惧種のトキと共生するために<br />島の全ての農家がその取り組みに関わってきた歴史があります。</p>
            <p>そのバトンを受け取りイケベジは始まりました。</p>
          </div>
          <div data-story-step className="space-y-8 text-base leading-[2.15] text-gray-700 transition-opacity duration-200 lg:absolute lg:inset-x-0 lg:top-1/2 lg:-translate-y-1/2 lg:opacity-0 motion-reduce:transition-none">
            <p>自然のチカラに寄り添ってつくった食べものが<br />みんなの活力になり、なんてことのない日常でも<br />格別な時間（とき）に感じられますように。</p>
            <p className="font-serif text-xl font-semibold tracking-[0.12em] text-primary">「きょうも しぜんと いいときを。」</p>
            <Link href="/about" className="inline-flex min-h-12 items-center rounded-full border border-gray-300 px-6 text-sm text-primary transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">詳しく知る →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
