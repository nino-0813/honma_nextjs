-- ==========================================
-- 送料表の初期データ投入（正確な料金表に基づく）
-- ==========================================

-- 注意: このSQLを実行する前に、shipping_methodsテーブルが作成されていることを確認してください
-- `supabase_schema.sql`（統合版）を先に実行してください

-- 既存のデータを削除（再実行時用）
DELETE FROM public.shipping_methods WHERE name IN ('通常料金', 'クール便料金');

-- 【通常料金】の発送方法を作成
INSERT INTO public.shipping_methods (
  name,
  box_size,
  max_weight_kg,
  max_items_per_box,
  fee_type,
  size_fees,
  created_at,
  updated_at
) VALUES (
  '通常料金',
  NULL,
  NULL,
  NULL,
  'size',
  '{
    "60_2": {
      "size": 60,
      "weight_kg": 2,
      "area_fees": {
        "hokkaido": 935,
        "north_tohoku": 715,
        "south_tohoku": 605,
        "kanto": 605,
        "shinetsu": 605,
        "hokuriku": 605,
        "chubu": 605,
        "kansai": 715,
        "chugoku": 825,
        "shikoku": 825,
        "kyushu": 935,
        "okinawa": 1606
      }
    },
    "80_5": {
      "size": 80,
      "weight_kg": 5,
      "area_fees": {
        "hokkaido": 990,
        "north_tohoku": 770,
        "south_tohoku": 660,
        "kanto": 660,
        "shinetsu": 660,
        "hokuriku": 660,
        "chubu": 660,
        "kansai": 770,
        "chugoku": 880,
        "shikoku": 880,
        "kyushu": 990,
        "okinawa": 2222
      }
    },
    "100_10": {
      "size": 100,
      "weight_kg": 10,
      "area_fees": {
        "hokkaido": 1100,
        "north_tohoku": 880,
        "south_tohoku": 770,
        "kanto": 770,
        "shinetsu": 770,
        "hokuriku": 770,
        "chubu": 770,
        "kansai": 880,
        "chugoku": 990,
        "shikoku": 990,
        "kyushu": 1100,
        "okinawa": 2860
      }
    },
    "120_15": {
      "size": 120,
      "weight_kg": 15,
      "area_fees": {
        "hokkaido": 1210,
        "north_tohoku": 990,
        "south_tohoku": 880,
        "kanto": 880,
        "shinetsu": 880,
        "hokuriku": 880,
        "chubu": 880,
        "kansai": 990,
        "chugoku": 1100,
        "shikoku": 1100,
        "kyushu": 1210,
        "okinawa": 3509
      }
    },
    "140_20": {
      "size": 140,
      "weight_kg": 20,
      "area_fees": {
        "hokkaido": 1320,
        "north_tohoku": 1100,
        "south_tohoku": 990,
        "kanto": 990,
        "shinetsu": 990,
        "hokuriku": 990,
        "chubu": 990,
        "kansai": 1100,
        "chugoku": 1210,
        "shikoku": 1210,
        "kyushu": 1320,
        "okinawa": 4180
      }
    }
  }'::jsonb,
  NOW(),
  NOW()
);

-- 【クール便料金】の発送方法を作成
INSERT INTO public.shipping_methods (
  name,
  box_size,
  max_weight_kg,
  max_items_per_box,
  fee_type,
  size_fees,
  created_at,
  updated_at
) VALUES (
  'クール便料金',
  NULL,
  NULL,
  NULL,
  'size',
  '{
    "60_2": {
      "size": 60,
      "weight_kg": 2,
      "area_fees": {
        "hokkaido": 1210,
        "north_tohoku": 990,
        "south_tohoku": 880,
        "kanto": 880,
        "shinetsu": 880,
        "hokuriku": 880,
        "chubu": 880,
        "kansai": 990,
        "chugoku": 1100,
        "shikoku": 1100,
        "kyushu": 1210,
        "okinawa": 1881
      }
    },
    "80_5": {
      "size": 80,
      "weight_kg": 5,
      "area_fees": {
        "hokkaido": 1320,
        "north_tohoku": 1100,
        "south_tohoku": 990,
        "kanto": 990,
        "shinetsu": 990,
        "hokuriku": 990,
        "chubu": 990,
        "kansai": 1100,
        "chugoku": 1210,
        "shikoku": 1210,
        "kyushu": 1320,
        "okinawa": 2552
      }
    },
    "100_10": {
      "size": 100,
      "weight_kg": 10,
      "area_fees": {
        "hokkaido": 1540,
        "north_tohoku": 1320,
        "south_tohoku": 1210,
        "kanto": 1210,
        "shinetsu": 1210,
        "hokuriku": 1210,
        "chubu": 1210,
        "kansai": 1320,
        "chugoku": 1430,
        "shikoku": 1430,
        "kyushu": 1540,
        "okinawa": 3300
      }
    },
    "120_15": {
      "size": 120,
      "weight_kg": 15,
      "area_fees": {
        "hokkaido": 1925,
        "north_tohoku": 1705,
        "south_tohoku": 1595,
        "kanto": 1595,
        "shinetsu": 1595,
        "hokuriku": 1595,
        "chubu": 1595,
        "kansai": 1705,
        "chugoku": 1815,
        "shikoku": 1815,
        "kyushu": 1925,
        "okinawa": 4224
      }
    }
  }'::jsonb,
  NOW(),
  NOW()
);

-- 確認用: 作成されたデータを表示
SELECT 
  id,
  name,
  fee_type,
  jsonb_object_keys(size_fees) as size_weight_key
FROM public.shipping_methods
WHERE name IN ('通常料金', 'クール便料金')
ORDER BY name;
