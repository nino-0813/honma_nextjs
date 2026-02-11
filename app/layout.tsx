import type { Metadata } from 'next';
import { SITE_NAME, DEFAULT_DESCRIPTION, getBaseUrl } from '@/lib/site';
import { jsonLdOrganization, jsonLdWebSite } from '@/lib/jsonld';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: SITE_NAME,
    images: [{ url: '/favicon.webp', width: 512, height: 512, alt: 'IKEVEGE' }],
  },
  twitter: {
    card: 'summary',
  },
  alternates: { canonical: '/' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const baseUrl = getBaseUrl();
  const orgJsonLd = jsonLdOrganization();
  const webSiteJsonLd = jsonLdWebSite();

  return (
    <html lang="ja">
      <head>
        {/* リロード時も一瞬でベーススタイルを当てる（FOUC軽減） */}
        <style
          dangerouslySetInnerHTML={{
            __html: `body{background-color:#fff;color:#1c1d1d;font-family:"Times New Roman",YuMincho,"Yu Mincho",serif;}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-white font-serif font-medium tracking-widest text-primary antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
