'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-28 pb-24 min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 md:px-12 text-center">
        <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-6">ご注文ありがとうございます</h1>
        <div className="w-12 h-px bg-primary mx-auto mb-8" />
        <p className="text-gray-600 mb-8">
          ご注文が完了しました。確認メールをお送りしていますのでご確認ください。
        </p>
        <Link
          href="/collections"
          className="inline-block border border-primary text-primary px-6 py-3 text-sm tracking-widest hover:bg-primary hover:text-white transition-colors"
        >
          買い物を続ける
        </Link>
      </div>
    </div>
  );
}
