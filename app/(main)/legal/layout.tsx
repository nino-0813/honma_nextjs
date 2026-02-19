import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記',
  description: 'IKEVEGE（イケベジ）の特定商取引法に基づく表記です。',
  alternates: { canonical: '/legal' },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
