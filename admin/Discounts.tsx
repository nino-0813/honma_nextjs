'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  IconPlus,
  IconSearch,
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

type Status = 'active' | 'inactive' | 'expired';

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'クーポンの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const filteredCoupons = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return coupons.filter(
      (c) =>
        c.code?.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q)
    );
  }, [coupons, searchQuery]);

  const getStatus = (c: Coupon): Status => {
    if (!c.is_active) return 'inactive';
    const now = Date.now();
    if (c.starts_at && new Date(c.starts_at).getTime() > now) return 'inactive';
    if (c.ends_at && new Date(c.ends_at).getTime() < now) return 'expired';
    return 'active';
  };

  const getStatusLabel = (s: Status): string =>
    s === 'active' ? '有効' : s === 'expired' ? '期限切れ' : '無効';

  const getStatusColor = (s: Status): string =>
    s === 'active'
      ? 'bg-green-50 text-green-700 border-green-100'
      : s === 'expired'
        ? 'bg-red-50 text-red-700 border-red-100'
        : 'bg-gray-100 text-gray-600 border-gray-200';

  const formatDiscountValue = (c: Coupon): string => {
    if (c.discount_type === 'percentage') return `${c.discount_value}% OFF`;
    return `¥${c.discount_value.toLocaleString()} OFF`;
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <div className="flex items-center gap-2">
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
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-md hover:bg-emerald-800 transition-all shadow-sm"
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
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                  {filteredCoupons.map((c, index) => {
                    const status = getStatus(c);
                    return (
                      <tr
                        key={c.id}
                        className="group hover:bg-gray-50/80 transition-colors opacity-0 animate-fade-in-up"
                        style={{ animationDelay: `${index * 30}ms` }}
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
                            {c.name ?? '（未設定）'}
                            <div className="text-xs text-gray-500 font-mono mt-0.5">{c.code ?? '-'}</div>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">{formatDiscountValue(c)}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {c.starts_at ? new Date(c.starts_at).toLocaleDateString('ja-JP') : '指定なし'}
                          {c.ends_at ? ` 〜 ${new Date(c.ends_at).toLocaleDateString('ja-JP')}` : c.starts_at ? '' : ''}
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
                  {filteredCoupons.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        クーポンがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && (
            <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
              <span>{filteredCoupons.length} 件中 {filteredCoupons.length === 0 ? '0' : `1-${filteredCoupons.length}`} 件を表示</span>
              <div className="flex gap-2">
                <button type="button" className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>
                  前へ
                </button>
                <button type="button" className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50" disabled>
                  次へ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Discounts;
