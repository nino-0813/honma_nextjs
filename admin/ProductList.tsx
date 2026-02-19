'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { IconPlus, IconEdit, IconRefreshCw } from '@/components/Icons';

type ProductRow = {
  id: string;
  title: string;
  handle: string;
  price: number;
  category: string;
  stock: number | null;
  is_active: boolean;
  is_visible: boolean | null;
  image: string | null;
  images: string[] | null;
  created_at: string;
};

const ProductList = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error: e } = await supabase
        .from('products')
        .select('id, title, handle, price, category, stock, is_active, is_visible, image, images, created_at')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (e) throw e;
      setProducts((data || []) as ProductRow[]);
    } catch (err: any) {
      setError(err?.message || '商品の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
          <p className="text-sm text-gray-500 mt-1">商品一覧・編集</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchProducts}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <IconRefreshCw className="w-4 h-4" />
            更新
          </button>
          <Link
            href="/admin/products/new"
            className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
          >
            <IconPlus className="w-4 h-4" />
            商品を追加
          </Link>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">読み込み中...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-600">{error}</div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <p className="mb-4">商品がまだありません</p>
            <Link href="/admin/products/new" className="text-gray-900 font-medium underline">
              最初の商品を追加
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">商品</th>
                  <th className="px-6 py-3">ハンドル</th>
                  <th className="px-6 py-3">価格</th>
                  <th className="px-6 py-3">在庫</th>
                  <th className="px-6 py-3">状態</th>
                  <th className="px-6 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.image || (p.images && p.images[0]) ? (
                          <img
                            src={p.image || p.images![0]}
                            alt=""
                            className="w-12 h-12 object-cover rounded border border-gray-100"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                            画像なし
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{p.handle}</td>
                    <td className="px-6 py-4 font-medium">¥{Number(p.price).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{p.stock ?? 0}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs ${
                          p.is_active && p.is_visible !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.is_active && p.is_visible !== false ? '公開' : '非公開'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/products/${p.handle}`}
                        className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                      >
                        <IconEdit className="w-4 h-4" />
                        編集
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductList;
