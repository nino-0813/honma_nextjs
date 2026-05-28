'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FadeInImage } from '@/components/UI';

interface OrderDetailData {
  id: string;
  order_number: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  billing_postal_code?: string | null;
  billing_prefecture?: string | null;
  billing_city?: string | null;
  billing_address?: string | null;
  billing_building?: string | null;
  billing_country?: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string;
  shipping_first_name?: string | null;
  shipping_last_name?: string | null;
  shipping_phone?: string | null;
  shipping_method: string | null;
  shipping_carrier?: string | null;
  tracking_number?: string | null;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number | null;
  total: number;
  payment_status: string;
  payment_method: string | null;
  paid_at: string | null;
  order_status: string;
  notes: string | null;
  delivery_time_slot?: string | null;
  created_at: string;
  updated_at?: string | null;
  order_items: Array<{
    id: string;
    product_id: string;
    product_title: string;
    product_price: number;
    product_image: string | null;
    quantity: number;
    line_total: number;
    variant: string | null;
    selected_options: any;
  }>;
}

const OrderDetail = () => {
  const params = useParams<{ orderId: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!supabase || !params?.orderId) {
        setError('注文IDが指定されていません');
        setLoading(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError('ログインが必要です');
          setLoading(false);
          return;
        }

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(
            `
            *,
            order_items (
              id,
              product_id,
              product_title,
              product_price,
              product_image,
              quantity,
              line_total,
              variant,
              selected_options
            )
          `
          )
          .eq('id', params.orderId)
          .eq('auth_user_id', session.user.id)
          .single();

        if (orderError) {
          console.error('注文詳細取得エラー:', orderError);
          setError('注文詳細の取得に失敗しました');
          setLoading(false);
          return;
        }

        if (!orderData) {
          setError('注文が見つかりませんでした');
          setLoading(false);
          return;
        }

        setOrder(orderData as OrderDetailData);
      } catch (err) {
        console.error('注文詳細取得エラー:', err);
        setError('注文詳細の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [params?.orderId]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateTime = formatDate;

  const formatCountryName = (country: string | null | undefined) => {
    const c = (country || '').toUpperCase();
    if (!c) return '日本';
    if (c === 'JP' || c === 'JPN' || c === 'JAPAN') return '日本';
    return country || '日本';
  };

  const formatBillingAddressLine = (o: OrderDetailData) => {
    const parts = [o.billing_prefecture, o.billing_city, o.billing_address].filter(Boolean);
    const base = parts.join('') || null;
    const withBuilding = [base, o.billing_building].filter(Boolean).join(' ') || null;
    return withBuilding;
  };

  const getOrderStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: '支払い前',
      processing: '発送前',
      shipped: '発送済み',
      delivered: '発送済み',
      cancelled: 'キャンセル',
    };
    return statusMap[status] || status;
  };

  const getOrderStatusBadgeClass = (status: string) => {
    if (status === 'cancelled') return 'bg-gray-100 text-gray-700';
    if (status === 'shipped' || status === 'delivered') return 'bg-indigo-100 text-indigo-700';
    if (status === 'processing') return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-800';
  };

  const getPaymentStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: '支払い待ち',
      paid: '支払い済み',
      failed: '支払い失敗',
      refunded: '返金済み',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
            <p className="text-sm text-gray-500">読み込み中...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <p className="text-red-600 mb-4">{error || '注文が見つかりませんでした'}</p>
            <Link href="/mypage?tab=orders" className="text-sm text-primary hover:underline">
              購入履歴に戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/mypage?tab=orders"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            購入履歴に戻る
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-serif font-medium text-gray-900 mb-2">注文詳細</h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-500">注文番号</p>
              <p className="text-lg font-semibold text-gray-900">
                {order.order_number || order.id.slice(0, 8)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  order.payment_status === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : order.payment_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                }`}
              >
                {getPaymentStatusText(order.payment_status)}
              </span>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${getOrderStatusBadgeClass(
                  order.order_status
                )}`}
              >
                {getOrderStatusText(order.order_status)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">注文サマリー</h2>
            <div className="space-y-4">
              {order.order_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                >
                  <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded overflow-hidden">
                    {item.product_image ? (
                      <FadeInImage
                        src={item.product_image}
                        alt={item.product_title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{item.product_title}</h3>
                    <p className="text-xs text-gray-500 mb-2">数量: {item.quantity}</p>
                    <p className="text-sm font-medium text-gray-900">
                      ¥{item.product_price.toLocaleString()} × {item.quantity} = ¥
                      {item.line_total.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">小計</span>
                <span className="text-gray-900">¥{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">配送</span>
                <span className="text-gray-900">
                  {order.shipping_cost === 0 ? '無料' : `¥${order.shipping_cost.toLocaleString()}`}
                </span>
              </div>
              {order.discount_amount && order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">割引</span>
                  <span className="text-red-600">-¥{order.discount_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                <span className="text-gray-900">合計</span>
                <span className="text-gray-900">¥{order.total.toLocaleString()}</span>
              </div>
              {order.payment_status === 'paid' && order.paid_at && (
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-gray-600">支払い済み</span>
                  <span className="text-green-600">-¥{order.total.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {order.order_items && order.order_items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">配送状況</h2>
              <div className="space-y-4">
                {order.order_items.map((item, index) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden">
                      {item.product_image ? (
                        <FadeInImage
                          src={item.product_image}
                          alt={item.product_title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-xs">{index + 1}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {order.order_status === 'shipped' || order.order_status === 'delivered' ? (
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        ) : order.order_status === 'processing' ? (
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        ) : order.order_status === 'cancelled' ? (
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        )}
                        <span
                          className={`text-sm font-medium ${
                            order.order_status === 'cancelled'
                              ? 'text-gray-700'
                              : order.order_status === 'shipped' || order.order_status === 'delivered'
                                ? 'text-indigo-700'
                                : order.order_status === 'processing'
                                  ? 'text-blue-700'
                                  : 'text-amber-800'
                          }`}
                        >
                          {getOrderStatusText(order.order_status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(
                          order.order_status === 'cancelled'
                            ? order.updated_at || order.created_at
                            : order.order_status === 'shipped' || order.order_status === 'delivered'
                              ? order.updated_at || order.created_at
                              : order.created_at
                        )}
                      </p>
                      {(order.order_status === 'shipped' || order.order_status === 'delivered') &&
                        (order.shipping_carrier || order.tracking_number) && (
                          <div className="mt-2 text-xs text-gray-700 space-y-1">
                            {order.shipping_carrier && (
                              <div>
                                配送会社: <span className="font-medium text-gray-900">{order.shipping_carrier}</span>
                              </div>
                            )}
                            {order.tracking_number && (
                              <div>
                                発送番号: <span className="font-medium text-gray-900">{order.tracking_number}</span>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">注文情報</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">連絡先情報</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    {order.last_name} {order.first_name}
                  </p>
                  <p>{order.email}</p>
                  {order.phone && <p>{order.phone}</p>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">配送先住所</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{formatCountryName(order.shipping_country)}</p>
                  {order.shipping_postal_code && <p>〒{order.shipping_postal_code}</p>}
                  {order.shipping_address && <p>{order.shipping_address}</p>}
                  <p>
                    {order.shipping_last_name || order.last_name} {order.shipping_first_name || order.first_name}様
                  </p>
                  {(order.shipping_phone || order.phone) && <p>{order.shipping_phone || order.phone}</p>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">決済</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {order.payment_method ? <p>{order.payment_method}</p> : <p>クレジットカード</p>}
                  {order.paid_at && (
                    <>
                      <p>¥{order.total.toLocaleString()} JPY</p>
                      <p>{formatDateTime(order.paid_at)}</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">請求先住所</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{formatCountryName(order.billing_country || order.shipping_country)}</p>
                  {(order.billing_postal_code || order.shipping_postal_code) && (
                    <p>〒{order.billing_postal_code || order.shipping_postal_code}</p>
                  )}
                  {formatBillingAddressLine(order) && <p>{formatBillingAddressLine(order)}</p>}
                  {!order.billing_postal_code && !order.billing_city && !order.billing_address && (
                    <>{order.shipping_address && <p>{order.shipping_address}</p>}</>
                  )}
                  <p>
                    {order.last_name} {order.first_name}様
                  </p>
                  {order.phone && <p>{order.phone}</p>}
                </div>
              </div>

              {/* 備考 */}
              {order.notes && order.notes.trim() && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">備考</h3>
                  <div className="bg-white border border-gray-200 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {order.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default OrderDetail;
