'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IconTrendingUp, IconUsers, IconSearch, IconChevronDown } from '@/components/Icons';

interface CustomerRow {
  id: string;
  last_name: string;
  first_name: string | null;
  email: string | null;
  referrer_name: string | null;
  referred_by_customer_id: string | null;
}

interface OrderRow {
  email: string | null;
  total: number;
  payment_status: string;
}

type ReferredPerson = {
  id: string;
  name: string;
  email: string | null;
  total: number;
  orderCount: number;
};

const formatYen = (n: number) => `¥${Number(n || 0).toLocaleString()}`;

const ReferralSales = () => {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!supabase) {
        setError('Supabaseが設定されていません。');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [customersRes, ordersRes] = await Promise.all([
          supabase.from('customers').select('id, last_name, first_name, email, referrer_name, referred_by_customer_id'),
          supabase.from('orders').select('email, total, payment_status').eq('payment_status', 'paid'),
        ]);
        if (customersRes.error) throw customersRes.error;
        if (ordersRes.error) throw ordersRes.error;
        setCustomers((customersRes.data || []) as CustomerRow[]);
        setOrders((ordersRes.data || []) as OrderRow[]);
      } catch (e: any) {
        console.error('紹介実績データの取得に失敗しました:', e);
        setError(e.message || 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const customerById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);

  const salesByEmail = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    orders.forEach((o) => {
      if (!o.email) return;
      const key = o.email.toLowerCase();
      const current = map.get(key) || { total: 0, count: 0 };
      current.total += Number(o.total || 0);
      current.count += 1;
      map.set(key, current);
    });
    return map;
  }, [orders]);

  const getName = (c: { last_name: string; first_name: string | null }) =>
    `${c.last_name}${c.first_name ? ` ${c.first_name}` : ''}`;

  const { groups, unlinked } = useMemo(() => {
    const groupMap = new Map<string, { referrerId: string; referrerName: string; referred: ReferredPerson[] }>();
    const unlinkedList: Array<ReferredPerson & { referrerName: string }> = [];

    customers.forEach((c) => {
      if (!c.referred_by_customer_id && !c.referrer_name) return; // 紹介されていない人はスキップ

      const sales = c.email ? salesByEmail.get(c.email.toLowerCase()) : undefined;
      const person: ReferredPerson = {
        id: c.id,
        name: getName(c),
        email: c.email,
        total: sales?.total || 0,
        orderCount: sales?.count || 0,
      };

      if (c.referred_by_customer_id) {
        const referrer = customerById.get(c.referred_by_customer_id);
        const referrerName = referrer ? getName(referrer) : c.referrer_name || '（不明な紹介者）';
        const key = c.referred_by_customer_id;
        const group = groupMap.get(key) || { referrerId: key, referrerName, referred: [] };
        group.referred.push(person);
        groupMap.set(key, group);
      } else if (c.referrer_name) {
        unlinkedList.push({ ...person, referrerName: c.referrer_name });
      }
    });

    const groupList = Array.from(groupMap.values())
      .map((g) => ({
        ...g,
        totalSales: g.referred.reduce((sum, r) => sum + r.total, 0),
        referredCount: g.referred.length,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);

    return { groups: groupList, unlinked: unlinkedList };
  }, [customers, salesByEmail, customerById]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.referrerName.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  const stats = useMemo(
    () => ({
      totalReferrers: groups.length,
      totalReferred: groups.reduce((sum, g) => sum + g.referredCount, 0) + unlinked.length,
      totalSales: groups.reduce((sum, g) => sum + g.totalSales, 0),
    }),
    [groups, unlinked]
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
        <div className="text-center text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">紹介実績</h1>
        <p className="text-sm text-gray-500 mt-0.5">紹介URL経由で登録したお客様の購入実績を紹介者ごとに集計</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <IconUsers className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">紹介者数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalReferrers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconUsers className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">紹介された人数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalReferred}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <IconTrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">紹介経由の売上合計</p>
                <p className="text-2xl font-semibold text-gray-900">{formatYen(stats.totalSales)}</p>
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
                placeholder="紹介者名で検索..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              {searchQuery ? '検索条件に一致する紹介者はいません。' : '紹介経由の登録はまだありません。'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredGroups.map((g) => (
                <div key={g.referrerId}>
                  <button
                    type="button"
                    onClick={() => setExpandedId((prev) => (prev === g.referrerId ? null : g.referrerId))}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <IconChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          expandedId === g.referrerId ? 'rotate-180' : ''
                        }`}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{g.referrerName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">紹介した人数: {g.referredCount}人</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatYen(g.totalSales)}</div>
                      <div className="text-xs text-gray-500">紹介経由の売上</div>
                    </div>
                  </button>

                  {expandedId === g.referrerId && (
                    <div className="bg-gray-50/50 px-6 py-4">
                      <table className="w-full text-left text-sm">
                        <thead className="text-gray-500 text-xs">
                          <tr>
                            <th className="pb-2 font-medium">氏名</th>
                            <th className="pb-2 font-medium">メール</th>
                            <th className="pb-2 font-medium text-right">注文件数</th>
                            <th className="pb-2 font-medium text-right">購入金額</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {g.referred.map((r) => (
                            <tr key={r.id}>
                              <td className="py-2 text-gray-900">{r.name}</td>
                              <td className="py-2 text-gray-600">{r.email || '-'}</td>
                              <td className="py-2 text-right text-gray-600">{r.orderCount}件</td>
                              <td className="py-2 text-right font-medium text-gray-900">{formatYen(r.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {unlinked.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">未紐付けの紹介</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                紹介者氏名だけ手入力されていて、紹介URL経由の紐付けが無いお客様です
              </p>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">紹介者（手入力）</th>
                  <th className="px-6 py-3">紹介された方</th>
                  <th className="px-6 py-3">メール</th>
                  <th className="px-6 py-3 text-right">注文件数</th>
                  <th className="px-6 py-3 text-right">購入金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unlinked.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-3 text-gray-900">{u.referrerName}</td>
                    <td className="px-6 py-3 text-gray-900">{u.name}</td>
                    <td className="px-6 py-3 text-gray-600">{u.email || '-'}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{u.orderCount}件</td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900">{formatYen(u.total)}</td>
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

export default ReferralSales;
