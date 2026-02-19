# 環境変数設定ガイド

このドキュメントでは、Vercelでデプロイする際に必要な環境変数の設定方法を説明します。

## 📋 必要な環境変数

### 必須環境変数

#### 1. Supabase設定
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**取得方法:**
1. Supabaseダッシュボードにログイン
2. プロジェクトを選択
3. Settings > API に移動
4. `Project URL` と `anon public` キーをコピー

#### 2. Stripe設定
```
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

**取得方法:**
1. Stripeダッシュボードにログイン
2. Developers > API keys に移動
3. **Publishable key** をコピー（テスト環境または本番環境）→ `VITE_STRIPE_PUBLISHABLE_KEY` に設定
4. **Secret key** をコピー（テスト環境または本番環境）→ `STRIPE_SECRET_KEY` に設定

**重要:**
- `VITE_STRIPE_PUBLISHABLE_KEY` はクライアント側で使用（`VITE_` プレフィックス付き）
- `STRIPE_SECRET_KEY` はサーバー側（Vercel Serverless Function）でのみ使用（`VITE_` プレフィックスなし）
- `STRIPE_WEBHOOK_SECRET` はサーバー側（Webhook署名検証）でのみ使用（`VITE_` プレフィックスなし）
- Secret keyは絶対にクライアント側に公開しないでください

**Webhook Secret 取得方法（必須）:**
1. Stripe Dashboard > Developers > Webhooks
2. エンドポイントを作成（URL: `/api/stripe-webhook`）
3. `Signing secret` をコピーして `STRIPE_WEBHOOK_SECRET` に設定

#### 2-1. Supabase（サーバー側 / Webhook用）
Webhookで **注文の確定（paid）** と **在庫の確定減算** を行うため、サーバー側でSupabaseへ書き込みできるキーが必要です。

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**重要:**
- `SUPABASE_SERVICE_ROLE_KEY` は **絶対にクライアントへ公開しないでください**（`VITE_` を付けない）
- VercelのEnvironment Variablesにのみ設定してください

#### 3. 管理画面 Basic認証（Vercel Edge Middleware用）
```
ADMIN_BASIC_AUTH_USER=your_admin_username
ADMIN_BASIC_AUTH_PASS=your_admin_password
```

**設定方法（詳細）:**

#### 方法①: 1つずつ追加する（推奨）

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. **Settings** > **Environment Variables** に移動
4. **1つ目の環境変数を追加：**
   - **Key**: `ADMIN_BASIC_AUTH_USER`
   - **Value**: 管理画面のユーザー名（例: `naco_ikevege`）
   - **Environment**: **Production** を選択
   - **「追加」または「保存」ボタンをクリック**（重要！）
5. **2つ目の環境変数を追加：**
   - **Key**: `ADMIN_BASIC_AUTH_PASS`
   - **Value**: 管理画面のパスワード（例: `phRMyqQPBmTK6`）
   - **Environment**: **Production** を選択
   - **「追加」または「保存」ボタンをクリック**（重要！）

**重要**: 各環境変数を追加した後、**必ず「保存」ボタンをクリック**してください。複数の環境変数を一度に追加しようとすると、エラーが発生することがあります。

#### 方法②: .envファイルをインポートする

1. 以下の内容をテキストエディタにコピー：
   ```
   ADMIN_BASIC_AUTH_USER=naco_ikevege
   ADMIN_BASIC_AUTH_PASS=phRMyqQPBmTK6
   ```
2. Vercelダッシュボードの **Settings** > **Environment Variables** に移動
3. **「.env をインポートする」ボタンをクリック**
4. 上記の内容を貼り付け
5. **Environment** で **Production** を選択
6. **「保存」ボタンをクリック**

7. **重要**: 環境変数を追加・変更した後は、**必ず再デプロイが必要**です
   - Deployments タブから最新のデプロイメントを **Redeploy** するか
   - GitHubにプッシュして自動デプロイを待つ

**重要事項:**
- `VITE_` プレフィックスを付けないでください（サーバーサイドでのみ使用）
- 本番環境でのみ設定することを推奨（開発環境では設定しないと認証がスキップされます）
- パスワードは強力なものを設定してください（英数字・記号を含む8文字以上推奨）

### オプション環境変数（メール送信機能用）

#### 4. Resend API設定（Vercel Serverless Function用）
```
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_email@domain.com
SEND_EMAIL_API_KEY=your_internal_api_key
```

**取得方法:**
1. Resendアカウントを作成（https://resend.com）
2. API Keys セクションでAPIキーを作成
3. Domains セクションでドメインを検証（またはデフォルトの `onboarding@resend.dev` を使用）

**注意:** Vercel Serverless Functionでは `RESEND_API_KEY` と `RESEND_FROM_EMAIL` を使用します（`VITE_` プレフィックスなし）。

#### 4-1. send-email の保護（推奨）
`api/send-email.ts` は **外部から叩かれると悪用される**可能性があるため、APIキー必須にしています。

- **環境変数**: `SEND_EMAIL_API_KEY`
- **リクエストヘッダー**: `X-API-Key: <SEND_EMAIL_API_KEY>`

`SEND_EMAIL_API_KEY` が未設定の場合、`/api/send-email` は **常に403で無効化**されます。

## 🔧 Vercelでの環境変数設定方法

### 1. Vercelダッシュボードから設定

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. Settings > Environment Variables に移動
4. 以下の環境変数を追加：

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
ADMIN_BASIC_AUTH_USER (推奨: 本番環境のみ)
ADMIN_BASIC_AUTH_PASS (推奨: 本番環境のみ)
RESEND_API_KEY (オプション)
RESEND_FROM_EMAIL (オプション)
```

