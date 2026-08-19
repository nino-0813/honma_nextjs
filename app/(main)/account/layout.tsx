import type { Metadata } from 'next';

// ログイン・パスワード再設定など。検索結果に出す必要がないため noindex。
export const metadata: Metadata = {
  title: 'ACCOUNT',
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
