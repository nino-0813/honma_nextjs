# Vercelデプロイチェックリスト

このドキュメントは、VercelでIKEVEGEサイトをデプロイする際のチェックリストです。

## ✅ デプロイ前のチェック

### 1. GitHubリポジトリ
- [x] コードがGitHubにプッシュされている
- [x] リポジトリ: `nino-0813/honma_ec`
- [x] ブランチ: `main`

### 2. ビルド設定の確認
- [x] `package.json` に `build` スクリプトがある
- [x] `vercel.json` が正しく設定されている
- [x] Framework: **Vite** が選択されている
- [x] Output Directory: `dist`

### 3. 環境変数の設定（必須）

Vercelダッシュボードの **Settings > Environment Variables** で以下を設定：

#### Supabase設定
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Stripe設定
```
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 4. 環境変数の設定（オプション - メール送信機能用）

メール送信機能を使用する場合：

```
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_email@domain.com
```

**重要:** 
- `RESEND_API_KEY` と `RESEND_FROM_EMAIL` は **`VITE_` プレフィックスなし**で設定
- これらはVercel Serverless Functionで使用されます

### 5. Supabaseの設定確認

#### データベース
- [ ] `supabase_schema.sql` が実行されている
- [ ] すべてのテーブルが作成されている
- [ ] RLSポリシーが設定されている
- [ ] 管理者ユーザーの `is_admin` フラグが `true` に設定されている

#### Storage
- [ ] `product-images` バケットが作成されている（Public設定）
- [ ] `site-images` バケットが作成されている（Public設定）
- [ ] バケットのポリシーで認証済みユーザーによるアップロードが許可されている

### 6. Vercel Serverless Functionの確認

- [ ] `api/send-email.ts` がリポジトリに含まれている
- [ ] `vercel.json` で `/api` ルートが設定されている
- [ ] `RESEND_API_KEY` と `RESEND_FROM_EMAIL` が環境変数に設定されている（メール送信機能を使用する場合）

## 🚀 デプロイ手順

### ステップ1: Vercelでプロジェクトをインポート

1. Vercelダッシュボードにログイン
2. "Add New..." > "Project" をクリック
3. GitHubリポジトリ `nino-0813/honma_ec` を選択
4. Framework Preset: **Vite** を選択
5. Root Directory: `.` (デフォルト)
6. Build Command: `npm run build` (自動検出)
7. Output Directory: `dist` (自動検出)

### ステップ2: 環境変数を設定

1. プロジェクト設定画面で "Environment Variables" をクリック
2. 上記の環境変数を追加
3. 各環境変数に対して適用範囲を選択：
   - Production（本番環境）
   - Preview（プレビュー環境）
   - Development（開発環境）
4. "Save" をクリック

### ステップ3: デプロイ

1. "Deploy" をクリック
2. ビルドログを確認してエラーがないか確認
3. デプロイが完了したら、提供されたURLでアクセス

### ステップ4: 動作確認

#### フロントエンド
- [ ] トップページが表示される
- [ ] 商品一覧が表示される
- [ ] 商品詳細ページが表示される
- [ ] カート機能が動作する
- [ ] ログイン機能が動作する
- [ ] 決済ページが表示される

#### 管理画面
- [ ] `/admin` にアクセスできる
- [ ] 管理者ログインが動作する
- [ ] ダッシュボードが表示される
- [ ] 商品管理が動作する
- [ ] 注文管理が動作する
- [ ] 顧客管理が動作する

#### API
- [ ] メール送信機能が動作する（設定した場合）
- [ ] Vercel Functions タブでエラーがないか確認

## ⚠️ よくある問題と解決方法

### 問題1: ビルドエラー

**原因:** 環境変数が設定されていない、またはTypeScriptエラー

**解決方法:**
1. Vercelダッシュボードで環境変数を確認
2. ビルドログを確認してエラーを特定
3. ローカルで `npm run build` を実行してエラーを確認

### 問題2: 管理画面にアクセスできない

**原因:** 管理者権限が設定されていない

**解決方法:**
1. SupabaseのSQL Editorで以下を実行：
```sql
UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';
```

### 問題3: 画像が表示されない

**原因:** Supabase Storageのバケットが作成されていない、またはポリシーが設定されていない

**解決方法:**
1. SupabaseダッシュボードでStorageバケットを確認
2. バケットがPublic設定になっているか確認
3. ポリシーで読み取り権限が設定されているか確認

### 問題4: メール送信が失敗する

**原因:** Resend APIキーが設定されていない、またはドメインが検証されていない

**解決方法:**
1. Vercelの環境変数で `RESEND_API_KEY` と `RESEND_FROM_EMAIL` を確認
2. Resendダッシュボードでドメインが検証されているか確認
3. Vercel Functions タブでエラーログを確認

### 問題5: Stripe決済が動作しない

**原因:** Stripe公開キーが設定されていない、または本番キーが必要

**解決方法:**
1. Vercelの環境変数で `VITE_STRIPE_PUBLISHABLE_KEY` を確認
2. 本番環境では本番用のStripeキーを使用
3. StripeダッシュボードでWebhookが設定されているか確認（必要に応じて）

## 📝 デプロイ後の確認事項

- [ ] サイトが正常に表示される
- [ ] すべてのページがアクセス可能
- [ ] 管理画面が動作する
- [ ] 決済機能が動作する（テストモード）
- [ ] メール送信機能が動作する（設定した場合）
- [ ] カスタムドメインが設定されている（必要に応じて）
- [ ] SSL証明書が有効になっている

## 🔄 再デプロイ

環境変数を変更した場合は、必ず再デプロイを実行してください：

1. Vercelダッシュボードでプロジェクトを選択
2. "Deployments" タブを開く
3. 最新のデプロイの "..." メニューから "Redeploy" を選択

## 📚 参考資料

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Stripe公式ドキュメント](https://stripe.com/docs)
- [Resend公式ドキュメント](https://resend.com/docs)

詳細な環境変数の設定方法は `ENV_VARIABLES.md` を参照してください。

