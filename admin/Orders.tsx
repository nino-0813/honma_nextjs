'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  IconChevronDown,
  IconClose,
  IconDownload,
  IconFilter,
  IconMore,
  IconRefreshCw,
  IconSearch,
} from '@/components/Icons';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_title: string;
  product_price: number;
  product_image: string | null;
  quantity: number;
  line_total: number;
  variant?: string | null;
  selected_options?: any;
}

interface Order {
  id: string;
  order_number?: string | null;
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
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_first_name?: string | null;
  shipping_last_name?: string | null;
  shipping_phone?: string | null;
  shipping_method: string;
  shipping_carrier?: string | null;
  tracking_number?: string | null;
  subtotal: number;
  shipping_cost: number;
  discount_amount?: number | null;
  coupon_id?: string | null;
  total: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_intent_id: string | null;
  payment_method: string | null;
  paid_at?: string | null;
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  delivery_time_slot?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

type PaymentStatusFilter = Order['payment_status'] | 'all';
type MappedStatus = 'payment_pending' | 'before_shipping' | 'shipped' | 'cancelled' | 'all';

type ShippingMethodBreakdown = {
  shipping_method_id?: string;
  cost?: number;
  items?: string;
  breakdown?: string | null;
};

type EstimatedOrderLine = {
  title: string;
  variant?: string;
  qty: number;
  estimated: boolean;
};

const formatYen = (n: number | null | undefined) => `¥${Number(n || 0).toLocaleString()}`;
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatCountryName = (country: string | null | undefined) => {
  const c = (country || '').toUpperCase();
  if (!c) return '日本';
  if (c === 'JP' || c === 'JPN' || c === 'JAPAN') return '日本';
  return country || '日本';
};

const formatBillingAddressLine = (o: Order) => {
  const parts = [o.billing_prefecture, o.billing_city, o.billing_address].filter(Boolean);
  const base = parts.join('') || null;
  return [base, o.billing_building].filter(Boolean).join(' ') || null;
};

const getShippingDisplayName = (o: Order) => {
  const ln = o.shipping_last_name || o.last_name;
  const fn = o.shipping_first_name || o.first_name;
  return `${ln || ''} ${fn || ''}`.trim() || `${o.last_name} ${o.first_name}`.trim();
};

const getShippingDisplayPhone = (o: Order) => o.shipping_phone || o.phone || null;

const safeParseShippingMethod = (value: string | null | undefined): ShippingMethodBreakdown[] | null => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!(trimmed.startsWith('[') || trimmed.startsWith('{'))) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed as ShippingMethodBreakdown[];
    if (parsed && typeof parsed === 'object') return [parsed as ShippingMethodBreakdown];
    return null;
  } catch {
    return null;
  }
};

