'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_INTERVAL_LABELS, SubscriptionInterval } from '@/types';
import { computeNextShippingDate, formatJapaneseDate } from '@/lib/subscriptionShipping';

interface AdminSubscriptionRow {
  id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  auth_user_id: string | null;
  email: string;
  status: string;
  interval: string;
  metadata: any;
  next_billing_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderSummary {
  id: string;
  order_number: string | null;
  created_at: string;
  total: number | null;
  payment_status: string | null;
  order_status: string | null;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active: { label: '有効', cls: 'bg-green-100 text-green-700' },
  trialing: { label: '次回発送待ち', cls: 'bg-blue-100 text-blue-700' },
  past_due: { label: '支払い遅延', cls: 'bg-red-100 text-red-700' },
  unpaid: { label: '未払い', cls: 'bg-red-100 text-red-700' },
  canceled: { label: '解約済み', cls: 'bg-gray-200 text-gray-700' },
  incomplete: { label: '処理中', cls: 'bg-yellow-100 text-yellow-700' },
  incomplete_expired: { label: '期限切れ', cls: 'bg-gray-200 text-gray-700' },
  paused: { label: '一時停止', cls: 'bg-yellow-100 text-yellow-700' },
};

const formatDate = (iso: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const formatYen = (n: number | null | undefined) => {
  const v = Number(n ?? 0);
  return `¥${v.toLocaleString()}`;
};

const Subscriptions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subs, setSubs] = useState<AdminSubscriptionRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [intervalFilter, setIntervalFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOrders, setDetailOrders] = useState<OrderSummary[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  const fetchSubs = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setSubs((data ?? []) as AdminSubscriptionRow[]);
    } catch (e: any) {
      setError(e?.message || '定期購入の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (intervalFilter !== 'all' && s.interval !== intervalFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hit =
          s.email?.toLowerCase().includes(q) ||
          s.stripe_subscription_id?.toLowerCase().includes(q) ||
          s.stripe_customer_id?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [subs, statusFilter, intervalFilter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: subs.length };
    for (const s of subs) {
      c[s.status] = (c[s.status] ?? 0) + 1;
    }
    return c;
  }, [subs]);

