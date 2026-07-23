'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  IconPlus,
  IconSearch,
  IconUsers,
  IconMail,
  IconRefreshCw,
  IconEdit,
  IconTrash,
} from '@/components/Icons';

interface CustomerRow {
  id: string;
  last_name: string;
  first_name: string | null;
  email: string | null;
  platform: string | null;
  gender: string | null;
  target_categories: string[] | null;
  latest_purchase_rice_date: string | null;
  latest_purchase_shiitake_date: string | null;
  newsletter_opt_in: boolean | null;
  referrer_name: string | null;
  isProfileOnly?: boolean;
}

const PLATFORM_LABEL: Record<string, string> = {
  website: '自社サイト',
  base: 'BASE',
  other: 'その他',
};

const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('ja-JP') : '-');

const CustomerList = () => {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    if (!supabase) {
      setError('Supabaseが設定されていません。');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [customersResult, profilesResult] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, email, first_name, last_name, created_at').order('created_at', { ascending: false }),
      ]);
      if (customersResult.error) throw customersResult.error;
      if (profilesResult.error) {
        console.warn('プロフィールデータが取得できませんでした:', profilesResult.error);
      }

      const customerRows = (customersResult.data || []) as CustomerRow[];
      const customerEmails = new Set(
        customerRows.map((c) => (c.email || '').toLowerCase()).filter(Boolean)
      );

      // 顧客リストにまだ登録されていない既存会員（profiles）を、編集可能な仮想行として追加
      const profileOnlyRows: CustomerRow[] = (profilesResult.data || [])
        .filter((p: any) => !p.email || !customerEmails.has(String(p.email).toLowerCase()))
        .map((p: any) => ({
          id: `profile-${p.id}`,
          last_name: p.last_name || p.email || '（氏名未登録）',
          first_name: p.first_name || null,
          email: p.email || null,
          platform: 'website',
          gender: null,
          target_categories: [],
          latest_purchase_rice_date: null,
          latest_purchase_shiitake_date: null,
          newsletter_opt_in: null,
          referrer_name: null,
          isProfileOnly: true,
        }));

      setCustomers([...customerRows, ...profileOnlyRows]);
    } catch (err: any) {
      console.error('顧客データの取得に失敗しました:', err);
      setError(err.message || '顧客データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    if (id.startsWith('profile-')) {
      alert('会員登録済みのお客様です。削除するにはまず情報を編集して顧客リストに登録してください。');
      return;
    }
    if (!window.confirm('この顧客を削除しますか？')) return;
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      console.error('削除に失敗しました:', err);
      alert(`削除に失敗しました: ${err.message}`);
    }
  };

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const name = `${c.last_name}${c.first_name || ''}`.toLowerCase();
      return name.includes(q) || (c.email || '').toLowerCase().includes(q);
    });
  }, [customers, searchQuery]);

  const stats = useMemo(
    () => ({
      total: customers.length,
      base: customers.filter((c) => c.platform === 'base').length,
      newsletter: customers.filter((c) => c.newsletter_opt_in).length,
    }),
    [customers]
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">顧客リスト</h1>
          <p className="text-sm text-gray-500 mt-0.5">自社サイト・他プラットフォームのお客様を一元管理</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCustomers}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm flex items-center gap-2"
          >
            <IconRefreshCw className="w-4 h-4" />
            更新
          </button>
          <Link
            href="/admin/customer-list/new"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-md hover:bg-emerald-800 transition-all shadow-sm"
          >
            <IconPlus className="w-4 h-4" />
            顧客を追加
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <IconUsers className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">総顧客数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconUsers className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">BASE顧客</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.base}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <IconMail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">メルマガ許可</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.newsletter}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="氏名、メールアドレスで検索..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">読み込み中...</div>
          ) : error ? (
            <div className="p-10 text-center text-red-600">{error}</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              {searchQuery ? '検索条件に一致する顧客はありません。' : '顧客データはまだありません。'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">氏名</th>
                    <th className="px-4 py-3 whitespace-nowrap">メール</th>
                    <th className="px-4 py-3 whitespace-nowrap">媒体</th>
                    <th className="px-4 py-3 whitespace-nowrap">カテゴリー</th>
                    <th className="px-4 py-3 whitespace-nowrap">最新購入</th>
                    <th className="px-4 py-3 whitespace-nowrap">メルマガ</th>
                    <th className="px-4 py-3 w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="group hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/admin/customer-list/${c.id}`}
                          className="font-medium text-gray-900 hover:text-primary transition-colors"
                        >
                          {c.last_name}
                          {c.first_name ? ` ${c.first_name}` : ''}
                        </Link>
                        {c.isProfileOnly && (
                          <div className="text-[10px] text-amber-600 mt-0.5">会員登録済み・未編集</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate" title={c.email || ''}>
                        {c.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {c.platform ? PLATFORM_LABEL[c.platform] || c.platform : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {(c.target_categories || []).length === 0 ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          <span
                            className="text-xs text-gray-600"
                            title={(c.target_categories || []).join(' / ')}
                          >
                            {(c.target_categories || []).length}件
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        米 {formatDate(c.latest_purchase_rice_date)}
                        <br />
                        椎茸 {formatDate(c.latest_purchase_shiitake_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {c.newsletter_opt_in ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            許可
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/customer-list/${c.id}`}>
                            <IconEdit className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </Link>
                          {!c.isProfileOnly && (
                            <button type="button" onClick={() => handleDelete(c.id)} title="削除">
                              <IconTrash className="w-4 h-4 text-gray-400 hover:text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomerList;
