'use client';

import { useEffect, useState } from 'react';

export default function RiceGuideModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary px-6 text-sm text-primary transition-colors hover:bg-primary hover:text-white">
        3品種の比較表（PDF）を見る →
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="イケベジ品種比較表" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3 md:p-8" onClick={() => setOpen(false)}>
          <div className="relative h-[88vh] w-full max-w-5xl overflow-y-auto bg-[#faf8f4]" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="比較表を閉じる" onClick={() => setOpen(false)} className="sticky right-3 top-3 z-10 ml-auto mr-3 mt-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow">×</button>
            <div className="mx-auto -mt-11 max-w-[900px] px-2 pb-8 pt-2 md:px-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/docs/ikevege-rice-selection-guide.png"
                alt="従来コシヒカリ、にこまる、亀の尾の食味・特徴比較表"
                className="h-auto w-full"
              />
              <div className="mt-5 text-center">
                <a href="/docs/ikevege-rice-selection-guide.pdf" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center border-b border-primary px-2 text-sm text-primary">
                  PDFファイルを開く ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
