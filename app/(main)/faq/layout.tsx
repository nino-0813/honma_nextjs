import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'よくあるご質問。配送・商品についての回答です。',
  alternates: { canonical: '/faq' },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
