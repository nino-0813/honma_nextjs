'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * スクロールで画面に入ったら現れるラッパー。
 *
 * - GSAP ScrollTriggerでフェード + 上方向への移動
 * - 一度だけ再生し、スクロール操作を妨げない
 * - prefers-reduced-motion では即時表示
 */
export default function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  /** 連続して出すときのずらし幅（ミリ秒） */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 動きを減らす設定では、初期位置を変えずそのまま表示する。
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      gsap.set(el, { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.48,
          delay: delay / 1000,
          ease: 'power3.out',
          overwrite: 'auto',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        }
      );
    }, el);

    return () => context.revert();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
