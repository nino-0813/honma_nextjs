import React from 'react';

interface PageMetaProps {
  title?: string;
  description?: string;
  ogImage?: string;
  path?: string;
}

/**
 * Next.js App Router では layout/page の metadata を使用するため、
 * このコンポーネントは何も描画しません（Vite レガシー用のスタブ）。
 */
const PageMeta: React.FC<PageMetaProps> = () => null;

export default PageMeta;
