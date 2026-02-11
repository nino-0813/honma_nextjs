# ローカル開発ガイド

このドキュメントでは、ローカル環境でStripe決済機能を含むアプリケーションを動作させる方法を説明します。

## 📋 前提条件

1. Node.jsがインストールされていること
2. Stripeアカウントを持っていること（テストモードでOK）
3. Supabaseアカウントを持っていること

## 🚀 セットアップ手順

### 1. パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# Supabase設定
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe設定（クライアント側）
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...（テスト環境のPublishable key）

# Stripe設定（サーバー側）
STRIPE_SECRET_KEY=sk_test_...（テスト環境のSecret key）
```

**重要:**
- `.env.local`ファイルは`.gitignore`に含まれているため、GitHubにコミットされません
- テスト環境のキーを使用することを推奨します（`pk_test_`と`sk_test_`で始まるキー）
- `.env.local` を追加/変更したら、開発サーバー（`npm run dev` / `vercel dev`）を **再起動**してください

補足: `ENV_LOCAL_TEMPLATE.md` にコピペ用テンプレがあります。

### 3. Vercel CLIのインストール（APIをローカルで動作させる場合）

Stripe決済のAPI（`/api/create-payment-intent`）をローカルで動作させるには、Vercel CLIが必要です：

```bash
npm install -g vercel
```

または、プロジェクトローカルにインストール：

```bash
npm install --save-dev vercel
```

### 4. ローカル開発サーバーの起動

#### 方法①: Vercel CLIを使用（推奨 - APIも動作）

```bash
# Vercel CLIがインストールされている場合
vercel dev
```

これにより、フロントエンドとAPI（`/api/create-payment-intent`）の両方が動作します。

#### 方法②: Vite開発サーバーのみ

```bash
npm run dev
```

**注意:** この方法では、API（`/api/create-payment-intent`）は動作しません。Vercelにデプロイするか、`vercel dev`を使用してください。

### 5. ブラウザで確認

1. ブラウザで `http://localhost:3009` を開く
2. 商品をカートに追加
3. チェックアウトページに移動
4. 郵便番号を入力して送料を確認
5. 決済情報を入力してテスト決済を実行

## 🧪 Stripeテストカード

ローカルでテスト決済を行う場合、以下のStripeテストカードを使用できます：

- **成功するカード**: `4242 4242 4242 4242`
- **3Dセキュア認証が必要なカード**: `4000 0025 0000 3155`
- **失敗するカード**: `4000 0000 0000 0002`

その他の情報：
- **有効期限**: 任意の未来の日付（例: `12/34`）
- **CVC**: 任意の3桁（例: `123`）
- **郵便番号**: 任意（例: `12345`）

## ⚠️ トラブルシューティング

### 問題1: `vercel dev`が動作しない

**解決方法:**
1. Vercel CLIがインストールされているか確認: `vercel --version`
2. プロジェクトルートで`vercel login`を実行してログイン
3. 初回実行時は`vercel link`でプロジェクトをリンクする必要がある場合があります

### 問題2: APIが404エラーになる

**解決方法:**
- `vercel dev`を使用していることを確認
- `.env.local`に`STRIPE_SECRET_KEY`が設定されていることを確認
- ブラウザのコンソールでエラーメッセージを確認

### 問題3: PaymentIntentが作成されない

**解決方法:**
1. `.env.local`に`STRIPE_SECRET_KEY`が正しく設定されているか確認
2. Stripeダッシュボードでテストモードのキーを使用しているか確認
3. ブラウザのコンソールとターミナルのエラーログを確認

### 問題4: 送料が計算されない

**解決方法:**
1. 商品に発送方法が紐づいているか確認（管理画面で確認）
2. 郵便番号が正しく入力されているか確認
3. ブラウザのコンソールでエラーメッセージを確認

## 📝 次のステップ

ローカルで動作確認ができたら：

1. 変更をGitHubにプッシュ
2. Vercelで自動デプロイ
3. Vercelの環境変数に`STRIPE_SECRET_KEY`を設定
4. 本番環境で動作確認


