'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * スクロールで画面に入ったら現れるラッパー。
 *
 * - 軽量なIntersectionObserverでフェード + 上方向への移動
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 動きを減らす設定では、初期位置を変えずそのまま表示する。
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal transform-gpu transition-[opacity,transform] duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
