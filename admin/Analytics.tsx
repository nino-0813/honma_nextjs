'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  IconBarChart,
  IconPackage,
  IconShoppingCart,
  IconTrendingUp,
  IconUsers,
} from '@/components/Icons';

type OrderRow = {
  id: string;
  total: number;
  payment_status: string;
  email: string;
  created_at: string;
};

type OrderItemRow = {
  order_id: string;
  product_id: string;
  product_title: string;
  line_total: number;
};

const PERIODS = [
  { value: '7', label: '過去7日間' },
  { value: '30', label: '過去30日間' },
  { value: '90', label: '過去90日間' },
  { value: '365', label: '過去1年間' },
] as const;

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState<string>('30');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [ordersRes, itemsRes, productsRes] = await Promise.all([
          supabase.from('orders').select('id, total, payment_status, email, created_at').order('created_at', { ascending: false }),
          supabase.from('order_items').select('order_id, product_id, product_title, line_total'),
          supabase.from('products').select('id', { count: 'exact', head: true }),
        ]);
        setOrders((ordersRes.data || []) as OrderRow[]);
        setOrderItems((itemsRes.data || []) as OrderItemRow[]);
        setProductCount(productsRes.count ?? 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const days = Number(periodDays) || 30;
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { startDate: start, endDate: end };
  }, [days]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= startDate && d <= endDate;
    });
  }, [orders, startDate, endDate]);

  const paidOrders = useMemo(() => filteredOrders.filter((o) => o.payment_status === 'paid'), [filteredOrders]);

  const metrics = useMemo(() => {
    const revenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const orderCount = paidOrders.length;
    const avgOrder = orderCount > 0 ? Math.round(revenue / orderCount) : 0;
    const uniqueCustomers = new Set(paidOrders.map((o) => o.email)).size;
    return {
      orderCount,
      revenue,
      avgOrder,
      uniqueCustomers,
    };
  }, [paidOrders]);

  const topProducts = useMemo(() => {
    const paidOrderIds = new Set(paidOrders.map((o) => o.id));
    const itemsInPeriod = orderItems.filter((item) => paidOrderIds.has(item.order_id));
    const byProduct = new Map<string, { name: string; sales: number; orders: number }>();
    itemsInPeriod.forEach((item) => {
      const key = item.product_id;
      if (byProduct.has(key)) {
        const p = byProduct.get(key)!;
        p.sales += item.line_total;
        p.orders += 1;
      } else {
        byProduct.set(key, { name: item.product_title, sales: item.line_total, orders: 1 });
      }
    });
    return Array.from(byProduct.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [orderItems, paidOrders]);

  const periodLabel = PERIODS.find((p) => p.value === periodDays)?.label ?? '過去30日間';

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ストア分析</h1>
          <p className="text-sm text-gray-500 mt-1">期間を選んで売上・注文の傾向を確認できます</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">期間:</span>
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* この期間のサマリー */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm text-blue-900 font-medium mb-1">📊 {periodLabel}のサマリー</p>
            <p className="text-xs text-blue-800">
              支払い済みの注文のみ集計しています。注文数・売上・平均注文額・お客様数が一覧で確認できます。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center">
                  <IconShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">注文数（支払済み）</p>
                  <p className="text-2xl font-semibold text-gray-900">{metrics.orderCount}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">この期間に確定した注文の件数</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-green-100 rounded-lg flex items-center justify-center">
                  <IconTrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">売上（支払済み）</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ¥{metrics.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">この期間の入金済み売上合計</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-amber-100 rounded-lg flex items-center justify-center">
                  <IconBarChart className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">平均注文額</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ¥{metrics.avgOrder.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">1件あたりの平均購入金額</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-purple-100 rounded-lg flex items-center justify-center">
                  <IconUsers className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">お客様数</p>
                  <p className="text-2xl font-semibold text-gray-900">{metrics.uniqueCustomers}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">この期間に購入した人数（メール単位）</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 人気商品 */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">人気商品トップ5（{periodLabel}）</h3>
                <p className="text-xs text-gray-500 mt-1">売上金額の多い順に表示</p>
              </div>
              <div className="p-5">
                {topProducts.length === 0 ? (
                  <div className="py-10 text-center text-gray-500 text-sm">
                    この期間の注文はまだありません
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {topProducts.map((p, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{p.orders}件の注文</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-semibold text-gray-900">¥{p.sales.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">売上</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* ストア概要 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">ストア概要</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">登録商品数</span>
                  <span className="font-semibold text-gray-900">{productCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">全期間の注文数</span>
                  <span className="font-semibold text-gray-900">{orders.length}</span>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <Link
                    href="/admin/orders"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    注文一覧を見る
                    <span className="inline-block">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Analytics;
