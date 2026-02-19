import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BLOG',
  description: 'IKEVEGE（イケベジ）のブログです。',
  alternates: { canonical: '/blog' },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
