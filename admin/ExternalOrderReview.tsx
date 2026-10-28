"use client";
import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { readAll } from "@/lib/loadStoreAnalytics";
import { externalSheetSources } from "@/lib/externalOrderSheets";
import {
  externalRecordNeedsReview,
  type ExternalOrderRecord,
} from "@/lib/externalOrderAccounting";
import { customerFullName } from "@/lib/adminCustomerData";
export default function ExternalOrderReview() {
  const [records, setRecords] = useState<ExternalOrderRecord[]>([]),
    [customers, setCustomers] = useState<any[]>([]),
    [snapshots, setSnapshots] = useState<any[]>([]);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false);
  const [key, setKey] = useState(""),
    [customer, setCustomer] = useState(""),
    [amount, setAmount] = useState(""),
    [enabled, setEnabled] = useState(false),
    [reason, setReason] = useState("");
  const [source, setSource] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    setReady(false);
    setError("");
    try {
      if (!supabase) throw new Error("接続設定がありません");
      const [r, c, s] = await Promise.all([
        readAll<ExternalOrderRecord>(
          supabase,
          "external_order_records",
          "*",
          "source_key",
        ),
        readAll<any>(supabase, "customers", "id,last_name,first_name"),
        readAll<any>(
          supabase,
          "external_sheet_snapshots",
          "source,captured_at,payload",
          "source",
        ),
      ]);
      setRecords(r);
      setCustomers(c);
      setSnapshots(s);
      setReady(true);
    } catch {
      setError(
        "外部注文を取得できません。連携SQLと権限・接続をご確認ください。",
      );
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  function choose(r: ExternalOrderRecord) {
    setKey(r.source_key);
    setCustomer(r.customer_id || "");
    setAmount(r.merchandise_yen == null ? "" : String(r.merchandise_yen));
    setEnabled(r.inventory_enabled);
    setReason("");
    setNotice("");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const record = records.find((r) => r.source_key === key);
    if (!supabase || !record || !ready || busy) return;
    if (
      !reason.trim() ||
      (amount !== "" && (!/^\d+$/.test(amount) || Number(amount) > 1e9))
    ) {
      setError("変更理由と商品代金（空欄または0以上の整数）を確認してください");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { error } = await supabase.rpc("approve_external_order", {
        p_key: key,
        p_revision: record.revision,
        p_inventory: enabled,
        p_customer: customer || null,
        p_merchandise: amount === "" ? null : Number(amount),
        p_reason: reason.trim(),
      });
      if (error) throw error;
      setNotice("照合結果を保存しました。在庫画面の「更新」で再集計できます。");
      setKey("");
      await load();
    } catch {
      setError(
        "保存できません。同期後の行を再読み込みし、明細ID・状態・必要項目を確認してください。",
      );
    } finally {
      setBusy(false);
    }
  }
  const visible = records.filter((r) => !source || r.source === source);
  const unkeyed = snapshots.reduce(
    (n, s) =>
      n + (s.payload?.lines || []).filter((l: any) => !l.sourceKey).length,
    0,
  );
  return (
    <section
      className="space-y-4 rounded-xl border bg-white p-5"
      aria-label="外部注文の取込確認"
    >
      <h2 className="text-xl font-bold">外部注文の取込・照合</h2>
      <p className="text-sm">
        初回はシートに不変の明細IDと年産・数量・状態を設定し、既存EC注文・手動記録と重複しないことを確認して在庫計上を許可してください。その後の有効な数量変更・取消は自動再集計します。行削除や不正な編集では以前の計上を保持し、要確認にします。
      </p>
      <button
        type="button"
        onClick={() => void load()}
        disabled={busy}
        className="rounded border px-4 py-2"
      >
        取込データを再読み込み
      </button>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {ready && (
        <>
          <p>
            取込 {records.length}明細 ／ 要確認{" "}
            {records.filter(externalRecordNeedsReview).length}明細 ／ 識別不能{" "}
            {unkeyed}行（元シートの明細IDを確認）
          </p>
          <ul className="text-xs text-gray-600">
            {externalSheetSources.map((s) => (
              <li key={s.id}>
                {s.tab}：
                {snapshots.find((x) => x.source === s.id)?.captured_at ||
                  "未受信"}
              </li>
            ))}
          </ul>
          <label>
            販売元{" "}
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="ml-2 rounded border p-2"
            >
              <option value="">すべて</option>
              {externalSheetSources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.tab}
                </option>
              ))}
            </select>
          </label>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>商品</th>
                  <th>数量</th>
                  <th>状態</th>
                  <th>在庫計上</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.source_key} className="border-t">
                    <td className="p-2">{r.payload.date || "未確認"}</td>
                    <td>{r.payload.product}</td>
                    <td>{r.payload.quantity ?? "未確認"}</td>
                    <td>
                      {r.source_missing ? "元シートから消失" : r.payload.status}
                      {r.payload.issues.length > 0 && (
                        <p className="text-amber-800">
                          {r.payload.issues.join("／")}
                        </p>
                      )}
                    </td>
                    <td>{r.inventory_enabled ? "照合済み" : "未計上"}</td>
                    <td>
                      <button
                        type="button"
                        className="underline"
                        onClick={() => choose(r)}
                      >
                        照合・設定
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {key && (
            <form onSubmit={save} className="space-y-3 rounded border p-4">
              <h3 className="font-bold">
                {records.find((r) => r.source_key === key)?.payload.product}
                の照合
              </h3>
              <label className="block">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />{" "}
                既存のEC・手動在庫記録と重複がないことを確認し、在庫に計上する
              </label>
              <label className="block">
                紐付ける顧客（氏名だけで自動判定しません）
                <select
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="block w-full rounded border p-2"
                >
                  <option value="">未紐付け</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {customerFullName(c)} ／ {c.id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                紹介集計用の商品代金（送料除外・値引後・税込／未確認は空欄）
                <input
                  type="number"
                  min="0"
                  max="1000000000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block rounded border p-2"
                />
              </label>
              <p className="text-xs">
                食べチョクは紹介還元対象外です。数量・金額・商品などが同期後に変わると、商品代金の再確認が必要になります。
              </p>
              <label className="block">
                照合・変更理由
                <input
                  maxLength={200}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="block w-full rounded border p-2"
                />
              </label>
              <button
                disabled={busy}
                className="rounded bg-emerald-800 px-4 py-2 text-white"
              >
                照合結果を保存
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