5. 各環境（Production, Preview, Development）に適用するか選択
6. Save をクリック

### 2. 環境変数の適用範囲

- **Production**: 本番環境（https://your-domain.vercel.app）
- **Preview**: プルリクエストやブランチのプレビュー
- **Development**: ローカル開発環境（`vercel dev` コマンド使用時）

**推奨:** すべての環境に同じ値を設定するか、テスト用と本番用で分ける場合は Production と Preview/Development で異なる値を設定できます。

## ⚠️ 重要な注意事項

1. **セキュリティ**: 
   - `VITE_` プレフィックス付きの環境変数はクライアント側に公開されます
   - 機密情報（Secret Keys）は `VITE_` プレフィックスを付けないでください
   - Stripe Secret Keyは `STRIPE_SECRET_KEY` として設定（`VITE_` なし）
   - Basic認証のユーザー名・パスワードは `ADMIN_BASIC_AUTH_USER` と `ADMIN_BASIC_AUTH_PASS` として設定（`VITE_` なし）
   - Resend APIキーは `RESEND_API_KEY` として設定（`VITE_` なし）

2. **環境変数の再デプロイ**:
   - 環境変数を追加・変更した後は、**再デプロイが必要**です
   - Vercelダッシュボードから「Redeploy」を実行してください

3. **ローカル開発**:
   - `.env.local` ファイルに環境変数を設定
   - `.env.local` は `.gitignore` に含まれているため、GitHubにコミットされません

## 🔍 環境変数の確認方法

デプロイ後、以下の方法で環境変数が正しく設定されているか確認できます：

1. **ブラウザのコンソール**:
   ```javascript
   console.log(import.meta.env.VITE_SUPABASE_URL);
   ```

2. **Vercelダッシュボード**:
   - Settings > Environment Variables で設定済みの変数を確認

3. **ログ確認**:
   - Vercelダッシュボードの Functions タブでエラーログを確認

## 📝 環境変数チェックリスト

デプロイ前に以下を確認してください：

- [ ] `VITE_SUPABASE_URL` が設定されている
- [ ] `VITE_SUPABASE_ANON_KEY` が設定されている
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` が設定されている
- [ ] `STRIPE_SECRET_KEY` が設定されている（決済機能を使用する場合）
- [ ] 本番環境で管理画面を保護する場合、`ADMIN_BASIC_AUTH_USER` と `ADMIN_BASIC_AUTH_PASS` が設定されている
- [ ] メール送信機能を使用する場合、`RESEND_API_KEY` と `RESEND_FROM_EMAIL` が設定されている
- [ ] すべての環境変数が正しい環境（Production/Preview/Development）に適用されている
- [ ] 環境変数設定後に再デプロイを実行した

