-- マイグレーション: 注文にクーポンのスナップショット（コード・名前・特典内容）を追加
-- Supabase SQL Editorで実行してください
-- 目的: マイページ（お客様側）はcouponsテーブルを直接参照できない（RLSで管理者限定）ため、
--       注文作成時点のクーポン情報を注文自体に保存しておき、後から確認できるようにする。

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_note TEXT;
