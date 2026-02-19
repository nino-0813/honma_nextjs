# Supabase 最終チェックリスト

このドキュメントは、IKEVEGE ECサイトが正常に動作するために、Supabaseで**絶対に設定しておく必要がある**項目の最終チェックリストです。

## ⚠️ 重要: このチェックリストを順番に確認してください

---

## 📊 1. データベーススキーマ（必須）

### 1.1 SQLスキーマの実行

- [ ] **Supabaseダッシュボード > SQL Editor** を開く
- [ ] `supabase_schema.sql` の内容を**すべてコピー**して実行（Run）
- [ ] エラーが発生していないか確認
- [ ] 実行結果に「Success. No rows returned」または類似のメッセージが表示されている

**確認方法:**
```sql
-- テーブルが作成されているか確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('products', 'orders', 'order_items', 'profiles', 'inquiries', 'reviews', 'email_logs');
```

**期待される結果:** 7つのテーブルが表示される

---

### 1.2 テーブルの存在確認

#### products テーブル
- [ ] テーブルが存在する
- [ ] 以下のカラムが存在する：
  - `id` (uuid, primary key)
  - `title` (text)
  - `price` (numeric)
  - `image` (text, nullable)
  - `images` (text[], nullable) - **複数画像対応**
  - `sold_out` (boolean)
  - `handle` (text, unique)
  - `category` (text)
  - `subcategory` (text, nullable)
  - `description` (text, nullable)
  - `has_variants` (boolean) - **種類選択対応**
  - `variants` (text[], nullable) - **種類選択対応**
  - `stock` (integer)
  - `sku` (text, nullable)
  - `is_active` (boolean)
  - `status` (text)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

**確認SQL:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
```

#### orders テーブル
- [ ] テーブルが存在する
- [ ] 以下のカラムが存在する：
  - `id` (uuid, primary key)
  - `order_number` (text, nullable) - **自動生成**
  - `total_amount` (numeric)
  - `payment_status` (text)
  - `payment_session_id` (text, nullable)
  - `auth_user_id` (uuid, nullable) - **ユーザー紐付け**
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

**確認SQL:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders';
```

#### order_items テーブル
- [ ] テーブルが存在する
- [ ] `order_id` に外部キー制約が設定されている
- [ ] `ON DELETE CASCADE` が設定されている

**確認SQL:**
```sql
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'order_items' 
AND tc.constraint_type = 'FOREIGN KEY';
```

**期待される結果:** `order_id` が `orders.id` を参照し、`delete_rule` が `CASCADE` になっている

#### profiles テーブル
- [ ] テーブルが存在する
- [ ] `is_admin` (boolean) カラムが存在する
- [ ] `id` が `auth.users.id` と一致する

**確認SQL:**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'is_admin';
```

**期待される結果:** `is_admin` カラムが存在し、デフォルト値が `false`

---

### 1.3 RLS（Row Level Security）ポリシーの確認

#### products テーブル
- [ ] RLSが有効になっている
- [ ] 全ユーザーが読み取り可能（SELECT）
- [ ] 管理者のみが書き込み可能（INSERT, UPDATE, DELETE）

**確認SQL:**
```sql
-- RLSが有効か確認
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'products';

-- ポリシーを確認
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'products';
```

**期待される結果:**
- `rowsecurity` が `true`
- 読み取り用のポリシーが存在
- 管理者用の書き込みポリシーが存在

#### orders テーブル
- [ ] RLSが有効になっている
- [ ] ユーザーは自分の注文のみ閲覧可能
- [ ] 管理者はすべての注文を閲覧可能

**確認SQL:**
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'orders';
```

#### profiles テーブル
- [ ] RLSが有効になっている
- [ ] ユーザーは自分のプロフィールのみ閲覧・編集可能
- [ ] 管理者はすべてのプロフィールを閲覧可能

