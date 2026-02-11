import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約',
  description: 'IKEVEGE（イケベジ）オンラインショップの利用規約です。',
  alternates: { canonical: '/terms' },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
