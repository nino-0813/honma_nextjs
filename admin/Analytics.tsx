'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { IconBarChart, IconPackage, IconShoppingCart, IconTrendingUp } from '@/components/Icons';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    productCount: 0,
    recentOrderCount: 0,
  });

  useEffect(() => {
    const load = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const [ordersRes, productsRes] = await Promise.all([
          supabase.from('orders').select('id, total, payment_status'),
          supabase.from('products').select('id', { count: 'exact', head: true }),
        ]);
        const orders = (ordersRes.data || []) as { id: string; total: number; payment_status: string }[];
        const paidOrders = orders.filter((o) => o.payment_status === 'paid');
        setStats({
          totalOrders: orders.length,
          totalRevenue: paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
          productCount: productsRes.count ?? 0,
          recentOrderCount: orders.length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ストア分析</h1>
        <p className="text-sm text-gray-500 mt-1">売上・注文の概要</p>
      </div>
      {loading ? (
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">総注文数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <IconTrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">売上（支払済み）</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ¥{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <IconPackage className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">登録商品数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.productCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <IconBarChart className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">注文（全体）</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.recentOrderCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mt-8">
        <Link href="/admin/orders" className="text-sm text-gray-600 hover:text-gray-900">
          注文一覧を見る →
        </Link>
      </div>
    </>
  );
};

export default Analytics;