**確認SQL:**
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';
```

---

### 1.4 トリガーと関数の確認

#### 自動更新トリガー（updated_at）
- [ ] `products` テーブルに `update_updated_at_column()` トリガーが設定されている
- [ ] `orders` テーブルに `update_updated_at_column()` トリガーが設定されている

**確認SQL:**
```sql
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('products', 'orders');
```

#### 注文番号自動生成トリガー
- [ ] `generate_order_number()` 関数が存在する
- [ ] `set_order_number` トリガーが `orders` テーブルに設定されている

**確認SQL:**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'generate_order_number';

SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'set_order_number';
```

#### 管理者チェック関数
- [ ] `is_admin()` 関数が存在する
- [ ] `SECURITY DEFINER` が設定されている

**確認SQL:**
```sql
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin';
```

**期待される結果:** `security_type` が `DEFINER`

---

## 🗄️ 2. Storage（ストレージ）設定（必須）

### 2.1 バケットの作成

#### product-images バケット
- [ ] バケットが作成されている
- [ ] **Public** 設定になっている
- [ ] バケット名が正確に `product-images` である

**確認方法:**
1. Supabaseダッシュボード > Storage
2. `product-images` バケットが存在するか確認
3. バケットをクリックして設定を確認
4. "Public bucket" が有効になっているか確認

#### site-images バケット
- [ ] バケットが作成されている
- [ ] **Public** 設定になっている
- [ ] バケット名が正確に `site-images` である

**確認方法:**
1. Supabaseダッシュボード > Storage
2. `site-images` バケットが存在するか確認
3. バケットをクリックして設定を確認
4. "Public bucket" が有効になっているか確認

---

### 2.2 Storageポリシーの設定

#### product-images バケットのポリシー

**読み取り（SELECT）:**
- [ ] 全ユーザー（Public）が読み取り可能なポリシーが設定されている

**確認SQL:**
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%product-images%';
```

**アップロード（INSERT）:**
- [ ] 認証済みユーザー（Authenticated）がアップロード可能なポリシーが設定されている

**削除（DELETE）:**
- [ ] 認証済みユーザー（Authenticated）が削除可能なポリシーが設定されている

**手動設定方法（Supabaseダッシュボード）:**
1. Storage > `product-images` を選択
2. "Policies" タブを開く
3. "New Policy" をクリック
4. 以下のポリシーを作成：

**読み取りポリシー:**
- Policy name: `Public read access`
- Allowed operation: `SELECT`
- Policy definition: `true` (すべてのユーザーが読み取り可能)

**アップロードポリシー:**
- Policy name: `Authenticated upload`
- Allowed operation: `INSERT`
- Policy definition: `auth.role() = 'authenticated'` (認証済みユーザーのみ)

**削除ポリシー:**
- Policy name: `Authenticated delete`
- Allowed operation: `DELETE`
- Policy definition: `auth.role() = 'authenticated'` (認証済みユーザーのみ)

#### site-images バケットのポリシー
- [ ] 同様のポリシーが設定されている（読み取り、アップロード、削除）

---

## 🔐 3. Authentication（認証）設定（必須）

### 3.1 メール認証

- [ ] **Authentication > Providers > Email** が有効になっている
- [ ] **"Confirm email" を無効にする**（メール認証なしで即座にログイン状態にするため）

**設定方法:**

1. Supabaseダッシュボード > Authentication > Providers
2. "Email" を選択
3. "Enable Email provider" が有効になっているか確認
4. **"Confirm email" のチェックを外す**（重要：これにより、新規登録時に確認メールを送らず、即座にログイン状態になります）

**注意:** メール認証を無効にすると、`email_confirmed = false` の状態でもログイン可能になります。

---

### 3.2 Google OAuth設定

#### Supabase側の設定
- [ ] **Authentication > Providers > Google** が有効になっている
- [ ] Client ID (for OAuth) が入力されている
- [ ] Client Secret (for OAuth) が入力されている

**確認方法:**
1. Supabaseダッシュボード > Authentication > Providers
2. "Google" を選択
3. "Enable Google provider" が有効になっているか確認
4. Client ID と Client Secret が入力されているか確認

#### Google Cloud Console側の設定
- [ ] OAuth 2.0 クライアントIDが作成されている
- [ ] **承認済みのリダイレクトURI** に以下が追加されている：
  ```
  https://[your-project-ref].supabase.co/auth/v1/callback
  ```
- [ ] プロジェクト参照IDが正確に入力されている

**確認方法:**
1. Google Cloud Console > APIとサービス > 認証情報
2. OAuth 2.0 クライアントIDを選択
3. "承認済みのリダイレクトURI" を確認

**重要:** `[your-project-ref]` はSupabaseのプロジェクト参照IDです。Settings > API で確認できます。

---

### 3.3 リダイレクトURL設定

#### Site URL
- [ ] **Authentication > URL Configuration > Site URL** が設定されている
  - 本番環境: `https://honma-ec.vercel.app`
  - 開発環境: `http://localhost:3009`

