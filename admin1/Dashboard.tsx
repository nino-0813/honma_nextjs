import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconEdit, IconTrendingUp, IconCheckCircle, IconPackage, IconUsers, IconShoppingCart } from '../../components/Icons';
import { FadeInImage } from '../../components/UI';
import { supabase, convertDatabaseProductToProduct, DatabaseProduct } from '../../lib/supabase';
import { Product } from '../../types';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: any[];
  latestProduct: Product | null;
}

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('過去30日間');
  const [channel, setChannel] = useState('すべてのチャネル');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    recentOrders: [],
    latestProduct: null,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // 日付範囲を計算
      const now = new Date();
      let startDate: Date;
      if (timeRange === '過去7日間') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === '今日') {
        startDate = new Date(now.setHours(0, 0, 0, 0));
      } else {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // 注文データを取得
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total, created_at, payment_status')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('注文データ取得エラー:', ordersError);
      }

      // 商品データを取得
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('商品データ取得エラー:', productsError);
      }

      // 顧客データを取得
      const { data: customersData, error: customersError } = await supabase
        .from('profiles')
        .select('id')
        .not('email', 'is', null);

      if (customersError) {
        console.error('顧客データ取得エラー:', customersError);
      }

      // 統計を計算
      const totalSales = ordersData?.reduce((sum, order) => {
        return sum + (order.payment_status === 'paid' ? order.total : 0);
      }, 0) || 0;

      const totalOrders = ordersData?.length || 0;
      const totalProducts = productsData?.length || 0;
      const totalCustomers = customersData?.length || 0;

      // 最新の商品
      const latestProduct = productsData && productsData.length > 0
        ? convertDatabaseProductToProduct(productsData[0] as DatabaseProduct)
        : null;

      // 最近の注文（最大5件）
      const recentOrders = ordersData?.slice(0, 5) || [];

      setStats({
        totalSales,
        totalOrders,
        totalProducts,
        totalCustomers,
        recentOrders,
        latestProduct,
      });
    } catch (error) {
      console.error('ダッシュボードデータ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const conversionRate = stats.totalOrders > 0 
    ? ((stats.totalOrders / Math.max(stats.totalProducts, 1)) * 100).toFixed(1)
    : '0';

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">ホーム</h1>
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
              <option>過去30日間</option>
              <option>過去7日間</option>
              <option>今日</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
            >
              <option>すべてのチャネル</option>
              <option>オンラインストア</option>
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
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">販売合計</p>
                <p className="text-xl font-semibold text-gray-900">¥{stats.totalSales.toLocaleString()}</p>
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
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700 font-medium">ストアは営業中です</span>
          </div>
          <Link to="/">
            <a className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm">
              表示
            </a>
          </Link>
        </div>

        {/* Product and Store Preview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest Product Card */}
          <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 text-sm">最新の商品</h3>
              <Link to="/admin/products">
                <a className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                  すべて見る
                </a>
              </Link>
            </div>
            
            {loading ? (
              <div className="animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ) : stats.latestProduct ? (
              <>
                <div className="relative mb-5 rounded-lg overflow-hidden bg-gray-50">
                  <FadeInImage 
                    src={stats.latestProduct.images && stats.latestProduct.images.length > 0 
                      ? stats.latestProduct.images[0] 
                      : stats.latestProduct.image} 
                    alt={stats.latestProduct.title}
                    className="w-full aspect-square object-cover"
                  />
                </div>
                
                <div className="mb-5">
                  <h4 className="text-sm font-medium text-gray-900 mb-1.5 line-clamp-2">
                    {stats.latestProduct.title}
                  </h4>
                  <p className="text-lg font-semibold text-gray-900">¥{stats.latestProduct.price.toLocaleString()}</p>
                </div>
                
                <div className="flex items-center gap-4 pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <IconCheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium">商品を追加済み</span>
                  </div>
                  <Link to="/admin/products/new">
                    <a className="text-sm text-gray-700 hover:text-black font-medium transition-colors">
                      さらに追加する
                    </a>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm mb-4">商品がまだ登録されていません</p>
                <Link to="/admin/products/new">
                  <a className="inline-block bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                    最初の商品を追加
                  </a>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Orders Card */}
          <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 text-sm">最近の注文</h3>
              <Link to="/admin/orders">
                <a className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                  すべて見る
                </a>
              </Link>
            </div>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : stats.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
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
                        ¥{order.total.toLocaleString()}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                        order.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
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
          <Link to="/admin/products/new">
            <a className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <IconPackage className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">商品を追加</h4>
                  <p className="text-xs text-gray-500 mt-0.5">新しい商品を登録</p>
                </div>
              </div>
            </a>
          </Link>

          <Link to="/admin/orders">
            <a className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <IconShoppingCart className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">注文を確認</h4>
                  <p className="text-xs text-gray-500 mt-0.5">注文を管理</p>
                </div>
              </div>
            </a>
          </Link>

          <Link to="/admin/customers">
            <a className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <IconUsers className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">顧客を管理</h4>
                  <p className="text-xs text-gray-500 mt-0.5">顧客情報を確認</p>
                </div>
              </div>
            </a>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
