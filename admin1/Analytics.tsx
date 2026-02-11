import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { IconBarChart, IconTrendingUp, IconEye, IconShoppingCart, IconUsers, IconPercent } from '../../components/Icons';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('過去30日間');
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // 注文データを取得
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // 注文商品データを取得
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*');

      if (itemsError) throw itemsError;

      setOrders(ordersData || []);
      setOrderItems(itemsData || []);
    } catch (err: any) {
      console.error('データの取得に失敗しました:', err);
      setError(err.message || 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 期間を計算
  const getDateRange = () => {
    const now = new Date();
    const ranges: { [key: string]: number } = {
      '過去7日間': 7,
      '過去30日間': 30,
      '過去90日間': 90,
      '過去1年間': 365,
    };
    const days = ranges[timeRange] || 30;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    return { startDate, endDate: now };
  };

  // 期間内の注文をフィルタリング
  const filteredOrders = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, timeRange]);

  // メトリクスを計算
  const metrics = useMemo(() => {
    const paidOrders = filteredOrders.filter(o => o.payment_status === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const orderCount = paidOrders.length;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // ユニークな顧客数（メールアドレスで集計）
    const uniqueCustomers = new Set(paidOrders.map(o => o.email)).size;

    // 仮のセッション数と訪問者数（実際には別途トラッキングが必要）
    const sessions = Math.round(uniqueCustomers * 1.4); // 仮の計算
    const visitors = uniqueCustomers;

    // コンバージョン率（仮の計算、実際にはセッション数が必要）
    const conversionRate = sessions > 0 ? (orderCount / sessions) * 100 : 0;

    return {
      sessions,
      sessionsChange: 0, // 前期間との比較は実装していない
      visitors,
      visitorsChange: 0,
      orders: orderCount,
      ordersChange: 0,
      conversionRate: Math.round(conversionRate * 10) / 10,
      conversionRateChange: 0,
      revenue: totalRevenue,
      revenueChange: 0,
      averageOrderValue: Math.round(averageOrderValue),
      averageOrderValueChange: 0,
    };
  }, [filteredOrders]);

  // 人気商品を集計
  const topProducts = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    const filteredItems = orderItems.filter(item => {
      const order = orders.find(o => o.id === item.order_id);
      if (!order || order.payment_status !== 'paid') return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const productMap = new Map<string, { name: string; sales: number; orders: number }>();

    filteredItems.forEach(item => {
      const key = item.product_id;
      if (productMap.has(key)) {
        const product = productMap.get(key)!;
        product.sales += item.line_total;
        product.orders += 1;
      } else {
        productMap.set(key, {
          name: item.product_title,
          sales: item.line_total,
          orders: 1,
        });
      }
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 3);
  }, [orderItems, orders, timeRange]);

  const MetricCard = ({ icon: Icon, label, value, change, iconColor = 'bg-gray-100', iconTextColor = 'text-gray-700' }: { 
    icon: any, 
    label: string, 
    value: string | number, 
    change?: number,
    iconColor?: string,
    iconTextColor?: string
  }) => (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 ${iconColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconTextColor}`} />
        </div>
        {change !== undefined && change !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            <IconTrendingUp className={`w-3 h-3 ${change < 0 ? 'rotate-180' : ''}`} />
            <span>{change >= 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-1.5 font-medium">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">データを読み込み中...</p>
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
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">ストア分析</h1>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-lg border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
          <label className="text-sm font-medium text-gray-700">期間:</label>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
          >
            <option>過去7日間</option>
            <option>過去30日間</option>
            <option>過去90日間</option>
            <option>過去1年間</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard 
            icon={IconEye} 
            label="セッション数" 
            value={metrics.sessions} 
            change={metrics.sessionsChange}
            iconColor="bg-gray-100"
            iconTextColor="text-gray-700"
          />
          <MetricCard 
            icon={IconUsers} 
            label="訪問者数" 
            value={metrics.visitors} 
            change={metrics.visitorsChange}
            iconColor="bg-gray-100"
            iconTextColor="text-gray-700"
          />
          <MetricCard 
            icon={IconShoppingCart} 
            label="注文数" 
            value={metrics.orders} 
            change={metrics.ordersChange}
            iconColor="bg-gray-100"
            iconTextColor="text-gray-700"
          />
          <MetricCard 
            icon={IconPercent} 
            label="コンバージョン率" 
            value={`${metrics.conversionRate}%`} 
            change={metrics.conversionRateChange}
            iconColor="bg-gray-100"
            iconTextColor="text-gray-700"
          />
          <MetricCard 
            icon={IconTrendingUp} 
            label="総売上" 
            value={`¥${metrics.revenue.toLocaleString()}`} 
            change={metrics.revenueChange}
            iconColor="bg-gray-100"
            iconTextColor="text-gray-700"
          />
          <MetricCard 
            icon={IconBarChart} 
            label="平均注文額" 
            value={`¥${metrics.averageOrderValue.toLocaleString()}`} 
            change={metrics.averageOrderValueChange}
            iconColor="bg-gray-100"
            iconTextColor="text-gray-700"
          />
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">人気商品トップ3</h3>
          </div>
          <div className="p-5 space-y-3">
            {topProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">この期間に注文された商品はありません。</p>
              </div>
            ) : (
              topProducts.map((product, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{product.orders}件の注文</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">¥{product.sales.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">売上</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <IconBarChart className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-sm font-medium">グラフ表示エリア</p>
              <p className="text-xs mt-1 text-gray-400">チャートライブラリを統合して表示</p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Analytics;