**確認方法:**
1. Supabaseダッシュボード > Authentication > URL Configuration
2. "Site URL" を確認

#### Redirect URLs
- [ ] **Redirect URLs** に以下が追加されている：
  ```
  https://honma-ec.vercel.app
  https://honma-ec.vercel.app/*
  http://localhost:3009
  http://localhost:3009/*
  ```

**確認方法:**
1. Supabaseダッシュボード > Authentication > URL Configuration
2. "Redirect URLs" セクションを確認
3. 上記のURLが追加されているか確認

---

## 👤 4. 管理者権限の設定（必須）

### 4.1 管理者ユーザーの作成
- [ ] Supabaseでユーザーアカウントを作成（メール認証またはGoogle認証）
- [ ] ユーザーのメールアドレスを確認

### 4.2 管理者フラグの設定
- [ ] `profiles` テーブルで `is_admin = true` に設定されている

**設定SQL:**
```sql
-- メールアドレスを指定して管理者権限を付与
UPDATE profiles 
SET is_admin = true 
WHERE email = 'your@email.com';
```

**確認SQL:**
```sql
-- 管理者ユーザーを確認
SELECT id, email, is_admin, created_at
FROM profiles
WHERE is_admin = true;
```

**期待される結果:** 管理者として設定したユーザーが表示される

---

## 🔄 5. 既存ユーザーの同期（既存ユーザーがいる場合）

### 5.1 profiles テーブルへの同期
- [ ] 既存の `auth.users` が `profiles` テーブルに同期されている

**同期SQL:**
```sql
-- 既存のユーザーを profiles テーブルに同期
INSERT INTO public.profiles (id, email)
SELECT id, email
FROM auth.users
ON CONFLICT (id) DO NOTHING;
```

**確認SQL:**
```sql
-- 同期されたユーザー数を確認
SELECT COUNT(*) as profile_count FROM profiles;
SELECT COUNT(*) as auth_user_count FROM auth.users;
```

**期待される結果:** `profile_count` と `auth_user_count` が一致（または近い値）

---

## 📝 6. 環境変数の確認（Vercel）

