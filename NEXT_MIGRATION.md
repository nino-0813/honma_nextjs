# Next.js App Router への移行メモ（SEO・JSON-LD 対応）

このプロジェクトは **Next.js 14 App Router** で動作するように移行されています。**Git にはプッシュせず、ローカルのみで利用する想定**です。

## 起動方法

```bash
npm install
npm run dev
```

- 開発: `http://localhost:3000`
- ビルド: `npm run build` / 本番: `npm run start`

## 主な変更点

- **フレームワーク**: Vite + react-router → **Next.js 14 App Router**（SSR/ISR）
- **SEO**: 各ページで `metadata` を export。canonical・OG を設定。
- **JSON-LD**: ルートで Organization・WebSite、商品詳細で Product を出力。
- **ルート**: `app/(main)/` 以下にページを配置。旧 Vite 用は `pages_vite_legacy/` に退避。

## 環境変数（Next.js）

`.env.local` に以下を設定してください（既存の VITE_ も併用可）。

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`（Stripe 利用時）
- `NEXT_PUBLIC_HERO_VIDEO_URL`（任意）
- サーバー用: `STRIPE_SECRET_KEY`, `RESEND_API_KEY` 等（API ルートで使用）

## 実装済み

- **ルートレイアウト**: `app/layout.tsx`（metadata, JSON-LD Organization/WebSite, Analytics）
- **メインレイアウト**: `app/(main)/layout.tsx`（CartProvider, Header, Footer, Drawers）
- **ホーム**: `app/(main)/page.tsx`
- **ABOUT**: `app/(main)/about/page.tsx`
- **商品詳細**: `app/(main)/products/[handle]/page.tsx`（SSR/ISR, generateMetadata, JSON-LD Product）

## 未移行（必要に応じて追加）

- カテゴリ: `/collections`, `/collections/rice/:subcategory` 等
- ブログ: `/blog`, `/blog/:id`（JSON-LD Article 推奨）
- チェックアウト・マイページ・管理画面・その他静的ページ（terms, faq, contact 等）

これらは `pages_vite_legacy/` を参考に、`app/(main)/...` に同様のページを追加してください。API は `app/api/` に Route Handler として移行できます。

## JSON-LD 一覧

- **Organization** … ルートレイアウト
- **WebSite** … ルートレイアウト
- **Product** … 商品詳細ページ
- ブログ移行時は **Article** を `lib/jsonld.ts` の `jsonLdArticle` で出力可能です。
