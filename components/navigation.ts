/**
 * ヘッダー・ドロワー共通のナビゲーション定義。
 *
 * 要件定義（2026-08-26 §6）に従い、アルファベット表記をやめて日本語に統一。
 * 表示順もそのまま「商品一覧 / スタートセット / ブランドについて / 定期便について」。
 */

export type NavItem = {
  label: string;
  href: string;
  /** アクティブ判定に使う。前方一致させたい場合に指定 */
  matchPrefix?: string;
  /** ?view=lp のようにクエリまで一致させたい場合 */
  matchQuery?: { key: string; value: string };
  /** ページが未作成であることを示す（たたき中の目印） */
  isDraft?: boolean;
};

/** ヘッダーに横並びで出す主要項目 */
export const PRIMARY_NAV: NavItem[] = [
  { label: '商品一覧', href: '/collections', matchPrefix: '/collections' },
  { label: 'スタートセット', href: '/start-set', isDraft: true },
  { label: 'ブランドについて', href: '/about' },
  {
    label: '定期便について',
    href: '/collections/rice/yearly?view=lp',
    matchQuery: { key: 'view', value: 'lp' },
  },
];

/** ハンバーガーの中だけに置く項目 */
export const SECONDARY_NAV: NavItem[] = [
  { label: 'ブログ', href: '/blog' },
  { label: '取り組み', href: '/join-us' },
  { label: 'よくあるご質問', href: '/faq' },
  { label: 'お問い合わせ', href: '/contact' },
];

/** ハンバーガー内の商品カテゴリ（アコーディオン） */
export const CATEGORY_NAV = {
  label: '商品一覧',
  href: '/collections',
  children: [
    { label: 'すべての商品', href: '/collections' },
    { label: 'お米', href: '/collections/rice' },
    { label: 'コシヒカリ', href: '/collections/rice/koshihikari', indent: true },
    { label: '亀の尾', href: '/collections/rice/kamenoo', indent: true },
    { label: 'にこまる', href: '/collections/rice/nikomaru', indent: true },
    { label: '原木椎茸', href: '/collections/other' },
    { label: 'Crescentmoon', href: '/collections/crescent' },
    { label: 'その他', href: '/collections/other' },
  ],
};
