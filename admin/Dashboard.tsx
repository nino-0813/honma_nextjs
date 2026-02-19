'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { IconPackage, IconCheckCircle, IconShoppingCart, IconUsers } from '@/components/Icons';
import { FadeInImage } from '@/components/UI';

type OrderRow = {
  id: string;
  order_number: string | null;
  total: number;
  payment_status: string;
  created_at: string;
};

type ProductRow = {
  id: string;
  title: string;
  price: number;
  image: string | null;
  images: string[] | null;
};

type DashboardStats = {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  latestProduct: ProductRow | null;
  recentOrders: OrderRow[];
};

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('過去30日間');
  const [channel, setChannel] = useState('すべてのチャネル');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    latestProduct: null,
    recentOrders: [],
  });

  useEffect(() => {
    const load = async () => {
      const client = supabase;
      if (!client) {
        setLoading(false);
        return;
      }
      try {
        const now = new Date();
        let startDate: Date;
        if (timeRange === '過去7日間') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (timeRange === '今日') {
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
        } else {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const [ordersRes, productsRes, customersRes] = await Promise.all([
          client
            .from('orders')
            .select('id, order_number, total, payment_status, created_at')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false }),
          client
            .from('products')
            .select('id, title, price, image, images')
            .order('created_at', { ascending: false }),
          client.from('profiles').select('id').not('email', 'is', null),
        ]);

        const ordersData = (ordersRes.data || []) as OrderRow[];
        const productsData = (productsRes.data || []) as ProductRow[];
        const totalSales = ordersData.reduce(
          (sum, o) => sum + (o.payment_status === 'paid' ? Number(o.total) : 0),
          0
        );
        const totalOrders = ordersData.length;
        const totalProducts = productsData.length;
        const totalCustomers = customersRes.data?.length ?? 0;
        const latestProduct = productsData[0] ?? null;
        const recentOrders = ordersData.slice(0, 5);

        setStats({
          totalSales,
          totalOrders,
          totalProducts,
          totalCustomers,
          latestProduct,
          recentOrders,
        });
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timeRange]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">ホーム</h1>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
            >
              <option value="過去30日間">過去30日間</option>
              <option value="過去7日間">過去7日間</option>
              <option value="今日">今日</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
            >
              <option value="すべてのチャネル">すべてのチャネル</option>
              <option value="オンラインストア">オンラインストア</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="bg-white border border-gray-100 rounded-lg px-6 py-5 mb-6 shadow-sm">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">販売合計</p>
                <p className="text-xl font-semibold text-gray-900">
                  ¥{stats.totalSales.toLocaleString()}
                </p>
              </div>
              <IconShoppingCart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">注文数</p>
                <p className="text-xl font-semibold text-gray-900">{stats.totalOrders}</p>
              </div>
              <IconPackage className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">商品数</p>
                <p className="text-xl font-semibold text-gray-900">{stats.totalProducts}</p>
              </div>
              <IconPackage className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">顧客数</p>
                <p className="text-xl font-semibold text-gray-900">{stats.totalCustomers}</p>
              </div>
              <IconUsers className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Store Status */}
        <div className="bg-white border border-gray-100 rounded-lg p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-gray-700 font-medium">ストアは営業中です</span>
          </div>
          <Link href="/" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm">
            表示
          </Link>
        </div>

        {/* Product and Store Preview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 text-sm">最新の商品</h3>
              <Link href="/admin/products" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                すべて見る
              </Link>
            </div>

            {loading ? (
              <div className="animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            ) : stats.latestProduct ? (
              <>
                <div className="relative mb-5 rounded-lg overflow-hidden bg-gray-50">
                  <FadeInImage
                    src={
                      stats.latestProduct.images?.length
                        ? stats.latestProduct.images[0]
                        : stats.latestProduct.image || ''
                    }
                    alt={stats.latestProduct.title}
                    className="w-full aspect-square object-cover"
                  />
                </div>
                <div className="mb-5">
                  <h4 className="text-sm font-medium text-gray-900 mb-1.5 line-clamp-2">
                    {stats.latestProduct.title}
                  </h4>
                  <p className="text-lg font-semibold text-gray-900">
                    ¥{stats.latestProduct.price.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <IconCheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium">商品を追加済み</span>
                  </div>
                  <Link href="/admin/products/new" className="text-sm text-gray-700 hover:text-black font-medium transition-colors">
                    さらに追加する
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm mb-4">商品がまだ登録されていません</p>
                <Link href="/admin/products/new" className="inline-block bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                  最初の商品を追加
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 text-sm">最近の注文</h3>
              <Link href="/admin/orders" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                すべて見る
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : stats.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.order_number || `注文 #${order.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ¥{Number(order.total).toLocaleString()}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                          order.payment_status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.payment_status === 'paid' ? '支払済み' : '未払い'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">まだ注文がありません</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/products/new" className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:border-gray-300 transition-colors block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <IconPackage className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">商品を追加</h4>
                <p className="text-xs text-gray-500 mt-0.5">新しい商品を登録</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/orders" className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:border-gray-300 transition-colors block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <IconShoppingCart className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">注文を確認</h4>
                <p className="text-xs text-gray-500 mt-0.5">注文を管理</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/customers" className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:border-gray-300 transition-colors block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <IconUsers className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">顧客を管理</h4>
                <p className="text-xs text-gray-500 mt-0.5">顧客情報を確認</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
