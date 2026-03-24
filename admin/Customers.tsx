'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  IconSearch,
  IconFilter,
  IconMore,
  IconUsers,
  IconCheckCircle,
  IconTrendingUp,
} from '@/components/Icons';

interface Customer {
  email: string;
  name: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
  status: 'active' | 'inactive';
}

const Customers = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!supabase) {
      setError('Supabaseが設定されていません。');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [ordersResult, profilesResult] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (profilesResult.error) {
        console.warn('プロフィールデータが取得できませんでした。RLSポリシーを確認してください。', profilesResult.error);
      }

      const mergedOrders = [...(ordersResult.data || [])];
      const profiles = profilesResult.data || [];

      const profileOrders = profiles
        .filter((profile: any) => Boolean(profile.email))
        .map((profile: any) => {
          const existingOrder = ordersResult.data?.find(
            (order: any) =>
              (order.email && order.email === profile.email) ||
              (order.auth_user_id && profile.id === order.auth_user_id)
          );

          if (existingOrder) return existingOrder;

          return {
            id: `profile-${profile.id}`,
            email: profile.email,
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            created_at: profile.created_at,
            total: 0,
            auth_user_id: profile.id,
          };
        });

      profileOrders.forEach((profileOrder: any) => {
        if (
          !mergedOrders.some(
            (o: any) =>
              (o.email && o.email === profileOrder.email) ||
              o.id === profileOrder.id ||
              (o.auth_user_id &&
                profileOrder.auth_user_id &&
                o.auth_user_id === profileOrder.auth_user_id)
          )
        ) {
          mergedOrders.push(profileOrder);
        }
      });

      setOrders(mergedOrders);
    } catch (err: any) {
      console.error('データ取得に失敗しました:', err);
      setError(err.message || 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const customers = useMemo(() => {
    const customerMap = new Map<string, Customer>();

    orders.forEach((order) => {
      const email = order.email || (order.auth_user_id ? `user-${order.auth_user_id}` : 'unknown');
      const name =
        order.last_name && order.first_name
          ? `${order.last_name} ${order.first_name}`.trim()
          : order.email || (order.auth_user_id ? `ユーザー ${order.auth_user_id.slice(0, 8)}` : '未登録ユーザー');
      const orderDate = new Date(order.created_at);
      const total = order.total || 0;
      const isPaid = order.payment_status === 'paid';
      const hasOrder = !order.id?.startsWith('profile-') && total > 0 && isPaid;

      if (customerMap.has(email)) {
        const customer = customerMap.get(email)!;
        if (hasOrder) {
          customer.orders += 1;
          customer.totalSpent += total;
          if (!customer.lastOrder || orderDate > new Date(customer.lastOrder)) {
            customer.lastOrder = order.created_at;
          }
        }
      } else {
        customerMap.set(email, {
          email,
          name,
          orders: hasOrder ? 1 : 0,
          totalSpent: hasOrder ? total : 0,
          lastOrder: hasOrder ? order.created_at : '',
          status: 'inactive',
        });
      }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return Array.from(customerMap.values())
      .map((customer) => ({
        ...customer,
        status:
          customer.lastOrder && new Date(customer.lastOrder) >= thirtyDaysAgo
            ? ('active' as const)
            : ('inactive' as const),
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const stats = useMemo(
    () => ({
      total: customers.length,
      active: customers.filter((c) => c.status === 'active').length,
      totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    }),
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
            <p className="text-gray-500">顧客データを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
        <div className="text-center">
          <p className="text-red-500 mb-2">エラーが発生しました</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-gray-800 transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">顧客管理</h1>
        <button className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors">
          <IconFilter className="w-4 h-4" />
          エクスポート
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <IconUsers className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">総顧客数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <IconCheckCircle className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">アクティブ顧客</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <IconTrendingUp className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">総売上</p>
                <p className="text-2xl font-semibold text-gray-900">¥{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex gap-4">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="お客様名、メールアドレスで検索..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all bg-white"
              />
            </div>
            <button className="px-4 py-2.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <IconFilter className="w-4 h-4" />
              フィルター
            </button>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {searchQuery ? '検索条件に一致する顧客はありません。' : '顧客データはまだありません。'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">お客様</th>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">メールアドレス</th>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">注文数</th>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">総購入額</th>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">最終注文</th>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">ステータス</th>
                      <th className="px-6 py-4 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.email} className="group hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/customers/${encodeURIComponent(customer.email)}`}
                            className="font-medium text-gray-900 hover:text-primary transition-colors"
                          >
                            {customer.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{customer.email}</td>
                        <td className="px-6 py-4 text-gray-600">{customer.orders}件</td>
                        <td className="px-6 py-4 font-medium">¥{customer.totalSpent.toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString('ja-JP') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                              customer.status === 'active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {customer.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                            {customer.status === 'active' ? 'アクティブ' : '非アクティブ'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconMore className="w-4 h-4 text-gray-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-5 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                <span className="font-medium">{filteredCustomers.length} 件中 1-{filteredCustomers.length} 件を表示</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium" disabled>
                    前へ
                  </button>
                  <button className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium" disabled>
                    次へ
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Customers;
