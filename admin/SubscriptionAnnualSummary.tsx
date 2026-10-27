'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { annualShipmentSummary } from '@/lib/subscriptionAnnualSummary';
export default function SubscriptionAnnualSummary({ orders }: { orders: any[] }) {
  const [report, setReport] = useState<any>(null);
  const [season, setSeason] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    if (!supabase) { setFailed(true); return; }
    supabase.rpc('kg_report').then(({ data, error }) => {
      if (!live) return;
      if (error || data?.accounting_version !== 2 || data.accounting_paused) { setFailed(true); return; }
      setReport(data); setSeason(data.seasons?.[0]?.id || '');
    });
    return () => { live = false; };
  }, []);
  if (failed) return <p className="rounded border border-amber-200 bg-amber-50 p-4 text-sm">年間発送量は未取得です。在庫設定・定期便の紐付けを確認してください。</p>;
  if (!report) return <p className="text-sm text-gray-500">年産別の発送量を読込中...</p>;
  const result = annualShipmentSummary(report, season, orders);
  return <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
    <div className="flex flex-wrap gap-4 items-center"><h2 className="font-semibold">定期便の年産別発送推定量</h2><label className="text-sm">年産 <select value={season} onChange={e => setSeason(e.target.value)} className="border rounded p-2">{report.seasons?.map((s: any) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label></div>
    <p className="text-xs text-gray-500">商品重量kg（玄米換算前）。在庫台帳に紐付け済みの発送実績と予定のみ集計します。検索・一覧フィルターには連動しません。</p>
    <div className="grid gap-3 sm:grid-cols-3">{result.rows.map(row => <div key={row.key} className="rounded border p-3"><h3>{row.label}</h3><p className="text-xs text-gray-500">期限：{report.harvest_rules?.find((r: any) => r.season_id === season && r.variety_key === row.key)?.end_month?.slice(0, 7) || '未設定'}</p><p className="font-semibold text-lg">{(row.shipped + row.planned).toLocaleString()} kg</p><p className="text-xs">発送済み {row.shipped} kg ＋ 予定 {row.planned} kg</p></div>)}</div>
    <p className="text-xs text-amber-800">確認済み分の参考値です。未紐付け・要確認の契約は含まれません。検出した未判定：{result.unclassified}件。最終的な発送量は在庫設定の照合後に確定してください。</p>
  </section>;
}
