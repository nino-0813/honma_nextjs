import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'アンバサダー',
  description: 'イケベジのアンバサダー制度のご案内です。',
  alternates: { canonical: '/products/ambassador' },
};

export default function AmbassadorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
