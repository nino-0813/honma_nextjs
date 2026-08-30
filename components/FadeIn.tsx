'use client';

import { useEffect, useRef } from 'react';

/**
 * スクロールで画面に入ったら現れるラッパー。
 *
 * - フェード + 16px の上方向への移動（スタイルは globals.css の .reveal）
 * - 一度出したら監視を解除する（行き来のたびに再生しない）
 * - prefers-reduced-motion では即時表示
 * - IntersectionObserver が使えない環境でも消えたままにならないようにする
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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => el.classList.add('is-visible');

    // 動きを減らす設定、または監視APIが無い環境ではそのまま表示する
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        show();
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
