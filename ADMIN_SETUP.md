# 管理画面セットアップガイド

管理画面が正しく動作するための手順です。

## 1. Supabase RLS ポリシーの適用

発送方法の保存などで「RLS で拒否されました」となる場合、以下を実行してください。

1. [Supabase ダッシュボード](https://supabase.com/dashboard) にログイン
2. 対象プロジェクトを選択
3. **SQL Editor** を開く
4. `migration_fix_admin_rls.sql` の内容をコピーして貼り付け、**Run** をクリック

これにより、`product_shipping_methods` と `shipping_methods` に必要な RLS ポリシーが追加されます。

## 2. 管理者権限の設定

管理画面にログインするには、`profiles` テーブルで `is_admin = true` である必要があります。

Supabase の **SQL Editor** で以下を実行（`your@email.com` を実際のメールアドレスに置き換え）:

```sql
UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';
```

既存ユーザーが `profiles` に存在しない場合:

```sql
INSERT INTO profiles (id, email, is_admin)
SELECT id, email, true FROM auth.users WHERE email = 'your@email.com'
ON CONFLICT (id) DO UPDATE SET is_admin = true;
```

## 3. 環境変数の確認

`.env.local`（ローカル）または Vercel の環境変数（本番）に以下が正しく設定されているか確認してください。

- `VITE_SUPABASE_URL` - Supabase プロジェクトの URL
- `VITE_SUPABASE_ANON_KEY` - Supabase の **anon public** キー（`eyJ` で始まる JWT 形式）

⚠️ Stripe の `sb_publishable_` キーを誤って設定していないか確認してください。

## 4. 管理画面へのアクセス

- **ローカル**: `http://localhost:3009/admin/login`
- **本番**: `https://あなたのドメイン/admin/login`

メールアドレスとパスワードでログイン後、管理画面が利用できます。  
（旧URL `/#/admin` でアクセスした場合も自動で `/admin` にリダイレクトされます。）
