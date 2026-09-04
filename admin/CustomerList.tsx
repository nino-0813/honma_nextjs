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
  IconTrash,
  IconFilter,
  IconDownload,
} from '@/components/Icons';

interface CustomerRow {
  id: string;
  last_name: string;
  first_name: string | null;
  email: string | null;
  platform: string | null;
  birth_year: number | null;
  age_decade: number | null;
  birth_year_from: number | null;
  birth_year_to: number | null;
  gender: string | null;
  target_categories: string[] | null;
  first_purchase_rice_date: string | null;
  first_purchase_shiitake_date: string | null;
  latest_purchase_rice_date: string | null;
  latest_purchase_shiitake_date: string | null;
  newsletter_opt_in: boolean | null;
  referrer_name: string | null;
  isProfileOnly?: boolean;
}

const TARGET_CATEGORIES = [
  'プロダクト（美味しさ）',
  'プロダクト（質・安全性）',
  '活動（サステナ・スピリチュアル・共感）',
  '人柄（地域応援）',
  '人柄（個人・繋がり）',
];

const PLATFORM_LABEL: Record<string, string> = {
  website: '自社サイト',
  base: 'BASE',
  other: 'その他',
};

const RECENCY_CUTOFF_DAYS = 90;

type PlatformFilter = 'all' | 'website' | 'base' | 'other';
type NewsletterFilter = 'all' | 'yes' | 'no';
type RecencyFilter = 'all' | 'recent' | 'dormant';

const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('ja-JP') : '-');

const formatCustomerAge = (c: CustomerRow) => {
  if (c.birth_year) return `${c.birth_year}年`;
  if (c.age_decade && c.birth_year_from && c.birth_year_to) {
    return `${c.age_decade}代（${c.birth_year_from}〜${c.birth_year_to}年）`;
  }
  return '-';
};

const getLatestPurchaseDate = (c: CustomerRow): Date | null => {
  const dates = [c.latest_purchase_rice_date, c.latest_purchase_shiitake_date].filter(Boolean) as string[];
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((d) => new Date(d).getTime())));
};

const toCsv = (rows: Record<string, any>[]) => {
  const headerSet = rows.reduce<Set<string>>((set, r) => {
    Object.keys(r).forEach((k) => set.add(k));
    return set;
  }, new Set<string>());
  const headers = Array.from(headerSet);
  const escape = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
};

