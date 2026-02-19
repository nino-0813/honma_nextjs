# IKEVEGE - ECサイト & 管理画面

新潟県佐渡産の自然栽培米を販売するECサイトと管理画面システムです。Vite + React + TypeScriptで構築され、バックエンドにはSupabaseを使用しています。

## 📋 プロジェクト概要

*   **フロントエンド**: 顧客向けECサイト（商品閲覧、カート、決済、Googleログイン）
*   **管理画面**: 管理者専用ダッシュボード（商品管理、注文管理、顧客管理）
*   **バックエンド**: Supabase (PostgreSQL, Auth, Storage)

## 🚀 セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の変数を設定してください。

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 3. Supabaseのセットアップ

このプロジェクトを動作させるためには、SupabaseでデータベースとStorageの構築が必要です。

#### データベース構築
Supabaseの **SQL Editor** を開き、`supabase_schema.sql` の内容をすべてコピーして実行（Run）してください。
これにより、以下のテーブルと機能が一括で作成されます。

*   `products` (商品情報: 画像配列, SKU, バリエーション設定 `variants_config` など)
*   `orders` / `order_items` (注文情報: 注文番号自動生成)
*   `profiles` (ユーザー情報: 管理者フラグ, 住所など)
*   `inquiries` (お問い合わせ)
*   `shipping_methods` / `product_shipping_methods`（発送方法・紐づけ）
*   `blog_articles`（ブログ記事）
*   各種RLSポリシー（セキュリティ設定）
*   自動更新トリガー

#### Storageバケット作成
Supabaseの **Storage** メニューで、以下の2つのバケットを **Public** 設定で作成してください。

1.  `product-images` (商品画像用)
2.  `site-images` (サイト素材用)

※ バケットのポリシー（Policies）で、認証済みユーザー（Authenticated）によるアップロード（Insert）を許可してください。

#### 既存ユーザーの同期
`supabase_schema.sql` を実行した後、既に登録済みのユーザーを `profiles` テーブルに同期する必要があります。SQL Editorで以下を実行してください。

```sql
-- 既存のユーザーを profiles テーブルに同期
INSERT INTO public.profiles (id, email)
SELECT id, email
FROM auth.users
ON CONFLICT (id) DO NOTHING;
```

#### 管理者権限の設定
管理画面にアクセスするには、管理者権限が必要です。SQL Editorで以下を実行してください（`your@email.com` を実際のメールアドレスに置き換えてください）。

```sql
-- 管理者権限を付与
UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';
```

**確認方法**: Supabaseの **Table Editor** で `profiles` テーブルを開き、該当ユーザーの `is_admin` カラムが `true` になっていることを確認してください。

### 4. 開発サーバーの起動

```bash
npm run dev
```

*   フロントエンド: `http://localhost:3009`
*   管理画面: `http://localhost:3009/admin`

## 📁 ディレクトリ構成

```
ikevege-(イケベジ)/
├── components/          # 共通コンポーネント
├── pages/              # ページコンポーネント
│   ├── admin/          # 管理画面ページ
│   │   ├── ProductEditor.tsx # 商品編集（複数画像対応）
│   │   └── ...
│   ├── Checkout.tsx    # 決済ページ（Stripe連携）
│   └── ...
├── lib/                # ライブラリ設定
│   └── supabase.ts     # Supabaseクライアント
├── supabase_schema.sql # データベース初期化用SQL（これだけ使えばOK）
└── ...
```

## ✨ 実装済み機能

### ECサイト（フロントエンド）

#### 認証・ユーザー管理
- Googleログイン / メールアドレス登録
- マイページ（ログイン/購入履歴表示）
- ユーザー情報管理（住所登録・編集）

#### 商品閲覧・検索
- 商品一覧表示（カテゴリー別・サブカテゴリー別）
- 商品詳細表示（ギャラリー表示、複数画像対応）
- バリエーション選択（サイズ、オプションなど、追加価格反映）
- 在庫状況の表示

