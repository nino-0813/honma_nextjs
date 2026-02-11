'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { IconPlus, IconEdit, IconTrash, IconPackage } from '@/components/Icons';

type ShippingMethodRow = {
  id: string;
  name: string;
  fee_type: string;
  uniform_fee: number | null;
  area_fees: Record<string, number> | null;
  created_at: string;
};

const ShippingMethodManagement = () => {
  const [methods, setMethods] = useState<ShippingMethodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMethods = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error: e } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('created_at', { ascending: false });
      if (e) throw e;
      setMethods((data || []) as ShippingMethodRow[]);
    } catch (err: any) {
      setError(err?.message || '発送方法の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const formatFee = (m: ShippingMethodRow) => {
    if (m.fee_type === 'uniform' && m.uniform_fee != null) return `¥${m.uniform_fee}`;
    if (m.fee_type === 'area' && m.area_fees && Object.keys(m.area_fees).length) return '地域別';
    if (m.fee_type === 'size') return 'サイズ別';
    return '-';
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この発送方法を削除しますか？')) return;
    if (!supabase) return;
    try {
      const { error: e } = await supabase.from('shipping_methods').delete().eq('id', id);
      if (e) throw e;
      setMethods((prev) => prev.filter((x) => x.id !== id));
    } catch (err: any) {
      alert(err?.message || '削除に失敗しました');
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">発送方法管理</h1>
          <p className="text-sm text-gray-500 mt-1">送料・発送方法の設定</p>
        </div>
        <Link
          href="/admin/shipping-methods/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          <IconPlus className="w-4 h-4" />
          新規作成
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">読み込み中...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-600">{error}</div>
        ) : methods.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <IconPackage className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="mb-4">発送方法が登録されていません</p>
            <Link
              href="/admin/shipping-methods/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800"
            >
              <IconPlus className="w-4 h-4" />
              最初の発送方法を作成
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {methods.map((m) => (
              <div
                key={m.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{m.name}</h3>
                <p className="text-sm text-gray-600 mb-4">送料: {formatFee(m)}</p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/shipping-methods/${m.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <IconEdit className="w-4 h-4" />
                    編集
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                  >
                    <IconTrash className="w-4 h-4" />
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ShippingMethodManagement;
