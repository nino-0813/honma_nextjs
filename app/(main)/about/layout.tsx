import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ABOUT US',
  description: '農から社会へ。自然と共に、イケベジの考え方とストーリー。',
  openGraph: { title: 'ABOUT US | イケベジ', url: '/about' },
  alternates: { canonical: '/about' },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