#### カート・購入フロー
- ショッピングカート機能（localStorage永続化、OAuthリダイレクト後の復元対応）
- カート内商品の数量変更・削除
- チェックアウト画面（住所入力、配送方法選択）
- 郵便番号検索（住所の自動入力）: ZipCloud連携

#### 配送・送料計算
- 郵便番号から配送エリアを判定し、送料を自動計算（発送方法マスタに基づく）
- 配送方法の選択（全国一律 / 地域別 / サイズ別に対応）

#### 在庫管理
- バリエーション在庫（共有在庫/個別在庫）に対応
- 決済前の最終在庫チェック（バリエーション選択に基づく）
- 在庫切れ商品の表示制御

#### 決済
- Stripe PaymentIntent + Payment Element によるカード決済
- Vercel Serverless FunctionでPaymentIntent作成
- 決済完了後の注文確認

#### ブログ機能
- ブログ一覧表示（公開済み記事の一覧）
- ブログ詳細表示（JSON形式のコンテンツブロック対応）
  - 段落、見出し（h1, h2）、画像、URL埋め込みカード
  - リンク表示（黒文字＋下線）
  - 見出しの配置（左揃え、中央揃え、右揃え）
  - note風フォント適用
- おすすめ記事表示（記事詳細ページの最後に表示、スマホ2つ・デスクトップ3つ）
- モバイル対応デザイン

#### その他のページ
- ホームページ（ヒーロー動画、商品グリッド、お客様の声、お問い合わせ）
- ABOUT USページ
- JOIN USページ（Ambassador募集、クラウドファンディング情報）
- Ambassador商品詳細ページ（`/products/ambassador`）
- お問い合わせページ
- 利用規約・FAQ・特定商取引法ページ
- 準備中ページ（独自ドメイン `ikevege.com` / `www.ikevege.com` でアクセス時に表示）

### 管理画面

#### セキュリティ・認証
- Supabase Auth + `profiles.is_admin` による管理者制御
- `/admin` への Basic認証（Vercel Edge Middleware）
- 管理者ログインページ

#### ダッシュボード
- 売上統計（期間別：今日、過去7日間、過去30日間）
- 注文数・商品数・顧客数の表示
- 最新注文一覧
- 最新商品情報

#### 商品管理
- 商品の作成/編集/削除
- 画像アップロード（Supabase Storage: `product-images/products/`、複数画像対応）
- 表示/非表示（トグル）と公開状態（販売中/下書き）の連動
- CSVエクスポート / CSVインポート
- 表示順の並び替え（ドラッグ&ドロップ）
- バリエーション管理（タイプ追加/選択肢追加、追加価格）
- 在庫管理（バリエーション単位で「在庫管理しない / 在庫設定をする」＋共有在庫/個別在庫）
  - ガード: バリエーション有り商品は `products.stock` を常に0に固定
- 商品説明・仕様の編集

#### 発送方法管理（送料設定）
- 発送方法の作成/編集/削除
- 送料タイプ: 全国一律 / 地域別 / サイズ別
- サイズ別送料は「サイズ行を追加していく」UI（追加/削除、各サイズの箱入数入力）
- 発送方法 ⇄ 商品の紐づけ（中間テーブル）

#### 注文管理
- 注文一覧の表示（ステータス・支払い状況でフィルタリング）
- 注文詳細表示（注文商品、配送先、決済情報）
- 注文ステータス更新（pending / processing / shipped / delivered / cancelled）
- 支払いステータス更新（pending / paid / failed / refunded）
- CSVエクスポート機能
- （クエリ最適化）orders + order_items を1クエリで取得

#### 顧客管理
- 顧客一覧表示
- 顧客詳細情報（購入履歴、注文情報）

