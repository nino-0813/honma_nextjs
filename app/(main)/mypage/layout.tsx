import type { Metadata } from 'next';

// 会員専用ページ。検索結果に出す必要がないため noindex。
export const metadata: Metadata = {
  title: 'MY PAGE',
  robots: { index: false, follow: false },
};

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