const downloadText = (filename: string, text: string) => {
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const CustomerList = () => {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [newsletterFilter, setNewsletterFilter] = useState<NewsletterFilter>('all');
  const [recencyFilter, setRecencyFilter] = useState<RecencyFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
          birth_year: null,
          age_decade: null,
          birth_year_from: null,
          birth_year_to: null,
          gender: null,
          target_categories: [],
          first_purchase_rice_date: null,
          first_purchase_shiitake_date: null,
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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err: any) {
      console.error('削除に失敗しました:', err);
      alert(`削除に失敗しました: ${err.message}`);
    }
  };

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RECENCY_CUTOFF_DAYS);

    return customers.filter((c) => {
      if (q) {
        const name = `${c.last_name}${c.first_name || ''}`.toLowerCase();
        if (!name.includes(q) && !(c.email || '').toLowerCase().includes(q)) return false;
      }
      if (platformFilter !== 'all' && (c.platform || 'website') !== platformFilter) return false;
      if (newsletterFilter !== 'all') {
        const optIn = Boolean(c.newsletter_opt_in);
        if (newsletterFilter === 'yes' && !optIn) return false;
        if (newsletterFilter === 'no' && optIn) return false;
      }
      if (categoryFilter !== 'all' && !(c.target_categories || []).includes(categoryFilter)) return false;
      if (recencyFilter !== 'all') {
        const latest = getLatestPurchaseDate(c);
        const isRecent = latest ? latest.getTime() >= cutoff.getTime() : false;
        if (recencyFilter === 'recent' && !isRecent) return false;
        if (recencyFilter === 'dormant' && isRecent) return false;
      }
      return true;
    });
  }, [customers, searchQuery, platformFilter, newsletterFilter, categoryFilter, recencyFilter]);

  const hasActiveFilter =
    Boolean(searchQuery) ||
    platformFilter !== 'all' ||
    newsletterFilter !== 'all' ||
    categoryFilter !== 'all' ||
    recencyFilter !== 'all';

  const stats = useMemo(
    () => ({
      total: customers.length,
      base: customers.filter((c) => c.platform === 'base').length,
      newsletter: customers.filter((c) => c.newsletter_opt_in).length,
    }),
    [customers]
  );

  const selectedCount = selectedIds.size;
  const allChecked = filteredCustomers.length > 0 && filteredCustomers.every((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allChecked) {
      const next = new Set(selectedIds);
      filteredCustomers.forEach((c) => next.delete(c.id));
      setSelectedIds(next);
      return;
    }
    const next = new Set(selectedIds);
    filteredCustomers.forEach((c) => next.add(c.id));
    setSelectedIds(next);
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const exportCustomersCsv = () => {
    const toExport = selectedCount > 0 ? filteredCustomers.filter((c) => selectedIds.has(c.id)) : filteredCustomers;
    if (toExport.length === 0) {
      alert('出力する顧客がいません。');
      return;
    }
    const rows = toExport.map((c) => ({
      氏名: `${c.last_name}${c.first_name ? ` ${c.first_name}` : ''}`,
      メール: c.email || '',
      プラットフォーム: c.platform ? PLATFORM_LABEL[c.platform] || c.platform : '',
      生年: c.birth_year || '',
      推定年代: c.age_decade ? `${c.age_decade}代` : '',
      推定生年範囲: !c.birth_year && c.birth_year_from && c.birth_year_to ? `${c.birth_year_from}〜${c.birth_year_to}` : '',
      性別: c.gender || '',
      ターゲットカテゴリー: (c.target_categories || []).join(' / '),
      初回購入日_お米: c.first_purchase_rice_date || '',
      初回購入日_椎茸: c.first_purchase_shiitake_date || '',
      最新購入日_お米: c.latest_purchase_rice_date || '',
      最新購入日_椎茸: c.latest_purchase_shiitake_date || '',
      メルマガ許可: c.newsletter_opt_in ? '許可' : '',
      紹介者: c.referrer_name || '',
    }));
    downloadText(`customers-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  };

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
          <div className="p-4 border-b border-gray-100 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="氏名、メールアドレスで検索..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors bg-white"
              >
                <IconFilter className="w-4 h-4" />
                フィルター
              </button>
              <button
                type="button"
                onClick={exportCustomersCsv}
                className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors bg-white"
              >
                <IconDownload className="w-4 h-4" />
                CSV出力{selectedCount > 0 ? `（選択${selectedCount}件）` : ''}
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">プラットフォーム</label>
                  <select
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value as PlatformFilter)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-white text-sm"
                  >
                    <option value="all">すべて</option>
                    <option value="website">自社サイト</option>
                    <option value="base">BASE</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">メルマガ許可</label>
                  <select
                    value={newsletterFilter}
                    onChange={(e) => setNewsletterFilter(e.target.value as NewsletterFilter)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-white text-sm"
                  >
                    <option value="all">すべて</option>
                    <option value="yes">許可のみ</option>
                    <option value="no">未許可のみ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">最新購入</label>
                  <select
                    value={recencyFilter}
                    onChange={(e) => setRecencyFilter(e.target.value as RecencyFilter)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-white text-sm"
                  >
                    <option value="all">すべて</option>
                    <option value="recent">3ヶ月以内</option>
                    <option value="dormant">3ヶ月以上経過</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ターゲットカテゴリー</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-white text-sm"
                  >
                    <option value="all">すべて</option>
                    {TARGET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">読み込み中...</div>
          ) : error ? (
            <div className="p-10 text-center text-red-600">{error}</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              {hasActiveFilter ? '検索条件に一致する顧客はありません。' : '顧客データはまだありません。'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] table-fixed text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-3 py-3 w-32 whitespace-nowrap">氏名</th>
                    <th className="px-3 py-3 w-44 whitespace-nowrap">メール</th>
                    <th className="px-3 py-3 w-24 whitespace-nowrap">年代・生年</th>
                    <th className="px-3 py-3 w-24 whitespace-nowrap">媒体</th>
                    <th className="px-3 py-3 w-20 whitespace-nowrap">カテゴリー</th>
                    <th className="px-3 py-3 w-28 whitespace-nowrap">最新購入</th>
                    <th className="px-3 py-3 w-20 whitespace-nowrap">メルマガ</th>
                    <th className="px-3 py-3 w-44" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="group hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleSelectOne(c.id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-3 min-w-0">
                        <Link
                          href={`/admin/customer-list/${c.id}`}
                          className="block truncate font-medium text-gray-900 hover:text-primary transition-colors"
                          title={`${c.last_name}${c.first_name ? ` ${c.first_name}` : ''}`}
                        >
                          {c.last_name}
                          {c.first_name ? ` ${c.first_name}` : ''}
                        </Link>
                        {c.isProfileOnly && (
                          <div className="text-[10px] text-amber-600 mt-0.5">会員登録済み・未編集</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-600 truncate" title={c.email || ''}>
                        {c.email || '-'}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 leading-relaxed" title={formatCustomerAge(c)}>
                        {c.birth_year ? `${c.birth_year}年` : c.age_decade ? <><span className="font-medium text-gray-800">{c.age_decade}代</span><br /><span className="text-[10px]">{c.birth_year_from}〜{c.birth_year_to}</span></> : '-'}
                      </td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                        {c.platform ? PLATFORM_LABEL[c.platform] || c.platform : '-'}
                      </td>
                      <td className="px-3 py-3">
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
                      <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                        米 {formatDate(c.latest_purchase_rice_date)}
                        <br />
                        椎茸 {formatDate(c.latest_purchase_shiitake_date)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {c.newsletter_opt_in ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            許可
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {c.email && (
                            <Link
                              href={`/admin/orders?email=${encodeURIComponent(c.email)}`}
                              className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                            >
                              注文履歴
                            </Link>
                          )}
                          <Link
                            href={`/admin/customer-list/${c.id}`}
                            className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                          >
                            編集
                          </Link>
                          {!c.isProfileOnly && (
                            <button
                              type="button"
                              onClick={() => handleDelete(c.id)}
                              title="削除"
                              className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
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
