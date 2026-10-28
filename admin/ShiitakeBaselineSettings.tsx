"use client";

import React, { useCallback, useEffect, useId, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShiitakeBaseline, suggestedShiitakeBaseline, validateShiitakeBaseline } from '@/lib/shiitakeBaseline';
import styles from './ShiitakeInventory.module.css';

export default function ShiitakeBaselineSettings() {
  const prefix = useId();
  const [baseline, setBaseline] = useState<ShiitakeBaseline | null>(null);
  const [history, setHistory] = useState<ShiitakeBaseline[]>([]);
  const [date, setDate] = useState(suggestedShiitakeBaseline.date);
  const [phase, setPhase] = useState<string>(suggestedShiitakeBaseline.phase);
  const [quantity, setQuantity] = useState(String(suggestedShiitakeBaseline.quantity));
  const [reason, setReason] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false);

  const request = useCallback(async (method: 'GET' | 'POST', body?: unknown) => {
    if (!supabase) throw new Error('管理画面の接続が未設定です');
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error('管理者としてログインし直してください');
    const response = await fetch('/api/admin/shiitake-baseline', {
      method, cache: 'no-store', headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 409) setConflict(true);
      throw new Error(result.error || '開始在庫設定を取得・保存できませんでした');
    }
    return result;
  }, []);
  const load = useCallback(async () => {
    setBusy(true); setError(''); setNotice(''); setLoaded(false);
    try {
      const result = await request('GET');
      const saved: ShiitakeBaseline | null = result.baseline;
      setBaseline(saved); setHistory(result.history || []);
      setDate(saved?.baseline_date ?? suggestedShiitakeBaseline.date);
      setPhase(saved?.phase ?? suggestedShiitakeBaseline.phase);
      setQuantity(String(saved?.quantity ?? suggestedShiitakeBaseline.quantity));
      setReason(''); setConflict(false); setLoaded(true);
    } catch (e) { setError(e instanceof Error ? e.message : '読み込めませんでした'); }
    finally { setBusy(false); }
  }, [request]);
  useEffect(() => { void load(); }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!loaded || busy || conflict) return;
    setError(''); setNotice('');
    let input;
    try {
      if (quantity.trim() === '') throw new Error('開始在庫の数量を入力してください');
      input = validateShiitakeBaseline({ date, phase, quantity: Number(quantity), reason, expectedRevision: baseline?.revision ?? 0 });
    } catch (e) { setError((e as Error).message); return; }
    setBusy(true);
    try {
      const result = await request('POST', input);
      const saved: ShiitakeBaseline = result.baseline;
      setBaseline(saved); setHistory(previous => [saved, ...previous].slice(0, 10)); setReason('');
      setNotice('開始在庫の設定を保存しました。売上連携後は、この基準で再計算します。現在の推定在庫はまだ更新していません。');
    } catch (e) { setError(e instanceof Error ? e.message : '保存できませんでした'); }
    finally { setBusy(false); }
  }

  return <section className={styles.details} aria-labelledby={`${prefix}-heading`}>
    <h2 id={`${prefix}-heading`}>開始在庫の設定</h2>
    <p>Aコープ金井店・乾椎茸（原木）。ここで保存する実データは、下のサンプル表示とは別です。</p>
    <p>補充目標の18個とは分けて管理します。後から修正でき、変更理由と履歴が残ります。</p>
    <p>{!loaded ? '設定を未確認' : baseline
      ? `保存済み：${baseline.baseline_date} ${baseline.phase === 'before_open' ? '営業前' : '営業終了後'}・${baseline.quantity}個`
      : '未保存：確認済みの「2026-10-20・営業前・18個」を入力候補として表示しています。'}</p>
    <form onSubmit={save} noValidate>
      <fieldset disabled={busy || !loaded || conflict} className={styles.baselineFields}>
        <div>
          <label className={styles.label} htmlFor={`${prefix}-date`}>開始在庫の基準日</label>
          <input className={styles.input} id={`${prefix}-date`} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className={styles.label} htmlFor={`${prefix}-phase`}>棚卸しした時点</label>
          <select className={styles.input} id={`${prefix}-phase`} value={phase} onChange={e => setPhase(e.target.value)}>
            <option value="before_open">営業前（当日の売上から差し引く）</option>
            <option value="after_close">営業終了後（翌日の売上から差し引く）</option>
          </select>
        </div>
        <div>
          <label className={styles.label} htmlFor={`${prefix}-quantity`}>開始在庫の数量（個）</label>
          <input className={styles.input} id={`${prefix}-quantity`} type="number" min="0" max="9999" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
        </div>
        <div>
          <label className={styles.label} htmlFor={`${prefix}-reason`}>開始在庫の変更理由（必須）</label>
          <textarea className={styles.textarea} id={`${prefix}-reason`} maxLength={200} value={reason} onChange={e => setReason(e.target.value)} placeholder="初回の棚卸しを登録／数え間違いを訂正 など" />
        </div>
      </fieldset>
      <p>{phase === 'before_open' ? `${date}当日の売上を含めて差し引きます。` : `${date}当日の売上は差し引かず、翌日から対象です。`} 基準日を変更しても、元の売上履歴は削除しません。</p>
      <button className={styles.save} type="submit" disabled={busy || !loaded || conflict}>{busy ? '処理中…' : '開始在庫を保存する'}</button>
    </form>
    <button className={styles.textButton} type="button" disabled={busy} onClick={() => void load()}>開始在庫設定を再読み込み</button>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {notice && <p role="status" className={styles.success}>{notice}</p>}
    <details><summary>開始在庫の変更履歴（最新10件）</summary>
      {history.length === 0 ? <p>保存済みの履歴はありません。</p> : <ol>{history.map(entry => <li key={entry.revision}>
        {entry.baseline_date}・{entry.phase === 'before_open' ? '営業前' : '営業終了後'}・{entry.quantity}個 ／ {entry.reason}
      </li>)}</ol>}
    </details>
  </section>;
}
