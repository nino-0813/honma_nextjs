import type { Metadata } from 'next';
import Script from 'next/script';
import { SITE_NAME, DEFAULT_DESCRIPTION, getBaseUrl } from '@/lib/site';
import { jsonLdOrganization, jsonLdWebSite } from '@/lib/jsonld';
import RootClientEffects from '@/components/RootClientEffects';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

// GA4 測定ID（環境変数で管理）
// Vercel 環境変数に NEXT_PUBLIC_GA_MEASUREMENT_ID を設定すると有効化される
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/' },
  // Search Console の HTMLメタタグ認証用（DNS TXT/GA連携の場合は未設定でOK）
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
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
        {/* Google Analytics 4 */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        <RootClientEffects />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
