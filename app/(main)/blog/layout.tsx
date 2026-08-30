import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ブログ',
  description: 'IKEVEGE（イケベジ）のブログです。',
  alternates: { canonical: '/blog' },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
