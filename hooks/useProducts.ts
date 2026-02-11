import { useState, useEffect } from 'react';
import { supabase, convertDatabaseProductToProduct, DatabaseProduct } from '../lib/supabase';
import { Product } from '../types';
import { products as fallbackProducts } from '../data/products';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!supabase) {
        console.error('Supabaseが利用できません。環境変数を確認してください。');
        setError(new Error('Supabaseが設定されていません'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'active')
          .order('display_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        if (data && data.length > 0) {
          const convertedProducts = data
            .map((dbProduct: DatabaseProduct) => {
              const product = convertDatabaseProductToProduct(dbProduct);
              // display_orderがnullの場合は、配列のインデックスを使用
              if (product.display_order === undefined || product.display_order === null) {
                product.display_order = 999999;
              }
              return product;
            })
            // is_visibleがfalseの商品を除外
            .filter(product => product.is_visible !== false)
            // display_orderでソート（クライアント側でも確実にソート）
            .sort((a, b) => {
              const orderA = a.display_order ?? 999999;
              const orderB = b.display_order ?? 999999;
              if (orderA !== orderB) {
                return orderA - orderB;
              }
              // display_orderが同じ場合はcreated_atでソート
              return 0;
            });
          
          setProducts(convertedProducts);
        } else {
          // データがない場合は空配列
          setProducts([]);
          console.warn('Supabaseに商品データがありません。');
        }
      } catch (err: any) {
        console.error('商品データの取得に失敗しました:', err);
        
        // 402エラー（Payment Required）の場合は詳細なメッセージを表示
        if (err?.status === 402 || err?.code === '402' || err?.message?.includes('402')) {
          setError(new Error('Supabaseのクォータを超えているか、支払いが必要です。Supabaseダッシュボードでプロジェクトの状態を確認してください。'));
        } else if (err?.code === 'PGRST301' || err?.message?.includes('JWT')) {
          setError(new Error('認証エラーが発生しました。SupabaseのAPIキーを確認してください。'));
        } else if (err?.code === 'PGRST116') {
          setError(new Error('商品データが見つかりませんでした。'));
        } else {
          setError(err instanceof Error ? err : new Error('商品データの取得に失敗しました'));
        }
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
};

// 全商品を取得（管理者用、ステータス問わず）
export const useAllProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async () => {
    if (!supabase) {
      console.error('Supabaseが利用できません。環境変数を確認してください。');
      setError(new Error('Supabaseが設定されていません'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        const convertedProducts = data.map((dbProduct: DatabaseProduct) =>
          convertDatabaseProductToProduct(dbProduct)
        );
        setProducts(convertedProducts);
      } else {
        setProducts([]);
        console.warn('Supabaseに商品データがありません。');
      }
    } catch (err: any) {
      console.error('商品データの取得に失敗しました:', err);
      
      // 402エラー（Payment Required）の場合は詳細なメッセージを表示
      if (err?.status === 402 || err?.code === '402' || err?.message?.includes('402')) {
        setError(new Error('Supabaseのクォータを超えているか、支払いが必要です。Supabaseダッシュボードでプロジェクトの状態を確認してください。'));
      } else if (err?.code === 'PGRST301' || err?.message?.includes('JWT')) {
        setError(new Error('認証エラーが発生しました。SupabaseのAPIキーを確認してください。'));
      } else if (err?.code === 'PGRST116') {
        setError(new Error('商品データが見つかりませんでした。'));
      } else {
        setError(err instanceof Error ? err : new Error('商品データの取得に失敗しました'));
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, error, refetch: fetchProducts };
};

