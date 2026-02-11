'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  IconPlus,
  IconPercent,
  IconFilter,
  IconEdit,
  IconMore,
  IconCheckCircle,
  IconTrendingUp,
  IconRefreshCw,
} from '@/components/Icons';

type Coupon = {
  id: string;
  name: string | null;
  code: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  usage_count: number;
  usage_limit: number | null;
  created_at: string;
};

type Status = 'active' | 'scheduled' | 'expired' | 'inactive';

const Discounts = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCoupons = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: e } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (e) throw e;
      setCoupons((data || []) as Coupon[]);
    } catch (err: any) {
      setError(err?.message || 'クーポンの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const getStatus = (c: Coupon): Status => {
    if (!c.is_active) return 'inactive';
    const now = new Date().toISOString();
    if (c.starts_at && now < c.starts_at) return 'scheduled';
    if (c.ends_at && now > c.ends_at) return 'expired';
    return 'active';
  };

  const getStatusLabel = (s: Status): string => {
    switch (s) {
      case 'active': return '有効';
      case 'scheduled': return '予約';
      case 'expired': return '期限切れ';
      case 'inactive': return '無効';
      default: return '';
    }
  };

  const getStatusColor = (s: Status): string => {
    switch (s) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200';
      case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'expired': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'inactive': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const formatDiscountValue = (c: Coupon): string => {
    if (c.discount_type === 'percentage') return `${c.discount_value}%OFF`;
    return `¥${c.discount_value}`;
  };

  const filteredCoupons = coupons.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.name?.toLowerCase().includes(q)) ||
      (c.code?.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">クーポン</h1>
          <p className="text-sm text-gray-500 mt-1">割引コードの作成・管理</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCoupons}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm flex items-center gap-2"
          >
            <IconRefreshCw className="w-4 h-4" />
            更新
          </button>
          <Link
            href="/admin/discounts/new"
            className="bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-800 transition-all shadow-sm flex items-center gap-2"
          >
            <IconPlus className="w-4 h-4" />
            クーポンを作成
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <IconPercent className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">有効なクーポン</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {coupons.filter((c) => getStatus(c) === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconTrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">総使用回数</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {coupons.reduce((sum, c) => sum + (c.usage_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <IconCheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">無効/期限切れ</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {coupons.filter((c) => getStatus(c) !== 'active').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="コード、名前で検索..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>
            <button
              type="button"
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <IconFilter className="w-4 h-4" />
              フィルター
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">読み込み中...</div>
          ) : error ? (
            <div className="p-10 text-center text-red-600">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">ステータス</th>
                    <th className="px-6 py-3">クーポン名</th>
                    <th className="px-6 py-3">割引</th>
                    <th className="px-6 py-3">期間</th>
                    <th className="px-6 py-3">使用枚数</th>
                    <th className="px-6 py-3 w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCoupons.map((c) => {
                    const status = getStatus(c);
                    return (
                      <tr
                        key={c.id}
                        className="group hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/discounts/${c.id}`}
                            className="font-medium text-gray-900 hover:text-primary transition-colors"
                          >
                            {c.name || '（未設定）'}
                            <div className="text-xs text-gray-500 font-mono mt-0.5">
                              {c.code || '-'}
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">
                            {formatDiscountValue(c)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {c.starts_at
                            ? new Date(c.starts_at).toLocaleDateString('ja-JP')
                            : '指定なし'}
                          {c.ends_at
                            ? ` 〜 ${new Date(c.ends_at).toLocaleDateString('ja-JP')}`
                            : c.starts_at
                              ? ''
                              : ''}
                          {!c.ends_at && !c.starts_at && '（期間なし）'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {c.usage_count || 0}
                          {c.usage_limit ? ` / ${c.usage_limit}` : ''}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <Link
                              href={`/admin/discounts/${c.id}`}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <IconEdit className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            </Link>
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              title="その他"
                            >
                              <IconMore className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Discounts;