#### ブログ管理
- ブログ記事の作成/編集/削除
- リッチテキストエディタ機能
  - 段落、見出し（h1, h2）の作成
  - テキストの太字化
  - 見出しの配置変更（左揃え、中央揃え、右揃え）
  - 画像の挿入（Supabase Storage: `blog-images/`）
  - 画像キャプションの編集
  - リンク機能（テキスト選択してリンクを追加、キャプションにも対応）
  - URL埋め込み機能（OGP情報を取得してカード形式で表示）
- 記事の公開/非公開設定
- 公開日時の設定
- 記事一覧表示

#### クーポン・割引管理
- クーポンの作成/編集/削除
- 割引タイプ（固定額/パーセンテージ）
- 有効期限設定

#### お問い合わせ管理
- お問い合わせ一覧表示
- お問い合わせ詳細表示
- ステータス管理

#### レビュー管理
- レビュー一覧表示
- レビューの承認/非承認

#### カスタマーサポート
- サポートチケット管理

#### 分析・レポート
- 売上分析（期間別、チャネル別）
- 注文分析
- 商品分析

### 技術的な実装詳細

#### フロントエンド
- **フレームワーク**: Vite + React + TypeScript
- **ルーティング**: wouter（ハッシュルーティング）
- **スタイリング**: Tailwind CSS
- **状態管理**: React Context API（カート管理）
- **画像最適化**: FadeInImageコンポーネント（遅延読み込み）

#### バックエンド・インフラ
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **ストレージ**: Supabase Storage（商品画像、ブログ画像）
- **決済**: Stripe PaymentIntent API
- **デプロイ**: Vercel（Serverless Functions対応）

#### セキュリティ
- Row Level Security (RLS) ポリシー
- Basic認証（管理画面）
- 管理者権限チェック（`profiles.is_admin`）
- CORS対策

#### パフォーマンス最適化
- 画像の遅延読み込み
- クエリ最適化（JOIN使用）
- localStorageによるカート永続化
- レスポンシブデザイン（モバイル・タブレット・デスクトップ対応）

## ⚠️ 注意事項

*   **管理者権限**: 管理画面に入るには、`profiles` テーブルの `is_admin` カラムを `true` にする必要があります。SQLエディタで `UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';` を実行してください。
*   **Stripeテスト**: ローカル環境ではHTTPのため警告が出ますが、テスト用キーであれば動作します。
*   **Supabaseスキーマ**: `supabase_schema.sql` は統合版です（これ1本で必要なテーブル/カラム/RLSまで作成されます）。

## 🚀 Vercelへのデプロイ

### 1. GitHubにプッシュ

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/nino-0813/honma_ec.git
git push -u origin main
```

### 2. Vercelでプロジェクトをインポート

1. Vercelダッシュボードにログイン
2. "Add New..." > "Project" を選択
3. GitHubリポジトリ `nino-0813/honma_ec` を選択
4. Framework Preset: **Vite** を選択
5. Root Directory: `.` (デフォルト)
6. Build Command: `npm run build` (自動検出)
7. Output Directory: `dist` (自動検出)

### 3. 環境変数の設定

Vercelダッシュボードの **Settings > Environment Variables** で以下の環境変数を設定してください。

詳細は `ENV_VARIABLES.md` を参照してください。

**必須環境変数:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
 - `STRIPE_SECRET_KEY`（決済を使う場合）

**オプション（メール送信機能用）:**
- `RESEND_API_KEY` (Vercel Serverless Function用)
- `RESEND_FROM_EMAIL` (Vercel Serverless Function用)
 - `SEND_EMAIL_API_KEY`（`/api/send-email` を有効化する場合）

### 4. Vercel Serverless Functionの設定

`api/send-email.ts` は自動的にVercel Serverless Functionとしてデプロイされます。

**注意:** `vercel.json` で `/api` ルートが正しく設定されていることを確認してください。

### 5. デプロイの確認

1. デプロイが完了したら、Vercelが提供するURLでアクセス
2. ブラウザのコンソールでエラーがないか確認
3. 管理画面 (`/admin`) にアクセスして動作確認

## 📄 ライセンス

Private