const parseItemsFromShippingText = (text: string): Array<{ title: string; variant?: string; qty: number }> => {
  const chunks = text
    .split('/')
    .map((v) => v.trim())
    .filter(Boolean);
  const out: Array<{ title: string; variant?: string; qty: number }> = [];

  for (const chunk of chunks) {
    const withVariant = chunk.match(/^(.+?)（(.+?)）\s*[×x]\s*(\d+)$/i);
    if (withVariant) {
      out.push({
        title: withVariant[1].trim(),
        variant: withVariant[2].trim(),
        qty: Number(withVariant[3]) || 0,
      });
      continue;
    }

    const withoutVariant = chunk.match(/^(.+?)\s*[×x]\s*(\d+)$/i);
    if (withoutVariant) {
      out.push({
        title: withoutVariant[1].trim(),
        qty: Number(withoutVariant[2]) || 0,
      });
    }
  }

  return out.filter((v) => v.title && v.qty > 0);
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
  const blob = new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
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
  const [bulkStatus, setBulkStatus] = useState<Exclude<MappedStatus, 'all'>>('before_shipping');
  const [exportOpen, setExportOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [couponInfoById, setCouponInfoById] = useState<Record<string, { code: string | null; name: string | null }>>({});
  const [shippingEdits, setShippingEdits] = useState<Record<string, { carrier: string; tracking: string }>>({});
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

  useEffect(() => {
    const loadCoupon = async () => {
      const client = supabase;
      const couponId = detailOrder?.coupon_id || null;
      if (!client || !couponId || couponInfoById[couponId]) return;

      try {
        const { data, error } = await client.from('coupons').select('id, code, name').eq('id', couponId).single();
        if (error) throw error;
        setCouponInfoById((prev) => ({
          ...prev,
          [couponId]: { code: (data as any)?.code ?? null, name: (data as any)?.name ?? null },
        }));
      } catch (e) {
        console.warn('[Orders] coupon fetch failed (ignored):', e);
        setCouponInfoById((prev) => ({ ...prev, [couponId]: { code: null, name: null } }));
      }
    };
    loadCoupon();
  }, [detailOrder?.coupon_id, couponInfoById]);

  const fetchOrders = async () => {
    const client = supabase;
    if (!client) {
      setError('Supabaseが設定されていません。');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data: ordersData, error: ordersError } = await client
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders((ordersData || []) as unknown as Order[]);
    } catch (err: any) {
      console.error('注文データの取得に失敗しました:', err);
      setError(err.message || '注文データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['order_status']) => {
    const client = supabase;
    if (!client) {
      alert('Supabaseが利用できません。');
      return;
    }

    try {
      const now = new Date().toISOString();
      const { error } = await client
        .from('orders')
        .update({ order_status: newStatus, updated_at: now })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus, updated_at: now } : o)));
    } catch (err: any) {
      console.error('ステータスの更新に失敗しました:', err);
      alert(`ステータスの更新に失敗しました: ${err.message}`);
    }
  };

  const getShippingEdit = (order: Order) => {
    const current = shippingEdits[order.id];
    return {
      carrier: current?.carrier ?? (order.shipping_carrier || ''),
      tracking: current?.tracking ?? (order.tracking_number || ''),
    };
  };

  const setShippingEdit = (orderId: string, patch: Partial<{ carrier: string; tracking: string }>) => {
    setShippingEdits((prev) => ({
      ...prev,
      [orderId]: {
        carrier: patch.carrier ?? prev[orderId]?.carrier ?? '',
        tracking: patch.tracking ?? prev[orderId]?.tracking ?? '',
      },
    }));
  };

  const saveShippingInfo = async (orderId: string) => {
    const client = supabase;
    if (!client) {
      alert('Supabaseが利用できません。');
      return;
    }

    const order = orders.find((o) => o.id === orderId) || (detailOrder?.id === orderId ? detailOrder : null);
    if (!order) return;
    const { carrier, tracking } = getShippingEdit(order);

    try {
      const now = new Date().toISOString();
      const { error } = await client
        .from('orders')
        .update({
          shipping_carrier: carrier || null,
          tracking_number: tracking || null,
          updated_at: now,
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, shipping_carrier: carrier || null, tracking_number: tracking || null, updated_at: now }
            : o
        )
      );

      if (detailOrder?.id === orderId) {
        setDetailOrder({
          ...detailOrder,
          shipping_carrier: carrier || null,
          tracking_number: tracking || null,
          updated_at: now,
        });
      }

      setShippingEdits((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    } catch (err: any) {
      console.error('配送情報の更新に失敗しました:', err);
      const msg = err?.message || '配送情報の更新に失敗しました';
      if (/column/i.test(msg) && /(shipping_carrier|tracking_number)/i.test(msg)) {
        alert('配送会社/発送番号のカラムがDBにありません。先にマイグレーションSQLを実行してください。');
        return;
      }
      alert(`配送情報の更新に失敗しました: ${msg}`);
    }
  };

  const mappedToOrderStatus = (status: Exclude<MappedStatus, 'all'>): Order['order_status'] => {
    switch (status) {
      case 'payment_pending':
        return 'pending';
      case 'before_shipping':
        return 'processing';
      case 'shipped':
        return 'shipped';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'processing';
    }
  };

  const updateBulkStatus = async () => {
    const client = supabase;
    if (!client) return;
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const bulkStatusLabel =
      bulkStatus === 'payment_pending'
        ? '支払い前'
        : bulkStatus === 'before_shipping'
          ? '発送前'
          : bulkStatus === 'shipped'
            ? '発送済み'
            : 'キャンセル';

    if (!confirm(`${ids.length}件のステータスを「${bulkStatusLabel}」に変更します。よろしいですか？`)) return;

    try {
      const nextStatus = mappedToOrderStatus(bulkStatus);
      const now = new Date().toISOString();
      const { error } = await client.from('orders').update({ order_status: nextStatus, updated_at: now }).in('id', ids);
      if (error) throw error;

      setOrders((prev) => prev.map((o) => (selectedIds.has(o.id) ? { ...o, order_status: nextStatus, updated_at: now } : o)));
      setSelectedIds(new Set());
    } catch (e: any) {
      console.error('一括更新に失敗:', e);
      alert(`一括更新に失敗しました: ${e.message}`);
    }
  };

  const deleteBulkOrders = async () => {
    const client = supabase;
    if (!client) return;
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`${ids.length}件の注文を削除します。この操作は取り消せません。よろしいですか？`)) return;
    const verifyText = `DELETE ${ids.length}`;
    const typed = window.prompt(`実削除確認: 「${verifyText}」と入力してください`);
    if (typed !== verifyText) {
      alert('確認テキストが一致しないため削除を中止しました。');
      return;
    }

    try {
      const { error: itemDeleteErr } = await client.from('order_items').delete().in('order_id', ids);
      if (itemDeleteErr) {
        console.warn('order_items 一括削除はスキップされました:', itemDeleteErr);
      }

      const { error } = await client.from('orders').delete().in('id', ids);
      if (error) throw error;

      const { data: remaining, error: verifyErr } = await client.from('orders').select('id').in('id', ids);
      if (verifyErr) throw verifyErr;
      const remainedCount = (remaining || []).length;
      if (remainedCount > 0) {
        throw new Error(`${remainedCount}件の注文が削除されずに残りました。権限または制約を確認してください。`);
      }

      setOrders((prev) => prev.filter((o) => !selectedIds.has(o.id)));
      setSelectedIds(new Set());
      alert(`${ids.length}件の注文を削除しました。`);
    } catch (e: any) {
      console.error('一括削除に失敗:', e);
      alert(`一括削除に失敗しました: ${e.message}`);
    }
  };

  const getMappedStatus = (status: Order['order_status']): Exclude<MappedStatus, 'all'> => {
    if (status === 'cancelled') return 'cancelled';
    if (status === 'shipped' || status === 'delivered') return 'shipped';
    if (status === 'pending') return 'payment_pending';
    return 'before_shipping';
  };

  const getStatusColor = (status: Order['order_status']) => {
    const mappedStatus = getMappedStatus(status);
    switch (mappedStatus) {
      case 'payment_pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'before_shipping':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: Order['order_status']) => {
    const mappedStatus = getMappedStatus(status);
    switch (mappedStatus) {
      case 'payment_pending':
        return '支払い前';
      case 'before_shipping':
        return '発送前';
      case 'shipped':
        return '発送済み';
      case 'cancelled':
        return 'キャンセル';
      default:
        return status;
    }
  };

  const getOrderNumber = (order: Order) => {
    if (order.order_number) return order.order_number;
    return `#${order.id.substring(0, 8).replace(/-/g, '').toUpperCase().substring(0, 4)}`;
  };

  const getCustomerName = (order: Order) => `${order.last_name} ${order.first_name}`;

  const getItemCount = (order: Order) => {
    const count = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    if (count > 0) return count;

    const breakdown = safeParseShippingMethod(order.shipping_method);
    if (!breakdown || breakdown.length === 0) return 0;
    return breakdown.reduce((sum, b) => {
      if (!b.items) return sum;
      return sum + parseItemsFromShippingText(b.items).reduce((s, it) => s + it.qty, 0);
    }, 0);
  };

  const getDisplayLines = (order: Order): EstimatedOrderLine[] => {
    if ((order.order_items || []).length > 0) {
      return (order.order_items || []).map((it) => ({
        title: it.product_title,
        variant: it.variant || undefined,
        qty: it.quantity,
        estimated: false,
      }));
    }

    const breakdown = safeParseShippingMethod(order.shipping_method);
    if (!breakdown || breakdown.length === 0) return [];

    const merged = new Map<string, EstimatedOrderLine>();
    for (const b of breakdown) {
      if (!b.items) continue;
      for (const parsed of parseItemsFromShippingText(b.items)) {
        const key = `${parsed.title}::${parsed.variant || ''}`;
        const current = merged.get(key);
        if (!current) {
          merged.set(key, { ...parsed, estimated: true });
        } else {
          current.qty += parsed.qty;
        }
      }
    }
    return Array.from(merged.values());
  };

  const filteredOrders = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return orders.filter((order) => {
      if (query) {
        const orderNumber = getOrderNumber(order);
        const customerName = getCustomerName(order);
        const productTitles = (order.order_items || []).map((it) => it.product_title).join(' ');
        const haystack = `${orderNumber} ${customerName} ${order.email} ${order.phone || ''} ${order.shipping_postal_code || ''} ${order.shipping_address || ''} ${productTitles}`.toLowerCase();
        if (!haystack.includes(query)) return false;
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

  const selectedCount = selectedIds.size;
  const allChecked = filteredOrders.length > 0 && filteredOrders.every((o) => selectedIds.has(o.id));

  const toggleSelectAll = () => {
    if (allChecked) {
      const next = new Set(selectedIds);
      filteredOrders.forEach((o) => next.delete(o.id));
      setSelectedIds(next);
      return;
    }
    const next = new Set(selectedIds);
    filteredOrders.forEach((o) => next.add(o.id));
    setSelectedIds(next);
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const orderToCsvRow = (o: Order) => ({
    order_number: getOrderNumber(o),
    created_at: formatDateTime(o.created_at),
    order_status: getStatusLabel(o.order_status),
    payment_status: o.payment_status,
    customer_name: getCustomerName(o),
    email: o.email,
    phone: o.phone || '',
    postal_code: o.shipping_postal_code || '',
    address: o.shipping_address || '',
    item_count: getItemCount(o),
    subtotal: o.subtotal,
    shipping_cost: o.shipping_cost,
    total: o.total,
    payment_intent_id: o.payment_intent_id || '',
  });

  const exportOrdersCsv = () => {
    const rows = filteredOrders.map(orderToCsvRow);
    downloadText(`orders-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  };

  const exportSelectedOrdersCsv = () => {
    const toExport = filteredOrders.filter((o) => selectedIds.has(o.id));
    if (toExport.length === 0) {
      alert('出力する注文を選択してください。');
      return;
    }
    const rows = toExport.map(orderToCsvRow);
    downloadText(`orders-selected-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
    setExportOpen(false);
  };

  const exportShippingCsv = () => {
    const toExport = selectedCount > 0 ? filteredOrders.filter((o) => selectedIds.has(o.id)) : filteredOrders;
    if (toExport.length === 0) {
      alert(selectedCount > 0 ? '出力する注文を選択してください。' : '対象注文がありません。');
      return;
    }

    const formatBillingFull = (o: Order) => {
      const parts = [o.billing_prefecture, o.billing_city, o.billing_address].filter(Boolean);
      const base = parts.join('');
      return [base, o.billing_building].filter(Boolean).join(' ') || base || '';
    };

    const rows = toExport.map((o) => ({
      order_number: getOrderNumber(o),
      配送希望時間帯: o.delivery_time_slot || '',
      発送先氏名: getShippingDisplayName(o),
      発送先電話: getShippingDisplayPhone(o) || '',
      発送先郵便番号: o.shipping_postal_code || '',
      発送先住所: [o.shipping_city, o.shipping_address].filter(Boolean).join('') || o.shipping_address || '',
      注文者氏名: getCustomerName(o),
      注文者電話: o.phone || '',
      注文者郵便番号: o.billing_postal_code || o.shipping_postal_code || '',
      注文者住所: formatBillingFull(o),
      購入商品情報: (o.order_items || []).map((it) => `${it.product_title}×${it.quantity}`).join(' / '),
    }));

    downloadText(`shipping-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  };

  const getPaymentBadge = (ps: Order['payment_status']) => {
    switch (ps) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'failed':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
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
            onClick={fetchOrders}
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
        <h1 className="text-xl font-semibold text-gray-900">注文管理</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors bg-white"
          >
            <IconRefreshCw className="w-4 h-4" />
            更新
          </button>
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors bg-white"
            >
              <IconDownload className="w-4 h-4" />
              エクスポート
              <IconChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                {selectedCount > 0 && (
                  <button
                    onClick={exportSelectedOrdersCsv}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100"
                  >
                    選択した注文をCSV（{selectedCount}件）
                  </button>
                )}
                <button
                  onClick={() => {
                    exportOrdersCsv();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100"
                >
                  注文一覧CSV（フィルタ適用）
                </button>
                <button
                  onClick={() => {
                    exportShippingCsv();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                >
                  発送CSV（指定形式）{selectedCount > 0 ? `（選択${selectedCount}件）` : '（フィルタ適用）'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all bg-white"
                />
              </div>
              <button
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

            {selectedCount > 0 && (
              <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="text-sm text-gray-700">
                  選択中: <span className="font-semibold">{selectedCount}</span>件
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as Exclude<MappedStatus, 'all'>)}
                    className="p-2 border border-gray-200 rounded-md bg-white text-sm"
                  >
                    <option value="payment_pending">支払い前</option>
                    <option value="before_shipping">発送前</option>
                    <option value="shipped">発送済み</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                  <button
                    onClick={updateBulkStatus}
                    className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 transition-colors"
                  >
                    一括変更
                  </button>
                  <button
                    onClick={deleteBulkOrders}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                  >
                    削除
                  </button>
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
            <>
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
                      <th className="px-6 py-4 w-16"></th>
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
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setDetailOrder(order)}
                            className="font-medium text-gray-900 hover:text-primary transition-colors"
                          >
                            {getOrderNumber(order)}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{getCustomerName(order)}</td>
                        <td className="px-6 py-4 text-gray-500">{new Date(order.created_at).toLocaleDateString('ja-JP')}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getPaymentBadge(order.payment_status)}`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="min-w-[220px]">
                            <select
                              value={getMappedStatus(order.order_status)}
                              onChange={(e) => updateOrderStatus(order.id, mappedToOrderStatus(e.target.value as Exclude<MappedStatus, 'all'>))}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium border bg-white ${getStatusColor(order.order_status)}`}
                            >
                              <option value="payment_pending">支払い前</option>
                              <option value="before_shipping">発送前</option>
                              <option value="shipped">発送済み</option>
                              <option value="cancelled">キャンセル</option>
                            </select>

                            {getMappedStatus(order.order_status) === 'shipped' && (
                              <div className="mt-2 flex items-center gap-2">
                                <select
                                  value={getShippingEdit(order).carrier}
                                  onChange={(e) => setShippingEdit(order.id, { carrier: e.target.value })}
                                  className="p-2 border border-gray-200 rounded-md bg-white text-xs"
                                >
                                  <option value="">配送会社</option>
                                  <option value="ヤマト運輸">ヤマト運輸</option>
                                  <option value="日本郵便">日本郵便</option>
                                </select>
                                <input
                                  value={getShippingEdit(order).tracking}
                                  onChange={(e) => setShippingEdit(order.id, { tracking: e.target.value })}
                                  placeholder="発送番号"
                                  className="p-2 border border-gray-200 rounded-md bg-white text-xs w-[140px]"
                                />
                                <button
                                  type="button"
                                  onClick={() => saveShippingInfo(order.id)}
                                  className="px-3 py-2 bg-gray-900 text-white rounded-md text-xs hover:bg-gray-800 transition-colors"
                                >
                                  保存
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <div className="text-sm">
                            {getItemCount(order)}点
                            {(order.order_items || []).length === 0 && getItemCount(order) > 0 ? '（推定）' : ''}
                          </div>
                          {getDisplayLines(order).length > 0 ? (
                            <div className="mt-1 text-xs text-gray-500">
                              {getDisplayLines(order)
                                .slice(0, 2)
                                .map((it) => `${it.title}${it.variant ? `（${it.variant}）` : ''}×${it.qty}`)
                                .join(' / ')}
                              {getDisplayLines(order).length > 2 ? ` +${getDisplayLines(order).length - 2}` : ''}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">¥{order.total.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setDetailOrder(order)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            title="詳細"
                          >
                            <IconMore className="w-4 h-4 text-gray-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-5 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                <span className="font-medium">{filteredOrders.length} 件中 1-{filteredOrders.length} 件を表示</span>
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

      {detailOrder && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDetailOrder(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl border-l border-gray-200 overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">注文詳細</div>
                <div className="text-lg font-semibold text-gray-900">{getOrderNumber(detailOrder)}</div>
                <div className="text-xs text-gray-500 mt-1">{formatDateTime(detailOrder.created_at)}</div>
              </div>
              <button onClick={() => setDetailOrder(null)} className="p-2 rounded hover:bg-gray-100" aria-label="close">
                <IconClose className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">ステータス</div>
                  <select
                    value={getMappedStatus(detailOrder.order_status)}
                    onChange={async (e) => {
                      const next = mappedToOrderStatus(e.target.value as Exclude<MappedStatus, 'all'>);
                      await updateOrderStatus(detailOrder.id, next);
                      setDetailOrder({ ...detailOrder, order_status: next });
                    }}
                    className="p-2 border border-gray-200 rounded-md bg-white text-sm"
                  >
                    <option value="payment_pending">支払い前</option>
                    <option value="before_shipping">発送前</option>
                    <option value="shipped">発送済み</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="text-gray-600">支払い</div>
                  <div className="text-gray-900">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border ${getPaymentBadge(detailOrder.payment_status)}`}>
                      {detailOrder.payment_status}
                    </span>
                    {detailOrder.paid_at ? <span className="ml-2 text-gray-500">({formatDateTime(detailOrder.paid_at)})</span> : null}
                  </div>
                  <div className="text-gray-600">合計</div>
                  <div className="text-gray-900 font-semibold">{formatYen(detailOrder.total)}</div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-2">注文サマリー</div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="text-gray-600">小計</div>
                    <div className="text-gray-900">{formatYen(detailOrder.subtotal)}</div>
                    <div className="text-gray-600">送料</div>
                    <div className="text-gray-900">{formatYen(detailOrder.shipping_cost)}</div>
                    <div className="text-gray-600">割引</div>
                    <div className="text-gray-900">
                      {detailOrder.discount_amount && detailOrder.discount_amount > 0
                        ? `- ${formatYen(detailOrder.discount_amount)}`
                        : 'なし'}
                    </div>
                    <div className="text-gray-600">合計</div>
                    <div className="text-gray-900 font-semibold">{formatYen(detailOrder.total)}</div>
                  </div>

                  <div className="mt-3 text-xs">
                    <div className="text-gray-600">クーポン</div>
                    <div className="text-gray-900 mt-1">
                      {detailOrder.coupon_id ? (
                        (() => {
                          const info = couponInfoById[detailOrder.coupon_id as string];
                          if (!info) return `取得中... (${detailOrder.coupon_id})`;
                          if (info.code || info.name) return `${info.code || ''}${info.name ? ` (${info.name})` : ''}`.trim();
                          return detailOrder.coupon_id;
                        })()
                      ) : (
                        'なし'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-900">お客様</div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-gray-900">{getCustomerName(detailOrder)}</div>
                    <button
                      onClick={async () => {
                        const ok = await copyText(getCustomerName(detailOrder));
                        if (!ok) alert('コピーに失敗しました');
                      }}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      コピー
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-gray-600">
                    <div>{detailOrder.email}</div>
                    <button
                      onClick={async () => {
                        const ok = await copyText(detailOrder.email);
                        if (!ok) alert('コピーに失敗しました');
                      }}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      コピー
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-gray-600">
                    <div>{detailOrder.phone || '-'}</div>
                    <button
                      onClick={async () => {
                        const ok = await copyText(detailOrder.phone || '');
                        if (!ok) alert('コピーに失敗しました');
                      }}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      コピー
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-2">請求先住所（購入者情報）</div>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>{formatCountryName(detailOrder.billing_country || detailOrder.shipping_country)}</div>
                      <div>〒{detailOrder.billing_postal_code || detailOrder.shipping_postal_code || '-'}</div>
                      <div className="text-gray-900">
                        {formatBillingAddressLine(detailOrder) || detailOrder.shipping_address || '-'}
                      </div>
                    </div>
                  </div>

                  {detailOrder.delivery_time_slot ? (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs font-semibold text-gray-700 mb-2">配送時間</div>
                      <div className="text-xs text-gray-900">{detailOrder.delivery_time_slot}</div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-900">配送先</div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
                  <div className="text-gray-700">{formatCountryName(detailOrder.shipping_country)}</div>
                  <div className="text-gray-600 mt-1">〒{detailOrder.shipping_postal_code || '-'}</div>
                  <div className="mt-1 text-gray-900 whitespace-pre-wrap">{detailOrder.shipping_address || '-'}</div>
                  <div className="mt-2 text-gray-700">{getShippingDisplayName(detailOrder)} 様</div>
                  {getShippingDisplayPhone(detailOrder) ? <div className="text-gray-700">{getShippingDisplayPhone(detailOrder)}</div> : null}

                  {getMappedStatus(detailOrder.order_status) === 'shipped' && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={getShippingEdit(detailOrder).carrier}
                        onChange={(e) => setShippingEdit(detailOrder.id, { carrier: e.target.value })}
                        className="p-2 border border-gray-200 rounded-md bg-white text-sm"
                      >
                        <option value="">配送会社</option>
                        <option value="ヤマト運輸">ヤマト運輸</option>
                        <option value="日本郵便">日本郵便</option>
                      </select>
                      <input
                        value={getShippingEdit(detailOrder).tracking}
                        onChange={(e) => setShippingEdit(detailOrder.id, { tracking: e.target.value })}
                        placeholder="発送番号"
                        className="p-2 border border-gray-200 rounded-md bg-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => saveShippingInfo(detailOrder.id)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 transition-colors"
                      >
                        配送情報を保存
                      </button>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-gray-600">送料合計</div>
                    <div className="text-sm font-semibold">{formatYen(detailOrder.shipping_cost)}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={async () => {
                        const text =
                          `${formatCountryName(detailOrder.shipping_country)}\n` +
                          `〒${detailOrder.shipping_postal_code || ''}\n` +
                          `${detailOrder.shipping_address || ''}\n` +
                          `${getShippingDisplayName(detailOrder)}\n` +
                          `${getShippingDisplayPhone(detailOrder) || ''}`;
                        const ok = await copyText(text.trim());
                        if (!ok) alert('コピーに失敗しました');
                      }}
                      className="text-xs text-gray-700 hover:text-gray-900 underline"
                    >
                      住所+氏名+電話をまとめてコピー
                    </button>
                  </div>
                </div>

                {safeParseShippingMethod(detailOrder.shipping_method) && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
                    <div className="text-xs font-semibold text-gray-700 mb-2">送料の内訳（保存データ）</div>
                    <div className="space-y-2">
                      {safeParseShippingMethod(detailOrder.shipping_method)!.map((b, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-gray-900 font-medium">発送方法ID: {b.shipping_method_id || '-'}</div>
                            {b.items ? <div className="text-xs text-gray-600 mt-0.5">対象: {b.items}</div> : null}
                            {b.breakdown ? <div className="text-xs text-gray-600 mt-0.5">内訳: {b.breakdown}</div> : null}
                          </div>
                          <div className="font-semibold whitespace-nowrap">{formatYen(b.cost)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-900">商品</div>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {(detailOrder.order_items || []).length === 0 ? (
                    <div className="p-4 text-sm text-gray-600 space-y-2">
                      <div className="text-gray-500">商品情報がありません（注文明細が未保存の可能性）</div>
                      {safeParseShippingMethod(detailOrder.shipping_method) ? (
                        <div className="text-xs text-gray-700">
                          {getDisplayLines(detailOrder).length > 0 ? (
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">保存データから推定:</div>
                              {getDisplayLines(detailOrder).map((line, idx) => (
                                <div key={`${line.title}-${line.variant || ''}-${idx}`}>
                                  - {line.title}
                                  {line.variant ? `（${line.variant}）` : ''} × {line.qty}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>（送料データに対象商品が含まれていません）</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {(detailOrder.order_items || []).map((it) => (
                        <div key={it.id} className="p-4 flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900">{it.product_title}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {formatYen(it.product_price)} × {it.quantity} = {formatYen(it.line_total)}
                            </div>
                            {it.variant ? <div className="text-xs text-gray-500 mt-1">種類: {it.variant}</div> : null}
                            {it.selected_options ? (
                              <div className="text-xs text-gray-500 mt-1">
                                オプション: {typeof it.selected_options === 'string' ? it.selected_options : JSON.stringify(it.selected_options)}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;
