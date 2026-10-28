"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { readAll } from "@/lib/loadStoreAnalytics";
import {
  externalRecordNeedsReview,
  shiitakeLiveStock,
  type ExternalOrderRecord,
} from "@/lib/externalOrderAccounting";
import type { ShiitakeBaseline } from "@/lib/shiitakeBaseline";
export default function ShiitakeLiveInventory({refreshKey=0}:{refreshKey?:number}={}) {
  const [baseline, setBaseline] = useState<ShiitakeBaseline | null>(null),
    [records, setRecords] = useState<ExternalOrderRecord[]>([]),
    [entries, setEntries] = useState<any[]>([]);
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [date, setDate] = useState(
      new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10),
    ),
    [quantity, setQuantity] = useState("1"),
    [reason, setReason] = useState("");
  const requestId = useRef<string | null>(null);
  const [received, setReceived] = useState<string | null>(null),
    [unkeyed, setUnkeyed] = useState(0);
  const load = useCallback(async () => {
    setReady(false);
    setBusy(true);
    setError("");
    try {
      if (!supabase) throw new Error();
      const [b, r, e, s] = await Promise.all([
        supabase
          .from("shiitake_stock_baselines")
          .select("*")
          .eq("source", "shiitake_yorankasha")
          .maybeSingle(),
        readAll<ExternalOrderRecord>(
          supabase,
          "external_order_records",
          "*",
          "source_key",
        ),
        readAll<any>(supabase, "shiitake_stock_entries", "*"),
        supabase
          .from("external_sheet_snapshots")
          .select("captured_at,payload")
          .eq("source", "shiitake_yorankasha")
          .maybeSingle(),
      ]);
      if (b.error || s.error) throw b.error || s.error;
      setBaseline(b.data);
      setRecords(r);
      setEntries(e);
      setReceived(s.data?.captured_at || null);
      setUnkeyed(
        (s.data?.payload?.lines || []).filter((l: any) => !l.sourceKey).length,
      );
      setReady(true);
    } catch {
      setError(
        "実在庫の連携データを取得できません。追加SQL・接続を確認してください。",
      );
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load,refreshKey]);
  const totals = ready ? shiitakeLiveStock(baseline, records, entries) : null;
  const unresolved = records.filter(
    (r) => r.source === "shiitake_yorankasha" && externalRecordNeedsReview(r),
  ).length;
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || busy) return;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date ||
      !/^[-]?\d+$/.test(quantity) ||
      Number(quantity) === 0 ||
      Math.abs(Number(quantity)) > 9999 ||
      !reason.trim()
    ) {
      setError("実在日付・0以外の整数数量・理由を確認してください");
      return;
    }
    if (!requestId.current) requestId.current = crypto.randomUUID();
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.rpc("record_shiitake_stock_entry", {
        p_id: requestId.current,
        p_date: date,
        p_quantity: Number(quantity),
        p_reason: reason.trim(),
      });
      if (error) throw error;
      requestId.current = null;
      setNotice("入出庫を記録しました。");
      setReason("");
      await load();
    } catch {
      setError("保存できません。再送は同じIDで行い、二重登録を防止します。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="space-y-4 rounded-xl border bg-white p-5"
      aria-label="椎茸の実在庫集計"
    >
      <h2 className="text-xl font-bold">乾椎茸（原木）・直売所在庫</h2>
      <button
        type="button"
        disabled={busy}
        onClick={() => void load()}
        className="rounded border px-4 py-2"
      >
        実在庫を更新
      </button>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {totals ? (
        <>
          <p className="text-3xl font-bold">
            {totals.stock}個{" "}
            <span className="text-sm font-normal">確認済み分の推定在庫</span>
          </p>
          <p>
            開始 {baseline!.quantity}個 ＋ 補充・調整 {totals.added}個 − 売上{" "}
            {totals.sold}個 ／ 目標18個まであと{totals.needed}個
          </p>
        </>
      ) : (
        <p>
          開始在庫が未登録、または連携データ未取得です。18個を現在庫として仮登録することはありません。
        </p>
      )}
      {ready && (
        <p className="text-amber-800">
          売上最終受信：{received || "未受信"}。要確認 {unresolved + unkeyed}
          件。未照合・未受信の売上は差し引いていません。初期設定時の18個とは別に、目標在庫は18個です。入荷するまでは自動補充されません。
        </p>
      )}
      <form onSubmit={save} className="space-y-3">
        <h3 className="font-semibold">補充・理由付き調整</h3>
        <fieldset disabled={!ready || !baseline || busy} className="space-y-3">
          <label className="block">
            入出庫日
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                requestId.current = null;
              }}
              className="ml-2 rounded border p-2"
            />
          </label>
          <label className="block">
            増減数（補充は正、回収は負）
            <input
              type="number"
              min="-9999"
              max="9999"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                requestId.current = null;
              }}
              className="ml-2 rounded border p-2"
            />
          </label>
          <label className="block">
            理由
            <input
              value={reason}
              maxLength={200}
              onChange={(e) => {
                setReason(e.target.value);
                requestId.current = null;
              }}
              className="ml-2 rounded border p-2"
            />
          </label>
          <button className="rounded bg-emerald-800 px-4 py-2 text-white">
            入出庫を保存
          </button>
        </fieldset>
      </form>
      <details>
        <summary>入出庫履歴</summary>
        <ul>
          {entries
            .slice()
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .slice(0, 30)
            .map((e) => (
              <li key={e.id}>
                {e.entry_date}：{e.quantity > 0 ? "+" : ""}
                {e.quantity}個 ／ {e.reason}
              </li>
            ))}
        </ul>
      </details>
    </section>
  );
}