  const openDetail = async (sub: AdminSubscriptionRow) => {
    setDetailId(sub.stripe_subscription_id);
    setDetailOrders([]);
    if (!supabase) return;
    try {
      setLoadingDetail(true);
      const { data, error: err } = await supabase
        .from('orders')
        .select('id, order_number, created_at, total, payment_status, order_status')
        .eq('stripe_subscription_id', sub.stripe_subscription_id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setDetailOrders((data ?? []) as OrderSummary[]);
    } catch (e) {
      console.error('detail orders fetch error:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetailOrders([]);
  };

  const handleCancel = async (sub: AdminSubscriptionRow, immediate: boolean) => {
    if (!supabase) return;
    const msg = immediate
      ? '即時解約します。現在のサイクル分も配送されません。よろしいですか？'
      : '期末解約します。現在のサイクルの配送は予定通り、その後停止します。よろしいですか？';
    if (!window.confirm(msg)) return;
    try {
      setCancelingId(sub.stripe_subscription_id);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('セッションが切れています');

      const res = await fetch('/api/admin/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          subscription_id: sub.stripe_subscription_id,
          cancel_at_period_end: !immediate,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'キャンセルに失敗しました');
      alert('キャンセル処理を受け付けました。');
      await fetchSubs();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'キャンセルに失敗しました');
    } finally {
      setCancelingId(null);
    }
  };

  const handleSync = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('セッションが切れています');

      // 各 subscription を Stripe から最新化（adminユーザー本人のsubscriptionだけだとカバー不足。
      // 個別sync APIではなく、シンプルに全件Webhookリフレッシュは不要。フェッチし直す）
      await fetchSubs();
    } catch (e: any) {
      alert(e?.message || '更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupAllIncomplete = async () => {
    if (!supabase) return;
    if (!window.confirm('未完了の定期購入をすべて削除します。よろしいですか？')) return;
    try {
      setCleaningUp(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('セッションが切れています');

      const res = await fetch('/api/admin/cleanup-incomplete-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || '掃除に失敗しました');
      alert(`${data?.cleaned ?? 0}件を削除しました`);
      await fetchSubs();
    } catch (e: any) {
      alert(e?.message || '掃除に失敗しました');
    } finally {
      setCleaningUp(false);
    }
  };

  const handleDeleteIncomplete = async (sub: AdminSubscriptionRow) => {
    if (!supabase) return;
    if (!window.confirm(`${sub.stripe_subscription_id} を削除します。よろしいですか？`)) return;
    try {
      setCancelingId(sub.stripe_subscription_id);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('セッションが切れています');

      const res = await fetch('/api/admin/cleanup-incomplete-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ subscription_id: sub.stripe_subscription_id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || '削除に失敗しました');
      await fetchSubs();
      closeDetail();
    } catch (e: any) {
      alert(e?.message || '削除に失敗しました');
    } finally {
      setCancelingId(null);
    }
  };

  const activeSub = subs.find((s) => s.stripe_subscription_id === detailId) ?? null;

  return (
    <>
      <div className="p-6 space-y-6">
        {/* ヘッダー: 統計 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { key: 'all', label: '全体' },
            { key: 'active', label: '有効' },
            { key: 'past_due', label: '支払い遅延' },
            { key: 'canceled', label: '解約済み' },
            { key: 'incomplete', label: '処理中' },
          ].map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStatusFilter(s.key)}
              className={`text-left p-4 rounded-lg border transition-colors ${
                statusFilter === s.key
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-900 border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="text-xs opacity-70">{s.label}</div>
              <div className="text-2xl font-semibold mt-1">{counts[s.key] ?? 0}</div>
            </button>
          ))}
        </div>

        {/* フィルター */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="メール / Subscription ID / Customer ID で検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
          <select
            value={intervalFilter}
            onChange={(e) => setIntervalFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white"
          >
            <option value="all">配送間隔: すべて</option>
            {(Object.entries(SUBSCRIPTION_INTERVAL_LABELS) as [SubscriptionInterval, string][]).map(
              ([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              )
            )}
          </select>
          <button
            type="button"
            onClick={handleSync}
            disabled={loading}
            className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? '読込中...' : '再読込'}
          </button>
          {(counts.incomplete ?? 0) + (counts.incomplete_expired ?? 0) > 0 && (
            <button
              type="button"
              onClick={handleCleanupAllIncomplete}
              disabled={cleaningUp}
              className="px-4 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
            >
              {cleaningUp
                ? '処理中...'
                : `未完了 ${(counts.incomplete ?? 0) + (counts.incomplete_expired ?? 0)} 件を掃除`}
            </button>
          )}
        </div>

        {/* 一覧テーブル */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-200">{error}</div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">顧客</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Subscription ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">ステータス</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">配送頻度</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">次回お届け</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">開始日</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-12">
                      読み込み中...
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-12">
                      該当する定期購入はありません
                    </td>
                  </tr>
                )}
                {!loading &&
                  filtered.map((sub) => {
                    const statusInfo =
                      STATUS_LABELS[sub.status] ?? { label: sub.status, cls: 'bg-gray-100 text-gray-600' };
                    const intervalLabel =
                      SUBSCRIPTION_INTERVAL_LABELS[sub.interval as SubscriptionInterval] || sub.interval;
                    const cancelAtPeriodEnd = Boolean(sub.metadata?.cancel_at_period_end);
                    return (
                      <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-gray-900">{sub.email}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{sub.stripe_customer_id}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                          {sub.stripe_subscription_id}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.cls}`}
                          >
                            {statusInfo.label}
                          </span>
                          {cancelAtPeriodEnd && sub.status !== 'canceled' && (
                            <div className="text-[10px] text-amber-700 mt-1">次回更新で停止</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-900">{intervalLabel}</td>
                        <td className="px-4 py-3 text-gray-700">{formatJapaneseDate(computeNextShippingDate({ created_at: sub.created_at, next_billing_at: sub.next_billing_at, interval: sub.interval }))}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(sub.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openDetail(sub)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            詳細
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 詳細パネル */}
      {activeSub && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={closeDetail} />
          <div className="relative ml-auto h-full w-full sm:w-[560px] bg-white shadow-2xl overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500">定期購入詳細</div>
                <div className="text-base font-medium text-gray-900 break-all">
                  {activeSub.stripe_subscription_id}
                </div>
              </div>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                ×
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm">
              <section>
                <h3 className="font-semibold text-gray-900 mb-3">顧客情報</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  <div>
                    <span className="text-xs text-gray-500">メール: </span>
                    <span className="text-gray-900">{activeSub.email}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Customer ID: </span>
                    <span className="text-gray-900 font-mono text-xs">{activeSub.stripe_customer_id}</span>
                  </div>
                  {activeSub.auth_user_id && (
                    <div>
                      <Link
                        href={`/admin/customers/${encodeURIComponent(activeSub.email)}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        顧客ページを開く →
                      </Link>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-3">ステータス</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
                        STATUS_LABELS[activeSub.status]?.cls ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {STATUS_LABELS[activeSub.status]?.label ?? activeSub.status}
                    </span>
                    {activeSub.metadata?.cancel_at_period_end && activeSub.status !== 'canceled' && (
                      <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                        次回更新で停止
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">配送頻度: </span>
                    <span className="text-gray-900">
                      {SUBSCRIPTION_INTERVAL_LABELS[activeSub.interval as SubscriptionInterval] ||
                        activeSub.interval}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">次回お届け: </span>
                    <span className="text-gray-900">{formatJapaneseDate(computeNextShippingDate({ created_at: activeSub.created_at, next_billing_at: activeSub.next_billing_at, interval: activeSub.interval }))}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">開始日: </span>
                    <span className="text-gray-900">{formatDate(activeSub.created_at)}</span>
                  </div>
                  {activeSub.canceled_at && (
                    <div>
                      <span className="text-xs text-gray-500">解約日: </span>
                      <span className="text-gray-900">{formatDate(activeSub.canceled_at)}</span>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-3">
                  関連注文 ({detailOrders.length}件)
                </h3>
                {loadingDetail ? (
                  <div className="text-gray-500 text-xs">読み込み中...</div>
                ) : detailOrders.length === 0 ? (
                  <div className="text-gray-500 text-xs">関連注文がありません</div>
                ) : (
                  <div className="space-y-2">
                    {detailOrders.map((o) => (
                      <Link
                        key={o.id}
                        href={`/admin/orders?detail=${o.id}`}
                        className="block bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="text-gray-900 font-medium truncate">
                              {o.order_number || o.id.slice(0, 8)}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{formatDate(o.created_at)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-900 font-medium">{formatYen(o.total)}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {o.payment_status === 'paid' ? '支払済' : o.payment_status || '-'}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {(activeSub.status === 'active' || activeSub.status === 'trialing') && (
                <section className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">操作</h3>
                  <div className="space-y-2">
                    {!activeSub.metadata?.cancel_at_period_end && (
                      <button
                        type="button"
                        onClick={() => handleCancel(activeSub, false)}
                        disabled={cancelingId === activeSub.stripe_subscription_id}
                        className="w-full px-4 py-2.5 text-sm bg-white text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
                      >
                        期末解約（現サイクル配送後に停止）
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCancel(activeSub, true)}
                      disabled={cancelingId === activeSub.stripe_subscription_id}
                      className="w-full px-4 py-2.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      即時解約（次回配送も停止）
                    </button>
                  </div>
                </section>
              )}

              {(activeSub.status === 'incomplete' || activeSub.status === 'incomplete_expired') && (
                <section className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">操作</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    未完了の定期購入です。決済が完了していないため、削除しても問題ありません。
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDeleteIncomplete(activeSub)}
                    disabled={cancelingId === activeSub.stripe_subscription_id}
                    className="w-full px-4 py-2.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {cancelingId === activeSub.stripe_subscription_id ? '処理中...' : 'このレコードを削除'}
                  </button>
                </section>
              )}

              <section className="pt-4 border-t border-gray-200">
                <a
                  href={`https://dashboard.stripe.com/${activeSub.stripe_subscription_id.startsWith('sub_test_') || activeSub.stripe_subscription_id.includes('test') ? 'test/' : ''}subscriptions/${activeSub.stripe_subscription_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Stripeダッシュボードで開く →
                </a>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Subscriptions;
