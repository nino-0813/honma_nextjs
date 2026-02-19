-- マイグレーション: ordersテーブルに配送会社と発送番号（追跡番号）を追加
-- Supabase SQL Editorで実行してください

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tracking_number TEXT;


