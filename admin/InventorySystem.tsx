'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  IconArchive,
  IconBarChart,
  IconCalendar,
  IconCheckCircle,
  IconLoader2,
  IconPackage,
  IconPlus,
  IconRefreshCw,
  IconShoppingCart,
  IconTrash,
} from '@/components/Icons';

type VarietyKey = 'koshihikari' | 'nikomaru' | 'kamenoo';
type ChannelKey = 'direct' | 'wholesale' | 'gift' | 'home_use';

type Season = {
  id: string;
  harvest_year: number;
  label: string;
  starts_on: string;
  ends_on: string;
  capacity_unit_kg: number;
};

type VarietyStock = {
  id?: string;
  season_id: string;
  variety_key: VarietyKey;
  harvested_kg: number;
  reserved_kg: number;
};

type ExternalSale = {
  id: string;
  season_id: string;
  variety_key: VarietyKey;
  channel: ChannelKey;
  sales_destination: string | null;
  quantity_kg: number;
  sold_on: string;
  note: string | null;
};

type OrderItem = {
  product_title: string;
  quantity: number;
  variant: string | null;
  selected_options: Record<string, unknown> | null;
  is_subscription?: boolean;
};

type PaidOrder = {
  id: string;
  created_at: string;
  payment_status: string;
  order_items: OrderItem[] | null;
};

const VARIETIES: Array<{ key: VarietyKey; label: string; short: string }> = [
  { key: 'koshihikari', label: 'コシヒカリ', short: 'コシヒカリ' },
  { key: 'nikomaru', label: 'にこまる', short: 'にこまる' },
  { key: 'kamenoo', label: '亀の尾', short: '亀の尾' },
];

const CHANNELS: Array<{ key: ChannelKey; label: string }> = [
  { key: 'direct', label: '直販（個人）' },
  { key: 'wholesale', label: '卸し' },
  { key: 'gift', label: 'プレゼント' },
  { key: 'home_use', label: '自家用' },
];

const number = (value: unknown) => Number(value || 0);
const kg = (value: number) => `${value.toLocaleString('ja-JP', { maximumFractionDigits: 1 })} kg`;
const today = () => new Date().toISOString().slice(0, 10);

const detectVariety = (item: OrderItem): VarietyKey | null => {
  const haystack = [item.product_title, item.variant, JSON.stringify(item.selected_options || {})].join(' ').toLowerCase();
  if (/コシヒカリ|koshihikari/.test(haystack)) return 'koshihikari';
  if (/にこまる|nikomaru/.test(haystack)) return 'nikomaru';
  if (/亀の尾|かめのお|kamenoo|kame.?no.?o/.test(haystack)) return 'kamenoo';
  return null;
};

const detectUnitKg = (item: OrderItem) => {
  const optionValues = Object.values(item.selected_options || {}).map(String);
  const candidates = [...optionValues, item.variant || '', item.product_title];
  for (const candidate of candidates) {
    const kgMatch = candidate.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (kgMatch) return Number(kgMatch[1]);
    const gramMatch = candidate.match(/(\d+(?:\.\d+)?)\s*g(?:\b|$)/i);
    if (gramMatch) return Number(gramMatch[1]) / 1000;
  }
  return 0;
};

