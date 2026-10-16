'use client';

import { useEffect, useRef } from 'react';

const chapters = [
  ['sado', '佐渡について'],
  ['ikevege', 'イケベジについて'],
  ['seisan', '生産について'],
  ['taiken', '体験について'],
  ['torikumi', '取り組みについて'],
] as const;

export default function AboutEditorial() {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = contentRef.current;
    if (!host) return;
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    const controller = new AbortController();

    fetch('/about-editorial/content.html', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Editorial content could not be loaded.');
        return response.text();
      })
      .then((content) => {
        shadow.innerHTML = content;
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        shadow.innerHTML = '<p>コンテンツを読み込めませんでした。</p>';
      });

    return () => controller.abort();
  }, []);

  const scrollToChapter = (id: string) => {
    contentRef.current?.shadowRoot?.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="about-editorial-preserve border-t border-[#d8d8d2] bg-[#f1f1ed] px-4 py-24 md:px-6 md:py-28">
      <div className="mx-auto max-w-[1120px]">
        <div className="text-center">
          <h2 className="text-[24px] font-medium tracking-[0.2em] md:text-[30px]">イケベジを詳しく知る</h2>
          <p className="mt-5 text-[13px] font-light leading-[2.1] tracking-[0.08em] text-gray-600">
            新潟県・佐渡ヶ島の田んぼから。<br />
            イケベジが日々向き合っていることを、ここから詳しくお伝えします。
          </p>
        </div>

        <nav aria-label="章の一覧" className="mt-12 flex flex-wrap justify-center gap-x-7 gap-y-2 border-y border-[#d9d9d2] py-4 text-[11px] tracking-[0.12em] text-gray-500 md:text-xs">
          {chapters.map(([id, label]) => (
            <button key={id} type="button" onClick={() => scrollToChapter(id)} className="transition-colors hover:text-[#1c1d1d]">
              {label}
            </button>
          ))}
        </nav>

        <div ref={contentRef} className="mt-14 block w-full" />
      </div>
    </section>
  );
}
