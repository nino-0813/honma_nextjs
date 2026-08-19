import type { Metadata } from 'next';

// 購入手続きページ。検索結果に出す必要がないため noindex。
export const metadata: Metadata = {
  title: 'CHECKOUT',
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
