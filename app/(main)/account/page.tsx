'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AccountPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-28 pb-24 min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 md:px-12 text-center">
        <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-6">ACCOUNT</h1>
        <div className="w-12 h-px bg-primary mx-auto mb-8" />
        <p className="text-gray-600 mb-6">
          マイページでは注文履歴の確認や会員情報の編集ができます。
        </p>
        <p className="text-sm text-gray-500 mb-8">
          ログイン・会員機能は現在、レガシー版と同等の実装に移行中のため、ご不便をおかけする場合があります。問題がある場合はお問い合わせください。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/collections"
            className="inline-block border border-primary text-primary px-6 py-3 text-sm tracking-widest hover:bg-primary hover:text-white transition-colors"
          >
            商品一覧へ
          </Link>
          <Link
            href="/contact"
            className="inline-block bg-primary text-white px-6 py-3 text-sm tracking-widest hover:bg-gray-800 transition-colors"
          >
            お問い合わせ
          </Link>
        </div>
      </div>
    </div>
  );
}