### 6.1 必須環境変数
- [ ] `VITE_SUPABASE_URL` が設定されている
- [ ] `VITE_SUPABASE_ANON_KEY` が設定されている
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` が設定されている

**確認方法:**
1. Vercelダッシュボード > プロジェクト > Settings > Environment Variables
2. 上記の環境変数が存在するか確認
3. 値が正しいか確認（特に `VITE_SUPABASE_URL` のプロジェクト参照ID）

### 6.2 オプション環境変数（メール送信機能用）
- [ ] `RESEND_API_KEY` が設定されている（メール送信機能を使用する場合）
- [ ] `RESEND_FROM_EMAIL` が設定されている（メール送信機能を使用する場合）

**注意:** これらは `VITE_` プレフィックス**なし**で設定してください。

---

## 🧪 7. 動作確認テスト

### 7.1 フロントエンドの動作確認
- [ ] トップページが表示される
- [ ] 商品一覧が表示される（Supabaseから取得）
- [ ] 商品詳細ページが表示される
- [ ] カート機能が動作する
- [ ] ログイン機能が動作する（メール認証）
- [ ] Googleログインが動作する
- [ ] 決済ページが表示される

### 7.2 管理画面の動作確認
- [ ] `/admin` にアクセスできる
- [ ] 管理者ログインが動作する
- [ ] ダッシュボードが表示される
- [ ] 商品管理が動作する（作成、編集、削除）
- [ ] 商品画像のアップロードが動作する
- [ ] 注文管理が動作する
- [ ] 顧客管理が動作する

### 7.3 データベース操作の確認
- [ ] 商品を追加できる
- [ ] 商品を編集できる
- [ ] 商品を削除できる
- [ ] 注文が作成できる
- [ ] ユーザープロフィールが更新できる

---

## ⚠️ 8. セキュリティチェック

### 8.1 RLSポリシーの確認
- [ ] すべてのテーブルでRLSが有効になっている
- [ ] 一般ユーザーが他のユーザーのデータにアクセスできない
- [ ] 管理者のみが管理操作を実行できる

### 8.2 APIキーの保護
- [ ] `VITE_SUPABASE_ANON_KEY` は公開されても問題ない（Anon Key）
- [ ] Service Role Keyは**絶対に**フロントエンドに公開しない
- [ ] Stripe Secret Keyは**絶対に**フロントエンドに公開しない

---

## 📋 9. 最終確認チェックリスト

### データベース
- [ ] すべてのテーブルが作成されている
- [ ] RLSポリシーが正しく設定されている
- [ ] トリガーと関数が正しく設定されている
- [ ] 外部キー制約が設定されている

### Storage
- [ ] `product-images` バケットが作成されている（Public）
- [ ] `site-images` バケットが作成されている（Public）
- [ ] Storageポリシーが正しく設定されている

### Authentication
- [ ] メール認証が有効になっている
- [ ] Google OAuthが正しく設定されている
- [ ] リダイレクトURLが正しく設定されている

### 管理者権限
- [ ] 管理者ユーザーが設定されている
- [ ] `is_admin = true` が設定されている

### 環境変数
- [ ] すべての必須環境変数が設定されている
- [ ] 環境変数の値が正しい

### 動作確認
- [ ] フロントエンドが正常に動作する
- [ ] 管理画面が正常に動作する
- [ ] 認証機能が正常に動作する

---

## 🆘 トラブルシューティング

### 問題: 商品が表示されない
**確認事項:**
1. `products` テーブルにデータが存在するか
2. RLSポリシーで読み取りが許可されているか
3. Storageバケットのポリシーで読み取りが許可されているか

### 問題: 画像が表示されない
**確認事項:**
1. StorageバケットがPublic設定になっているか
2. 画像のURLが正しいか
3. Storageポリシーで読み取りが許可されているか

### 問題: 管理画面にアクセスできない
**確認事項:**
1. `profiles` テーブルで `is_admin = true` が設定されているか
2. ログインしているユーザーのメールアドレスが正しいか
3. `is_admin()` 関数が正しく動作しているか

### 問題: Googleログインが動作しない
**確認事項:**
1. Google Cloud ConsoleでリダイレクトURIが正しく設定されているか
2. SupabaseでGoogle OAuthが有効になっているか
3. Client IDとClient Secretが正しいか

---

## ✅ チェック完了後の確認

すべてのチェック項目を確認したら、以下を実行してください：

1. **本番環境でテスト**
   - VercelのデプロイURLで動作確認
   - すべての機能が正常に動作するか確認

2. **エラーログの確認**
   - ブラウザのコンソールでエラーがないか確認
   - VercelのFunctionsログでエラーがないか確認
   - Supabaseのログでエラーがないか確認

3. **パフォーマンスの確認**
   - ページの読み込み速度を確認
   - 画像の読み込み速度を確認

---

**このチェックリストをすべて完了すれば、ECサイトは正常に動作するはずです！**

問題が発生した場合は、上記のトラブルシューティングセクションを参照してください。

