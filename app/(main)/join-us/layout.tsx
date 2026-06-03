import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JOIN US',
  description: 'IKEVEGE（イケベジ）アンバサダー・クラウドファンディング情報です。',
  alternates: { canonical: '/join-us' },
};

export default function JoinUsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
