'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  IconChevronDown,
  IconDownload,
  IconFilter,
  IconRefreshCw,
  IconSearch,
} from '@/components/Icons';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_title: string;
  product_price: number;
  quantity: number;
  line_total: number;
}

interface Order {
  id: string;
  order_number?: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  shipping_address?: string | null;
  shipping_postal_code?: string | null;
  shipping_city?: string | null;
  shipping_first_name?: string | null;
  shipping_last_name?: string | null;
  shipping_phone?: string | null;
  delivery_time_slot?: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

type MappedStatus = 'payment_pending' | 'before_shipping' | 'shipped' | 'cancelled' | 'all';
type PaymentStatusFilter = Order['payment_status'] | 'all';

const formatYen = (n: number | null | undefined) => `¥${Number(n || 0).toLocaleString()}`;

const toCsv = (rows: Record<string, unknown>[]) => {
  const headerSet = rows.reduce<Set<string>>((set, r) => {
    Object.keys(r).forEach((k) => set.add(k));
    return set;
  }, new Set<string>());
  const headers = Array.from(headerSet);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${(s as string).replace(/"/g, '""')}"`;
    return s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
};

const downloadText = (filename: string, text: string, utf8Bom = false) => {
  const content = utf8Bom ? '\uFEFF' + text : text;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<MappedStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchOrders = async () => {
    if (!supabase) {
      setError('Supabaseが設定されていません。');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (ordersError) throw ordersError;
      setOrders((data || []) as unknown as Order[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '注文データの取得に失敗しました';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['order_status']) => {
    if (!supabase) return;
    try {
      const { error: e } = await supabase
        .from('orders')
        .update({ order_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (e) throw e;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, order_status: newStatus, updated_at: new Date().toISOString() } : o
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ステータスの更新に失敗しました';
      alert(msg);
    }
  };

  const getMappedStatus = (status: Order['order_status']): Exclude<MappedStatus, 'all'> => {
    if (status === 'cancelled') return 'cancelled';
    if (status === 'shipped' || status === 'delivered') return 'shipped';
    if (status === 'pending') return 'payment_pending';
    return 'before_shipping';
  };

  const mappedToOrderStatus = (mapped: Exclude<MappedStatus, 'all'>): Order['order_status'] => {
    switch (mapped) {
      case 'payment_pending': return 'pending';
      case 'before_shipping': return 'processing';
      case 'shipped': return 'shipped';
      case 'cancelled': return 'cancelled';
      default: return 'processing';
    }
  };

  const getStatusColor = (status: Order['order_status']) => {
    const m = getMappedStatus(status);
    switch (m) {
      case 'payment_pending': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'before_shipping': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: Order['order_status']) => {
    const m = getMappedStatus(status);
    switch (m) {
      case 'payment_pending': return '支払い前';
      case 'before_shipping': return '発送前';
      case 'shipped': return '発送済み';
      case 'cancelled': return 'キャンセル';
      default: return status;
    }
  };

  const getOrderNumber = (order: Order) => {
    if (order.order_number) return order.order_number;
    return `#${order.id.substring(0, 8).replace(/-/g, '').toUpperCase()}`;
  };

  const getCustomerName = (order: Order) => `${order.last_name || ''} ${order.first_name || ''}`.trim();

  const getItemCount = (order: Order) =>
    order.order_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((order) => {
      if (q) {
        const num = getOrderNumber(order);
        const name = getCustomerName(order);
        const productTitles = (order.order_items || []).map((it) => it.product_title).join(' ');
        const haystack = `${num} ${name} ${order.email} ${order.phone || ''} ${order.shipping_postal_code || ''} ${order.shipping_address || ''} ${order.shipping_city || ''} ${productTitles}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (statusFilter !== 'all' && getMappedStatus(order.order_status) !== statusFilter) return false;
      if (paymentFilter !== 'all' && order.payment_status !== paymentFilter) return false;
      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00.000Z`).getTime();
        if (new Date(order.created_at).getTime() < from) return false;
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999Z`).getTime();
        if (new Date(order.created_at).getTime() > to) return false;
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter, dateFrom, dateTo]);

  const stats = useMemo(
    () => ({
      payment_pending: orders.filter((o) => getMappedStatus(o.order_status) === 'payment_pending').length,
      before_shipping: orders.filter((o) => getMappedStatus(o.order_status) === 'before_shipping').length,
      shipped: orders.filter((o) => getMappedStatus(o.order_status) === 'shipped').length,
      cancelled: orders.filter((o) => getMappedStatus(o.order_status) === 'cancelled').length,
    }),
    [orders]
  );

  const allChecked = filteredOrders.length > 0 && filteredOrders.every((o) => selectedIds.has(o.id));
  const selectedCount = selectedIds.size;

  const toggleSelectAll = () => {
    if (allChecked) {
      const next = new Set(selectedIds);
      filteredOrders.forEach((o) => next.delete(o.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredOrders.forEach((o) => next.add(o.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const orderToCsvRow = (o: Order) => ({
    注文番号: getOrderNumber(o),
    注文日時: formatDateTime(o.created_at),
    ステータス: getStatusLabel(o.order_status),
    支払い: o.payment_status,
    お客様: getCustomerName(o),
    メール: o.email,
    電話: o.phone || '',
    商品数: getItemCount(o),
    小計: o.subtotal,
    送料: o.shipping_cost,
    合計: o.total,
  });

  /** 発送用CSV 1行（配送希望時間帯・発送先・注文者・購入商品） */
  const getShippingName = (o: Order) =>
    `${o.shipping_last_name ?? o.last_name ?? ''} ${o.shipping_first_name ?? o.first_name ?? ''}`.trim();
  const getShippingAddress = (o: Order) =>
    [o.shipping_city, o.shipping_address].filter(Boolean).join('') || (o.shipping_address ?? '') || '';

  const orderToShippingRow = (o: Order) => ({
    注文番号: getOrderNumber(o),
    配送希望時間帯: o.delivery_time_slot ?? '',
    発送先氏名: getShippingName(o),
    発送先電話: (o.shipping_phone ?? o.phone) ?? '',
    発送先郵便番号: o.shipping_postal_code ?? '',
    発送先住所: getShippingAddress(o),
    注文者氏名: getCustomerName(o),
    注文者電話: o.phone ?? '',
    注文者郵便番号: o.shipping_postal_code ?? '',
    注文者住所: getShippingAddress(o),
    購入商品情報: (o.order_items ?? [])
      .map((it) => `【${it.product_title}】 ${it.quantity}`)
      .join(' '),
  });

  const exportOrdersCsv = () => {
    const rows = filteredOrders.map(orderToCsvRow);
    downloadText(`orders-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows), true);
    setExportOpen(false);
  };

  const exportSelectedCsv = () => {
    const toExport = filteredOrders.filter((o) => selectedIds.has(o.id));
    if (toExport.length === 0) {
      alert('出力する注文を選択してください。');
      return;
    }
    downloadText(`orders-selected-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(toExport.map(orderToCsvRow)), true);
    setExportOpen(false);
  };

  const exportShippingCsv = (useSelected: boolean) => {
    const list = useSelected
      ? filteredOrders.filter((o) => selectedIds.has(o.id))
      : filteredOrders;
    if (useSelected && list.length === 0) {
      alert('出力する注文を選択してください。');
      return;
    }
    const rows = list.map(orderToShippingRow);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    downloadText(`shipping-${date}.csv`, toCsv(rows), true);
    setExportOpen(false);
  };

  const getPaymentBadge = (ps: Order['payment_status']) => {
    switch (ps) {
      case 'paid': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'pending': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'failed': return 'bg-red-50 text-red-800 border-red-200';
      case 'refunded': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPaymentLabel = (ps: Order['payment_status']) => {
    switch (ps) {
      case 'paid': return 'paid';
      case 'pending': return 'pending';
      case 'failed': return 'failed';
      case 'refunded': return 'refunded';
      default: return ps;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
            <p className="text-gray-500">注文データを読み込み中...</p>
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
            type="button"
            onClick={fetchOrders}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 transition-colors"
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
        <h1 className="text-xl font-semibold text-gray-900">注文管理</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchOrders}
            className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors bg-white"
          >
            <IconRefreshCw className="w-4 h-4" />
            更新
          </button>
          <div className="relative" ref={exportRef}>
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors bg-white"
            >
              <IconDownload className="w-4 h-4" />
              エクスポート
              <IconChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                {selectedCount > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={exportSelectedCsv}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100"
                    >
                      選択した注文をCSV（{selectedCount}件）
                    </button>
                    <button
                      type="button"
                      onClick={() => exportShippingCsv(true)}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100"
                    >
                      発送用CSV（選択 {selectedCount}件）
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={exportOrdersCsv}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100"
                >
                  注文一覧CSV（フィルタ適用）
                </button>
                <button
                  type="button"
                  onClick={() => exportShippingCsv(false)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                >
                  発送用CSV（フィルタ適用）
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-2 font-medium">支払い前</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.payment_pending}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-2 font-medium">発送前</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.before_shipping}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-2 font-medium">発送済み</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.shipped}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-2 font-medium">キャンセル</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.cancelled}</p>
          </div>
        </div>

        {/* 検索・フィルター・テーブル */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="注文番号 / 氏名 / メール / 電話 / 住所 / 購入した商品名 で検索"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="px-4 py-2.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors bg-white"
              >
                <IconFilter className="w-4 h-4" />
                フィルター
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">注文ステータス</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as MappedStatus)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-white text-sm"
                  >
                    <option value="all">すべて</option>
                    <option value="payment_pending">支払い前</option>
                    <option value="before_shipping">発送前</option>
                    <option value="shipped">発送済み</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">支払い</label>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value as PaymentStatusFilter)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-white text-sm"
                  >
                    <option value="all">すべて</option>
                    <option value="paid">支払済</option>
                    <option value="pending">未確定</option>
                    <option value="failed">失敗</option>
                    <option value="refunded">返金</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">開始日</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">終了日</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-white text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all' || dateFrom || dateTo
                ? '検索条件に一致する注文はありません。'
                : '注文はまだありません。'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">注文番号</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">お客様</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">注文日</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">支払い</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">ステータス</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">商品数</th>
                    <th className="px-6 py-4 text-right text-xs uppercase tracking-wider">合計</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="group hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(order.id)}
                          onChange={() => toggleSelectOne(order.id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{getOrderNumber(order)}</td>
                      <td className="px-6 py-4 text-gray-600">{getCustomerName(order)}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getPaymentBadge(order.payment_status)}`}
                        >
                          {getPaymentLabel(order.payment_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={getMappedStatus(order.order_status)}
                          onChange={(e) => {
                            const mapped = e.target.value as Exclude<MappedStatus, 'all'>;
                            updateOrderStatus(order.id, mappedToOrderStatus(mapped));
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border bg-white cursor-pointer ${getStatusColor(order.order_status)}`}
                        >
                          <option value="payment_pending">支払い前</option>
                          <option value="before_shipping">発送前</option>
                          <option value="shipped">発送済み</option>
                          <option value="cancelled">キャンセル</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{getItemCount(order)}点</td>
                      <td className="px-6 py-4 text-right font-medium">{formatYen(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredOrders.length > 0 && (
            <div className="p-5 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
              <span className="font-medium">
                {filteredOrders.length} 件を表示
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Orders;
