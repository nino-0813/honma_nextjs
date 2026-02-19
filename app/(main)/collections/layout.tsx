import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'COLLECTIONS',
  description: 'IKEVEGE（イケベジ）の商品一覧です。',
  alternates: { canonical: '/collections' },
};

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
