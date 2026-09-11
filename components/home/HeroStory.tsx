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
    let targetProgress = 0;
    let currentProgress = 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const readProgress = () => {
      const rect = section.getBoundingClientRect();
      const distance = Math.max(1, section.offsetHeight - window.innerHeight);
      return Math.min(1, Math.max(0, -rect.top / distance));
    };

    const render = (progress: number) => {
      stage.style.setProperty('--story-progress', String(progress));
      const videoProgress = Math.min(1, progress / 0.24);
      stage.style.setProperty('--video-progress', String(videoProgress));
      const ranges = [[0.27, 0.44], [0.49, 0.69], [0.74, 1.01]];
      stage.querySelectorAll<HTMLElement>('[data-story-step]').forEach((item, index) => {
        const [start, end] = ranges[index];
        const fadeIn = Math.min(1, Math.max(0, (progress - start) / 0.06));
        const fadeOut = index === 2 ? 1 : Math.min(1, Math.max(0, (end - progress) / 0.06));
        const opacity = fadeIn * fadeOut;
        item.style.opacity = String(opacity);
        item.style.transform = `translateY(calc(-50% + ${(1 - fadeIn) * 72}px))`;
        item.style.pointerEvents = opacity > 0.6 ? 'auto' : 'none';
      });
    };

    const animate = () => {
      const difference = targetProgress - currentProgress;
      currentProgress = reduceMotion || Math.abs(difference) < 0.0001
        ? targetProgress
        : currentProgress + difference * 0.11;
      render(currentProgress);
      if (Math.abs(targetProgress - currentProgress) >= 0.0001) {
        frame = requestAnimationFrame(animate);
      } else {
        frame = 0;
      }
    };

    const onScroll = () => {
      targetProgress = readProgress();
      if (!frame) frame = requestAnimationFrame(animate);
    };
    const onResize = () => {
      targetProgress = readProgress();
      currentProgress = targetProgress;
      render(currentProgress);
    };

    targetProgress = readProgress();
    currentProgress = targetProgress;
    render(currentProgress);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-white lg:h-[320vh]">
      <div ref={stageRef} className="w-full px-5 pb-20 pt-6 md:px-10 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-hidden lg:py-8" style={{ '--story-progress': 0, '--video-progress': 0 } as React.CSSProperties}>
        <div className="relative mx-auto aspect-video w-full overflow-hidden bg-gray-200 shadow-[0_24px_70px_rgba(48,44,35,0.12)] lg:absolute lg:left-[2%] lg:top-1/2 lg:h-[calc(100%-4rem)] lg:w-[calc(96%-var(--video-progress)*46%)] lg:-translate-y-1/2 lg:aspect-auto lg:will-change-[width]">
          <video src={VIDEO} poster={POSTER} autoPlay muted loop playsInline preload="auto" className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/5" />
        </div>

        <div className="mt-14 space-y-24 lg:absolute lg:right-[4%] lg:top-1/2 lg:mt-0 lg:h-[min(72vh,620px)] lg:w-[41%] lg:-translate-y-1/2">
          <div data-story-step className="lg:absolute lg:inset-x-0 lg:top-1/2 lg:opacity-0 lg:will-change-[transform,opacity] motion-reduce:transition-none">
            <h2 className="font-serif text-[42px] font-semibold leading-[1.55] tracking-[0.08em] text-[#26231e] md:text-[56px] lg:text-[clamp(40px,3.2vw,58px)]">あんしん、<br />おいしい、<br />いいとき。</h2>
          </div>
          <div data-story-step className="lg:absolute lg:inset-x-0 lg:top-1/2 lg:opacity-0 lg:will-change-[transform,opacity] motion-reduce:transition-none">
            <div className="space-y-7 font-serif text-[16px] leading-[2.15] tracking-[0.045em] text-[#37332c] md:text-[18px]">
              <p>ヒトと自然が共生していく道を選んだこの島には、絶滅危惧種のトキと共生するために、島のすべての農家がその取り組みに関わってきた歴史があります。</p>
              <p>そのバトンを受け取り、イケベジは始まりました。</p>
            </div>
          </div>
          <div data-story-step className="lg:absolute lg:inset-x-0 lg:top-1/2 lg:opacity-0 lg:will-change-[transform,opacity] motion-reduce:transition-none">
            <div className="space-y-7 font-serif text-[16px] leading-[2.15] tracking-[0.045em] text-[#37332c] md:text-[18px]">
              <p>自然のチカラに寄り添ってつくった食べものが、みんなの活力になり、なんてことのない日常でも格別な時間（とき）に感じられますように。</p>
              <p className="text-[19px] font-semibold tracking-[0.1em] text-[#26231e] md:text-[22px]">「きょうも しぜんと いいときを。」</p>
            </div>
            <Link href="/about" className="mt-9 inline-flex min-h-12 w-fit items-center rounded-full border border-[#aaa08d] px-6 text-sm tracking-[0.08em] text-[#37332c] transition-colors hover:border-[#37332c] hover:bg-[#37332c] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">詳しく知る →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
