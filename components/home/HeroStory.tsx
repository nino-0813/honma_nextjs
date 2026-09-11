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
      const ranges = [[0.08, 0.31], [0.36, 0.63], [0.68, 1.01]];
      stage.querySelectorAll<HTMLElement>('[data-story-step]').forEach((item, index) => {
        const [start, end] = ranges[index];
        const fadeIn = Math.min(1, Math.max(0, (progress - start) / 0.06));
        const fadeOut = index === 2 ? 1 : Math.min(1, Math.max(0, (end - progress) / 0.06));
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
    <section ref={sectionRef} className="relative bg-[#f8f7f3] lg:h-[320vh]">
      <div ref={stageRef} className="mx-auto max-w-[1440px] px-5 pb-20 pt-6 md:px-12 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-hidden lg:py-8" style={{ '--story-progress': 0 } as React.CSSProperties}>
        <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-[20px] bg-gray-200 shadow-[0_24px_70px_rgba(48,44,35,0.12)] lg:absolute lg:left-[4%] lg:top-1/2 lg:w-[calc(92%-var(--story-progress)*42%)] lg:-translate-y-1/2 lg:rounded-[calc(24px-var(--story-progress)*10px)]">
          <video src={VIDEO} poster={POSTER} autoPlay muted loop playsInline preload="auto" className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/5" />
        </div>

        <div className="mt-8 space-y-5 lg:absolute lg:right-[4%] lg:top-1/2 lg:mt-0 lg:h-[min(72vh,620px)] lg:w-[41%] lg:-translate-y-1/2">
          <div data-story-step className="relative overflow-hidden border border-[#ded8c9] bg-[#fffdf7] px-7 py-10 shadow-[0_24px_70px_rgba(48,44,35,0.16)] transition-[opacity,transform] duration-300 before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(110deg,rgba(116,92,45,0.025),transparent_38%,rgba(116,92,45,0.02))] md:px-12 md:py-14 lg:absolute lg:inset-0 lg:flex lg:flex-col lg:justify-center lg:opacity-0 motion-reduce:transition-none">
            <p className="relative mb-8 text-[11px] tracking-[0.32em] text-[#8c8069]">FROM SADO ISLAND</p>
            <h2 className="relative font-serif text-[42px] font-semibold leading-[1.55] tracking-[0.08em] text-[#26231e] md:text-[56px] lg:text-[clamp(40px,3.2vw,58px)]">あんしん、<br />おいしい、<br />いいとき。</h2>
            <span className="relative mt-10 block h-px w-16 bg-[#c7bda9]" />
          </div>
          <div data-story-step className="relative overflow-hidden border border-[#ded8c9] bg-[#fffdf7] px-7 py-10 shadow-[0_24px_70px_rgba(48,44,35,0.16)] transition-[opacity,transform] duration-300 before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(110deg,rgba(116,92,45,0.025),transparent_38%,rgba(116,92,45,0.02))] md:px-12 md:py-14 lg:absolute lg:inset-0 lg:flex lg:flex-col lg:justify-center lg:opacity-0 motion-reduce:transition-none">
            <p className="relative mb-8 text-[11px] tracking-[0.32em] text-[#8c8069]">A LETTER FROM IKEVEGE</p>
            <div className="relative space-y-7 font-serif text-[16px] leading-[2.15] tracking-[0.045em] text-[#37332c] md:text-[18px]">
              <p>ヒトと自然が共生していく道を選んだこの島には、絶滅危惧種のトキと共生するために、島のすべての農家がその取り組みに関わってきた歴史があります。</p>
              <p>そのバトンを受け取り、イケベジは始まりました。</p>
            </div>
          </div>
          <div data-story-step className="relative overflow-hidden border border-[#ded8c9] bg-[#fffdf7] px-7 py-10 shadow-[0_24px_70px_rgba(48,44,35,0.16)] transition-[opacity,transform] duration-300 before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(110deg,rgba(116,92,45,0.025),transparent_38%,rgba(116,92,45,0.02))] md:px-12 md:py-14 lg:absolute lg:inset-0 lg:flex lg:flex-col lg:justify-center lg:opacity-0 motion-reduce:transition-none">
            <p className="relative mb-8 text-[11px] tracking-[0.32em] text-[#8c8069]">OUR WISH</p>
            <div className="relative space-y-7 font-serif text-[16px] leading-[2.15] tracking-[0.045em] text-[#37332c] md:text-[18px]">
              <p>自然のチカラに寄り添ってつくった食べものが、みんなの活力になり、なんてことのない日常でも格別な時間（とき）に感じられますように。</p>
              <p className="text-[19px] font-semibold tracking-[0.1em] text-[#26231e] md:text-[22px]">「きょうも しぜんと いいときを。」</p>
            </div>
            <Link href="/about" className="relative mt-9 inline-flex min-h-12 w-fit items-center rounded-full border border-[#aaa08d] px-6 text-sm tracking-[0.08em] text-[#37332c] transition-colors hover:border-[#37332c] hover:bg-[#37332c] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">詳しく知る →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
