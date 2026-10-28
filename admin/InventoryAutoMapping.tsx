"use client";
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { varieties } from '@/lib/kgInventory';
import { millingLabels } from '@/lib/inventoryPresentation';
import { autoMappingError, autoMappingTotals, decodeAutoBatch, type AutoBatch, type AutoSummary } from '@/lib/inventoryAutoMapping';

const button = 'min-h-11 rounded-lg bg-emerald-800 px-4 py-2 text-sm text-white disabled:opacity-40';
const field = 'min-h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm';
const kg = (n: number) => `${n.toLocaleString('ja-JP', { maximumFractionDigits: 6 })} kg`;
type Props = { harvestYear?: number; disabled?: boolean; onRefresh: () => void };

export default function InventoryAutoMapping({ harvestYear, disabled, onRefresh }: Props) {
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [batch, setBatch] = useState<AutoBatch | null>(null);
  const [summary, setSummary] = useState<AutoSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [approved, setApproved] = useState(false);
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'ready' | 'exclude'>('all');
  const [page, setPage] = useState(0);
  const [needsReload, setNeedsReload] = useState(false);
  const locked = useRef(false), stop = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; stop.current = true; }; }, []);
  const year = scope === 'current' ? harvestYear : null;
  const blocked = busy || !!disabled || (scope === 'current' && !Number.isInteger(harvestYear));

  async function readBatch(id: string) {
    if (!supabase) throw new Error('接続設定がありません');
    const result = await supabase.from('kg_auto_mapping_batches')
      .select('id,harvest_year,candidates,processed').eq('id', id).single();
    if (result.error) throw result.error;
    return decodeAutoBatch(result.data);
  }
  async function inspect(resume: boolean) {
    if (locked.current || blocked) return;
    locked.current = true; setBusy(true); setError(''); setNotice(''); setApproved(false);
    try {
      if (!supabase) throw new Error('接続設定がありません');
      let id: string;
      let counts: AutoSummary[] = [];
      if (resume) {
        let query = supabase.from('kg_auto_mapping_batches').select('id').order('created_at', { ascending: false }).limit(1);
        query = year === null ? query.is('harvest_year', null) : query.eq('harvest_year', year);
        const result = await query;
        if (result.error) throw result.error;
        if (!result.data?.[0]?.id) throw new Error('この年産範囲の保存済み結果はありません。「自動判定する」を押してください。');
        id = result.data[0].id;
      } else {
        const result = await supabase.rpc('kg_auto_mapping_prepare', { p_year: year });
        if (result.error) throw result.error;
        if (!result.data?.batch_id) throw new Error('判定結果を保存できませんでした');
        id = result.data.batch_id;
        counts = Array.isArray(result.data.summary) ? result.data.summary : [];
      }
      const saved = await readBatch(id);
      if (saved.harvest_year !== year) throw new Error('確認結果の年産が選択と異なります。再判定してください。');
      if (!mounted.current) return;
      setBatch(saved); setSummary(counts); setPage(0); setFilter('all'); setNeedsReload(false);
      setNotice(resume ? '保存した確認結果と処理状況を再取得しました。内容を確認して再開できます。' : '自動判定しました。在庫はまだ変更していません。');
    } catch (e) {
      if (mounted.current) { setBatch(null); setSummary([]); setError(autoMappingError(e)); }
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function apply() {
    if (locked.current || blocked || !batch || !approved || !reason.trim() || reason.trim().length > 200 || needsReload) return;
    locked.current = true; stop.current = false; setBusy(true); setApplying(true); setError(''); setNotice('');
    let current = batch;
    try {
      if (!supabase) throw new Error('接続設定がありません');
      // Explicit confirmation covers the frozen batch. Bound each transaction and
      // stop between calls, never automatically retry an ambiguous network error.
      const maxCalls = Math.ceil((batch.candidates.length - batch.processed) / 100);
      for (let call = 0; call < maxCalls && !stop.current; call++) {
        const result = await supabase.rpc('kg_auto_mapping_apply_batch', {
          p_batch: batch.id, p_reason: reason.trim(), p_no_manual_overlap: true, p_limit: 100,
        });
        if (result.error) throw result.error;
        const remaining = result.data?.remaining;
        const previous = current.candidates.length - current.processed;
        if (!Number.isInteger(remaining) || remaining < 0 || remaining >= previous) {
          throw new Error('進捗を確認できません。保存済みの処理状況を再取得してください。');
        }
        current = { ...current, processed: current.candidates.length - remaining };
        if (!mounted.current) return;
        setBatch(current);
        setNotice(`${current.processed} / ${current.candidates.length}明細を処理済みです。`);
        if (remaining === 0) break;
      }
      if (mounted.current) {
        setApproved(false);
        setNotice(current.processed === current.candidates.length
          ? '一括反映が完了しました。「在庫表示を更新」で最新の集計を確認してください。'
          : '停止しました。処理済み分は保存されています。再確認して残りを反映できます。');
      }
    } catch (e) {
      if (mounted.current) {
        setNeedsReload(true); setApproved(false);
        setError(`${autoMappingError(e)} 処理済みの分がある可能性があります。「保存済みの処理状況を再取得」で確認してください。`);
      }
    } finally {
      locked.current = false;
      if (mounted.current) { setBusy(false); setApplying(false); }
    }
  }

  const candidates = batch?.candidates || [];
  const shown = candidates.filter(c => filter === 'all' || c.status === filter);
  const ready = candidates.filter(c => c.status === 'ready').length;
  const totals = batch ? autoMappingTotals(batch) : [];
  const remaining = batch ? candidates.length - batch.processed : 0;
  return (
    <section aria-labelledby="auto-mapping-heading" className="rounded-2xl border border-emerald-200 bg-white p-5 md:p-6">
      <h2 id="auto-mapping-heading" className="text-lg font-bold">過去注文を自動で振り分け</h2>
      <p className="mt-2 text-sm text-gray-600">Supabaseの購入時情報を使い、お米・お米以外・要確認に分類します。判定だけでは在庫は変わりません。</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">判定する年産範囲
          <select className={field} value={scope} disabled={busy || disabled} onChange={e => {
            setScope(e.target.value as 'current' | 'all'); setBatch(null); setSummary([]); setApproved(false); setError(''); setNotice(''); setNeedsReload(false);
          }}>
            <option value="current">選択中の{harvestYear ? `${harvestYear}年産` : '年産'}</option>
            <option value="all">登録済みの全年産</option>
          </select>
        </label>
        <button type="button" className={button} disabled={blocked} onClick={() => void inspect(false)}>自動判定する</button>
        <button type="button" className={`${field} disabled:opacity-40`} disabled={blocked} onClick={() => void inspect(true)}>保存済みの処理状況を再取得</button>
      </div>
      <p className="mt-2 text-xs text-gray-600">お米以外の候補は年産に関係なく含みます。別年産・年産不明・定期便・内訳不明を、選択中の新米から引くことはありません。</p>
      {busy ? <p role="status" className="mt-3 text-sm">{applying ? '反映中です。画面を閉じると、直前の100件は処理が完了する場合があります。' : '判定結果を読み込んでいます。在庫は変更していません。'}</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
      {notice ? <p role="status" className="mt-3 text-sm text-emerald-800">{notice}</p> : null}
      {summary.length ? <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">全体の判定内訳・要確認の理由</summary>
        <ul className="mt-2 space-y-1">{summary.map((s, i) => <li key={i}>{s.harvest_year ? `${s.harvest_year}年産：` : ''}{s.reason}：{s.items}明細</li>)}</ul>
      </details> : null}
      {batch ? <div className="mt-5 space-y-4">
        <p className="text-sm font-semibold">今回の反映候補：お米 {ready}明細 ／ お米以外 {candidates.length - ready}明細 ／ 処理済み {batch.processed}明細 ／ 残り {remaining}明細</p>
        {totals.length ? <div className="rounded-lg bg-gray-50 p-3 text-sm"><p className="font-semibold">候補全体の玄米換算量（販売済み・確保中の合計対象）</p>
          <ul className="mt-1">{totals.map(t => <li key={`${t.year}:${t.variety}`}>{t.year}年産・{varieties[t.variety]}：{kg(t.kg)}</li>)}</ul>
          <p className="mt-1 text-xs text-gray-600">この確認結果の対象量です。現在の在庫残量や今回新たに減る量とは異なります。反映済みの明細は再計上しません。</p>
        </div> : null}
        <label className="flex flex-wrap items-center gap-2 text-sm">表示する候補
          <select className={field} value={filter} onChange={e => { setFilter(e.target.value as typeof filter); setPage(0); }}>
            <option value="all">すべて</option><option value="ready">お米のみ</option><option value="exclude">お米以外のみ</option>
          </select>
        </label>
        <p className="text-xs text-gray-600">{shown.length}明細中 {shown.length ? page * 20 + 1 : 0}〜{Math.min((page + 1) * 20, shown.length)}明細。表示の絞り込みに関係なく、確認したバッチ全体が反映対象です。</p>
        <ul className="divide-y">{shown.slice(page * 20, (page + 1) * 20).map(c => <li key={c.item_id} className="py-3 text-sm">
          <p className="font-semibold">{c.order_number || c.item_id} · {c.title} × {c.quantity}</p>
          <p className="mt-1 text-gray-600">{c.status === 'exclude' ? 'お米の重量在庫から除外' : `${c.harvest_year}年産`}</p>
          {c.components.map((p, i) => <p key={i} className="text-xs text-gray-600">{varieties[p.variety_key]}・{millingLabels[p.milling!]}・1個あたり{kg(p.unit_kg)}</p>)}
        </li>)}</ul>
        <div className="flex gap-3"><button type="button" className={field} disabled={page === 0} onClick={() => setPage(p => p - 1)}>前の20件</button>
          <button type="button" className={field} disabled={(page + 1) * 20 >= shown.length} onClick={() => setPage(p => p + 1)}>次の20件</button></div>
        {remaining > 0 ? <div className="space-y-3 border-t pt-4">
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" disabled={busy || needsReload} checked={approved} onChange={e => setApproved(e.target.checked)} />
            候補全体の商品・年産・精米区分・数量を確認し、開始残高や手動登録との二重計上がないことを確認しました</label>
          <label className="grid gap-1 text-sm">確認・反映の理由（必須）<input className={field} maxLength={200} value={reason} disabled={busy || needsReload} onChange={e => setReason(e.target.value)} /></label>
          <div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={blocked || needsReload || !approved || !reason.trim()} onClick={() => void apply()}>確認済みの残り{remaining}明細を一括反映</button>
            {applying ? <button type="button" className={field} onClick={() => { stop.current = true; setNotice('現在の100件の処理が終わり次第、停止します。'); }}>次の100件へ進まず停止</button> : null}
          </div>
        </div> : <p className="text-sm">この確認結果に未処理の候補はありません。</p>}
        <button type="button" className={field} disabled={busy || disabled} onClick={onRefresh}>在庫表示を更新</button>
      </div> : null}
    </section>
  );
}