const InventorySystem: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState('');
  const [stocks, setStocks] = useState<VarietyStock[]>([]);
  const [sales, setSales] = useState<ExternalSale[]>([]);
  const [orders, setOrders] = useState<PaidOrder[]>([]);
  const [newYear, setNewYear] = useState(currentYear);
  const [saleDraft, setSaleDraft] = useState({
    variety_key: 'koshihikari' as VarietyKey,
    channel: 'direct' as ChannelKey,
    sales_destination: '',
    quantity_kg: '',
    sold_on: today(),
    note: '',
  });

  const activeSeason = seasons.find((season) => season.id === seasonId) || null;

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const [seasonRes, orderRes] = await Promise.all([
      supabase.from('inventory_seasons').select('*').order('harvest_year', { ascending: false }),
      supabase
        .from('orders')
        .select('id, created_at, payment_status, order_items(product_title, quantity, variant, selected_options, is_subscription)')
        .eq('payment_status', 'paid'),
    ]);

    if (seasonRes.error) {
      const missing = seasonRes.error.code === '42P01' || /inventory_seasons/.test(seasonRes.error.message || '');
      setSchemaMissing(missing);
      if (!missing) setError(seasonRes.error.message);
      setOrders((orderRes.data || []) as unknown as PaidOrder[]);
      setLoading(false);
      return;
    }

    const nextSeasons = (seasonRes.data || []) as Season[];
    setSeasons(nextSeasons);
    setOrders((orderRes.data || []) as unknown as PaidOrder[]);
    setSchemaMissing(false);
    setSeasonId((current) => current || nextSeasons[0]?.id || '');
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const loadSeasonDetails = async () => {
      if (!supabase || !seasonId) {
        setStocks([]);
        setSales([]);
        return;
      }
      const [stockRes, salesRes] = await Promise.all([
        supabase.from('inventory_varieties').select('*').eq('season_id', seasonId),
        supabase.from('inventory_external_sales').select('*').eq('season_id', seasonId).order('sold_on', { ascending: false }),
      ]);
      if (stockRes.error || salesRes.error) {
        setError(stockRes.error?.message || salesRes.error?.message || '在庫データを取得できませんでした');
        return;
      }
      const rows = (stockRes.data || []) as VarietyStock[];
      setStocks(VARIETIES.map((v) => rows.find((row) => row.variety_key === v.key) || {
        season_id: seasonId,
        variety_key: v.key,
        harvested_kg: 0,
        reserved_kg: 0,
      }));
      setSales((salesRes.data || []) as ExternalSale[]);
    };
    loadSeasonDetails();
  }, [seasonId]);

  const ecUsage = useMemo(() => {
    const result: Record<VarietyKey, { oneTime: number; subscription: number }> = {
      koshihikari: { oneTime: 0, subscription: 0 },
      nikomaru: { oneTime: 0, subscription: 0 },
      kamenoo: { oneTime: 0, subscription: 0 },
    };
    let unresolved = 0;
    if (!activeSeason) return { result, unresolved };
    for (const order of orders) {
      if (order.created_at.slice(0, 10) < activeSeason.starts_on || order.created_at.slice(0, 10) > activeSeason.ends_on) continue;
      for (const item of order.order_items || []) {
        const variety = detectVariety(item);
        const unitKg = detectUnitKg(item);
        if (!variety || !unitKg) {
          unresolved += 1;
          continue;
        }
        const amount = unitKg * number(item.quantity);
        if (item.is_subscription) result[variety].subscription += amount;
        else result[variety].oneTime += amount;
      }
    }
    return { result, unresolved };
  }, [activeSeason, orders]);

  const rows = useMemo(() => VARIETIES.map((variety) => {
    const stock = stocks.find((item) => item.variety_key === variety.key);
    const external = sales.filter((sale) => sale.variety_key === variety.key).reduce((sum, sale) => sum + number(sale.quantity_kg), 0);
    const oneTime = ecUsage.result[variety.key].oneTime;
    const subscription = ecUsage.result[variety.key].subscription;
    const harvested = number(stock?.harvested_kg);
    const reserved = number(stock?.reserved_kg);
    const sold = external + oneTime + subscription;
    const available = Math.max(0, harvested - reserved - sold);
    const remainingRatio = harvested > 0 ? available / harvested : 0;
    const capacity = activeSeason ? Math.floor(available / (number(activeSeason.capacity_unit_kg) * 12)) : 0;
    return { ...variety, stock, harvested, reserved, external, oneTime, subscription, sold, available, remainingRatio, capacity };
  }), [stocks, sales, ecUsage, activeSeason]);

  const totals = useMemo(() => rows.reduce((acc, row) => ({
    harvested: acc.harvested + row.harvested,
    sold: acc.sold + row.sold,
    available: acc.available + row.available,
    capacity: acc.capacity + row.capacity,
  }), { harvested: 0, sold: 0, available: 0, capacity: 0 }), [rows]);

  const createSeason = async () => {
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const { data, error: insertError } = await supabase.from('inventory_seasons').insert({
      harvest_year: newYear,
      label: `${newYear}年産`,
      starts_on: `${newYear}-10-01`,
      ends_on: `${newYear + 1}-09-30`,
      capacity_unit_kg: 5,
    }).select().single();
    if (insertError) setError(insertError.message);
    else {
      setNotice(`${newYear}年産を作成しました`);
      await load();
      if (data) setSeasonId(data.id);
    }
    setSaving(false);
  };

  const saveStocks = async () => {
    if (!supabase || !activeSeason) return;
    setSaving(true);
    setError(null);
    const { error: upsertError } = await supabase.from('inventory_varieties').upsert(
      stocks.map(({ season_id, variety_key, harvested_kg, reserved_kg }) => ({ season_id, variety_key, harvested_kg, reserved_kg })),
      { onConflict: 'season_id,variety_key' },
    );
    if (upsertError) setError(upsertError.message);
    else setNotice('年間収穫量を保存しました');
    setSaving(false);
  };

  const addSale = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !activeSeason || number(saleDraft.quantity_kg) <= 0) return;
    setSaving(true);
    const { error: insertError } = await supabase.from('inventory_external_sales').insert({
      season_id: activeSeason.id,
      variety_key: saleDraft.variety_key,
      channel: saleDraft.channel,
      sales_destination: saleDraft.sales_destination.trim() || null,
      quantity_kg: number(saleDraft.quantity_kg),
      sold_on: saleDraft.sold_on,
      note: saleDraft.note || null,
    });
    if (insertError) setError(insertError.message);
    else {
      setSaleDraft((draft) => ({ ...draft, quantity_kg: '', sales_destination: '', note: '' }));
      setNotice('販売・使用実績を追加しました');
      const { data } = await supabase.from('inventory_external_sales').select('*').eq('season_id', activeSeason.id).order('sold_on', { ascending: false });
      setSales((data || []) as ExternalSale[]);
    }
    setSaving(false);
  };

  const removeSale = async (id: string) => {
    if (!supabase || !window.confirm('この販売実績を削除しますか？')) return;
    const { error: deleteError } = await supabase.from('inventory_external_sales').delete().eq('id', id);
    if (deleteError) setError(deleteError.message);
    else setSales((current) => current.filter((sale) => sale.id !== id));
  };

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center"><IconLoader2 className="w-7 h-7 animate-spin text-gray-400" /></div>;

  return (
    <div className="max-w-[1500px] mx-auto space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 mb-2"><IconArchive className="w-4 h-4" /> INVENTORY</div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-950">在庫システム</h1>
          <p className="text-sm text-gray-600 mt-2">年間収穫量から、自社ECの自動集計とWeb以外の販売・使用分を差し引いて管理します。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {seasons.length > 0 && <label className="sr-only" htmlFor="inventory-season">収穫年度</label>}
          {seasons.length > 0 && <select id="inventory-season" value={seasonId} onChange={(e) => setSeasonId(e.target.value)} className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600">
            {seasons.map((season) => <option key={season.id} value={season.id}>{season.label}</option>)}
          </select>}
          <button type="button" onClick={load} className="h-11 px-4 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 flex items-center gap-2"><IconRefreshCw className="w-4 h-4" />更新</button>
        </div>
      </header>

      {schemaMissing && <section role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
        <p className="font-semibold">在庫データベースの初期設定が必要です</p>
        <p className="mt-1 leading-relaxed">SupabaseのSQL Editorで <code className="font-mono">migration_add_inventory_system.sql</code> を実行すると、この画面から年度と在庫を登録できます。</p>
      </section>}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {notice && <div aria-live="polite" className="fixed right-5 top-5 z-50 rounded-lg bg-gray-950 px-4 py-3 text-sm text-white shadow-xl flex items-center gap-2"><IconCheckCircle className="w-4 h-4" />{notice}</div>}

      {!activeSeason ? <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-10 text-center">
        <IconCalendar className="w-10 h-10 mx-auto text-gray-400" />
        <h2 className="text-lg font-semibold mt-4">最初の収穫年度を作成</h2>
        <p className="text-sm text-gray-500 mt-2">例：2026年産は2026年10月〜2027年9月として集計します。</p>
        <div className="mt-5 flex justify-center gap-2">
          <input aria-label="収穫年" type="number" min="2020" max="2100" value={newYear} onChange={(e) => setNewYear(Number(e.target.value))} className="h-11 w-28 rounded-lg border border-gray-300 px-3 text-center" disabled={schemaMissing} />
          <button type="button" onClick={createSeason} disabled={saving || schemaMissing} className="h-11 rounded-lg bg-gray-950 px-5 text-sm font-medium text-white disabled:opacity-40 flex items-center gap-2"><IconPlus className="w-4 h-4" />作成</button>
        </div>
      </section> : <>
        <section aria-label="在庫サマリー" className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: '年間収穫量', value: kg(totals.harvested), note: '3品種の合計', icon: IconPackage },
            { label: '販売・使用済み', value: kg(totals.sold), note: '自社EC + 手入力', icon: IconShoppingCart },
            { label: '販売可能在庫', value: kg(totals.available), note: totals.harvested ? `残り ${Math.round((totals.available / totals.harvested) * 100)}%` : '収穫量を入力してください', icon: IconArchive },
            { label: '定期追加可能人数', value: `${totals.capacity.toLocaleString()}人`, note: `1人 ${activeSeason.capacity_unit_kg}kg/月 × 12か月`, icon: IconBarChart },
          ].map(({ label, value, note, icon: Icon }) => <article key={label} className="rounded-xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-xs md:text-sm font-medium text-gray-600">{label}</p><Icon className="w-5 h-5 text-gray-400" /></div>
            <p className="mt-3 text-xl md:text-2xl font-bold text-gray-950 tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-gray-500">{note}</p>
          </article>)}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="p-5 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div><h2 className="text-lg font-semibold text-gray-950">品種別の在庫状況</h2><p className="text-sm text-gray-500 mt-1">残量、販売内訳、定期契約の受付余力を確認できます。</p></div>
            {ecUsage.unresolved > 0 && <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">重量を判定できないEC明細 {ecUsage.unresolved}件</span>}
          </div>
          <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            {rows.map((row) => <article key={row.key} className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-gray-950">{row.label}</h3><p className="text-xs text-gray-500 mt-1">残り {Math.round(row.remainingRatio * 100)}%</p></div><p className="text-xl font-bold tabular-nums">{kg(row.available)}</p></div>
              <div className="mt-4 h-3 rounded-full bg-gray-100 overflow-hidden" role="progressbar" aria-label={`${row.label}の在庫残量`} aria-valuenow={Math.round(row.remainingRatio * 100)} aria-valuemin={0} aria-valuemax={100}><div className={`h-full rounded-full ${row.remainingRatio < .15 ? 'bg-red-500' : row.remainingRatio < .35 ? 'bg-amber-500' : 'bg-emerald-600'}`} style={{ width: `${Math.min(100, row.remainingRatio * 100)}%` }} /></div>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">年間収穫量</dt><dd className="font-medium tabular-nums">{kg(row.harvested)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">自社EC・単品</dt><dd className="tabular-nums">-{kg(row.oneTime)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">自社EC・定期</dt><dd className="tabular-nums">-{kg(row.subscription)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Web以外・使用分</dt><dd className="tabular-nums">-{kg(row.external)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">確保分</dt><dd className="tabular-nums">-{kg(row.reserved)}</dd></div>
              </dl>
              <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">定期をあと約 {row.capacity.toLocaleString()}人 受付可能</p>
            </article>)}
          </div>
        </section>

        <section className="grid xl:grid-cols-[1fr_1.2fr] gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
            <h2 className="text-lg font-semibold">年間収穫量を入力</h2><p className="text-sm text-gray-500 mt-1">精米前後で基準が変わらないよう、すべてkgで統一してください。</p>
            <div className="mt-5 space-y-4">{stocks.map((stock) => <div key={stock.variety_key} className="grid grid-cols-[1fr_110px_110px] gap-2 items-end">
              <p className="pb-3 text-sm font-medium">{VARIETIES.find((v) => v.key === stock.variety_key)?.label}</p>
              <label className="text-xs text-gray-600">収穫量（kg）<input type="number" min="0" step="0.1" value={stock.harvested_kg} onChange={(e) => setStocks((current) => current.map((row) => row.variety_key === stock.variety_key ? { ...row, harvested_kg: number(e.target.value) } : row))} className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3 text-right tabular-nums focus:ring-2 focus:ring-emerald-600" /></label>
              <label className="text-xs text-gray-600">確保分（kg）<input type="number" min="0" step="0.1" value={stock.reserved_kg} onChange={(e) => setStocks((current) => current.map((row) => row.variety_key === stock.variety_key ? { ...row, reserved_kg: number(e.target.value) } : row))} className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3 text-right tabular-nums focus:ring-2 focus:ring-emerald-600" /></label>
            </div>)}</div>
            <button type="button" onClick={saveStocks} disabled={saving} className="mt-6 h-11 w-full rounded-lg bg-gray-950 px-5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{saving ? '保存中…' : '収穫量を保存'}</button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Web以外の販売・使用を追加</h2><p className="text-sm text-gray-500 mt-1">Web注文は自動連動されます。直販・卸し・プレゼント・自家用だけをここから登録します。</p>
            <form onSubmit={addSale} className="mt-5 grid sm:grid-cols-2 gap-3">
              <label className="text-xs text-gray-600">品種<select value={saleDraft.variety_key} onChange={(e) => setSaleDraft({ ...saleDraft, variety_key: e.target.value as VarietyKey })} className="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-white px-3">{VARIETIES.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}</select></label>
              <label className="text-xs text-gray-600">カテゴリー<select value={saleDraft.channel} onChange={(e) => setSaleDraft({ ...saleDraft, channel: e.target.value as ChannelKey })} className="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600">{CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></label>
              <label className="text-xs text-gray-600">販売重量（kg）<input required type="number" min="0.1" step="0.1" value={saleDraft.quantity_kg} onChange={(e) => setSaleDraft({ ...saleDraft, quantity_kg: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3" /></label>
              <label className="text-xs text-gray-600">販売日<input required type="date" value={saleDraft.sold_on} onChange={(e) => setSaleDraft({ ...saleDraft, sold_on: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3" /></label>
              <label className="sm:col-span-2 text-xs text-gray-600">販売先・使用先（任意）<input type="text" value={saleDraft.sales_destination} onChange={(e) => setSaleDraft({ ...saleDraft, sales_destination: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" placeholder="例：○○商店、田中様、収穫祭など" /></label>
              <label className="sm:col-span-2 text-xs text-gray-600">メモ（任意）<input type="text" value={saleDraft.note} onChange={(e) => setSaleDraft({ ...saleDraft, note: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" placeholder="注文番号、用途、補足など" /></label>
              <button type="submit" disabled={saving || !saleDraft.quantity_kg} className="sm:col-span-2 h-11 rounded-lg bg-emerald-700 px-5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-40 flex items-center justify-center gap-2"><IconPlus className="w-4 h-4" />販売実績を追加</button>
            </form>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="p-5 md:p-6 border-b border-gray-100"><h2 className="text-lg font-semibold">Web以外の販売・使用履歴</h2><p className="text-sm text-gray-500 mt-1">直販、卸し、贈答、自家消費をまとめて確認できます。</p></div>
          {sales.length === 0 ? <p className="p-8 text-center text-sm text-gray-500">手入力の販売・使用履歴はまだありません。</p> : <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-sm"><thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-5 py-3">日付</th><th className="px-5 py-3">品種</th><th className="px-5 py-3">カテゴリー</th><th className="px-5 py-3">販売先・使用先</th><th className="px-5 py-3 text-right">重量</th><th className="px-5 py-3">メモ</th><th className="px-5 py-3"><span className="sr-only">操作</span></th></tr></thead><tbody className="divide-y divide-gray-100">{sales.map((sale) => <tr key={sale.id} className="hover:bg-gray-50"><td className="px-5 py-3 tabular-nums">{sale.sold_on}</td><td className="px-5 py-3 font-medium">{VARIETIES.find((v) => v.key === sale.variety_key)?.label}</td><td className="px-5 py-3 whitespace-nowrap">{CHANNELS.find((c) => c.key === sale.channel)?.label || sale.channel}</td><td className="px-5 py-3 text-gray-700">{sale.sales_destination || '-'}</td><td className="px-5 py-3 text-right font-medium tabular-nums">{kg(number(sale.quantity_kg))}</td><td className="px-5 py-3 text-gray-500">{sale.note || '-'}</td><td className="px-5 py-3 text-right"><button type="button" onClick={() => removeSale(sale.id)} aria-label="販売・使用実績を削除" className="w-11 h-11 inline-flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-700 focus:ring-2 focus:ring-red-600"><IconTrash className="w-4 h-4" /></button></td></tr>)}</tbody></table></div>}
        </section>
      </>}
    </div>
  );
};

export default InventorySystem;
