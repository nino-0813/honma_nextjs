"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { customerFullName } from "@/lib/adminCustomerData";
import { loadReferralMonthly } from "@/lib/loadReferralMonthly";
import { referralMonthly, referralCategories } from "@/lib/referralMonthly";
const money = (n: number) => `¥${n.toLocaleString("ja-JP")}`;
export default function ReferralMonthlyDashboard() {
  const [data, setData] = useState<Awaited<
      ReturnType<typeof loadReferralMonthly>
    > | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [month, setMonth] = useState(
      new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 7),
    ),
    [referrer, setReferrer] = useState(""),
    [search, setSearch] = useState("");
  const [kind, setKind] = useState("direct"),
    [customer, setCustomer] = useState(""),
    [saleKey, setSaleKey] = useState(""),
    [date, setDate] = useState(
      new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10),
    ),
    [amount, setAmount] = useState(""),
    [reference, setReference] = useState(""),
    [reason, setReason] = useState("");
  const requestId = useRef<string | null>(null);
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      if (!supabase) throw new Error();
      setData(await loadReferralMonthly(supabase));
    } catch {
      setData(null);
      setError(
        "紹介集計を取得できません。外部注文・紹介集計用SQLと接続をご確認ください。未取得を0円として表示しません。",
      );
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const report = useMemo(
    () =>
      data && /^20\d{2}-(0[1-9]|1[0-2])$/.test(month)
        ? referralMonthly(month, data.sales, data.refunds, referrer)
        : null,
    [data, month, referrer],
  );
  const byId = useMemo(
    () => new Map((data?.customers || []).map((c) => [c.id, c])),
    [data],
  );
  const name = (id: string) => {
    const c = byId.get(id);
    return c ? customerFullName(c) : "顧客未確認";
  };
  const referrers = (data?.customers || []).filter(
    (c) =>
      (data?.customers || []).some(
        (child) => child.referred_by_customer_id === c.id,
      ) && customerFullName(c).toLowerCase().includes(search.toLowerCase()),
  );
  const referred = (data?.customers || []).filter(
    (c) =>
      c.referred_by_customer_id &&
      byId.has(c.referred_by_customer_id) &&
      (!referrer || c.referred_by_customer_id === referrer),
  );
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || busy) return;
    if (!/^\d+$/.test(amount)) {
      setError("商品代金・返金額は整数で入力してください");
      return;
    }
    if (!requestId.current) requestId.current = crypto.randomUUID();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("ログインしてください");
      const response = await fetch("/api/admin/referral-entry", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: requestId.current,
          kind,
          customerId: customer,
          saleKey,
          date,
          amount: Number(amount),
          reference,
          reason,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "保存に失敗しました");
      requestId.current = null;
      setAmount("");
      setReference("");
      setReason("");
      setNotice(
        "集計用の記録を保存しました。実際の決済・返金・在庫更新は行っていません。",
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const reset = () => {
    requestId.current = null;
  };
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">紹介実績・月別還元額</h1>
        <p className="mt-2 text-sm text-gray-600">
          注文日を日本時間の月で集計。税込・送料除外・商品値引き後。食べチョクは還元対象外です。
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <label>
          対象年月{" "}
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded border p-2"
          />
        </label>
        <label>
          紹介者名検索{" "}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border p-2"
          />
        </label>
        <label>
          紹介者{" "}
          <select
            value={referrer}
            onChange={(e) => setReferrer(e.target.value)}
            className="rounded border p-2"
          >
            <option value="">全紹介者</option>
            {referrers.map((c) => (
              <option key={c.id} value={c.id}>
                {customerFullName(c)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={busy}
          className="rounded border px-4 py-2"
        >
          再集計
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {report && data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["対象月の商品売上", report.totalSales],
              ["返金月の商品控除", -report.totalRefunds],
              ["還元額（返金反映後）", report.totalCommission],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border bg-white p-5">
                <p>{label}</p>
                <strong className="text-2xl">{money(Number(value))}</strong>
              </div>
            ))}
          </div>
          <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
            確認済みデータの集計です。返金は下の記録で返金日・商品分を照合してください。返金額だけから送料を推測しません。要確認がある間は精算未確定です。
          </p>
          <div className="overflow-x-auto rounded-xl border bg-white p-4">
            <table className="w-full text-right text-sm">
              <thead>
                <tr>
                  <th className="text-left">区分</th>
                  <th>売上</th>
                  <th>返金控除</th>
                  <th>差引売上</th>
                  <th>還元率</th>
                  <th>還元額</th>
                  <th>返金による還元調整</th>
                  <th>差引還元額</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r) => (
                  <tr key={r.category} className="border-t">
                    <th className="py-3 text-left">{r.label}</th>
                    <td>{money(r.sales)}</td>
                    <td>{money(-r.refunds)}</td>
                    <td>{money(r.net)}</td>
                    <td>{r.rate}%</td>
                    <td>{money(r.commission)}</td>
                    <td>{money(r.refundCommission)}</td>
                    <td>{money(r.netCommission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details>
            <summary>
              要確認 {data.issues.length + report.issues.length}
              件（全期間の未照合を含む）
            </summary>
            <ul>
              {[...data.issues, ...report.issues].map((i, index) => (
                <li key={`${i.key}-${index}`}>
                  {i.key}：{i.reason}
                </li>
              ))}
            </ul>
          </details>
          <details>
            <summary>
              紹介顧客 {referred.length}人・対象月の売上明細{" "}
              {report.details.length}件
            </summary>
            <ul>
              {referred.map((c) => (
                <li key={c.id}>
                  <Link
                    className="text-blue-700 underline"
                    href={`/admin/customer-list/${encodeURIComponent(c.id)}`}
                  >
                    {customerFullName(c)}
                  </Link>{" "}
                  ／ 紹介者：{name(c.referred_by_customer_id)}
                </li>
              ))}
            </ul>
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th>注文日</th>
                  <th>顧客</th>
                  <th>注文</th>
                  <th>区分</th>
                  <th>商品代金</th>
                </tr>
              </thead>
              <tbody>
                {report.details.map((s) => (
                  <tr key={s.key}>
                    <td>{s.date}</td>
                    <td>{name(s.customerId)}</td>
                    <td>{s.label}</td>
                    <td>{referralCategories[s.category].label}</td>
                    <td>{money(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
          <details>
            <summary>対象月の返金控除 {report.refundDetails.length}件</summary>
            <ul>
              {report.refundDetails.map(({ sale, refund }) => (
                <li key={refund.id}>
                  {refund.refunded_on} ／ {sale.label} ／{" "}
                  {money(-Number(refund.merchandise_yen))} ／{" "}
                  {refund.external_reference}
                </li>
              ))}
            </ul>
          </details>
          <details className="rounded-xl border bg-white p-5">
            <summary>直接注文・返金済みの記録を追加</summary>
            <p className="my-3 text-sm">
              集計用の記録です。Stripeへの返金・送金はしません。直接注文の在庫は入出庫で別途記録し、外部シートとの重複を避けてください。
            </p>
            <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
              <fieldset disabled={busy} className="contents">
                <label>
                  記録の種類
                  <select
                    value={kind}
                    onChange={(e) => {
                      setKind(e.target.value);
                      reset();
                    }}
                    className="block w-full rounded border p-2"
                  >
                    <option value="direct">直接注文の商品売上</option>
                    <option value="refund">返金済みの商品返金額</option>
                  </select>
                </label>
                {kind === "direct" ? (
                  <label>
                    顧客
                    <select
                      value={customer}
                      onChange={(e) => {
                        setCustomer(e.target.value);
                        reset();
                      }}
                      className="block w-full rounded border p-2"
                    >
                      <option value="">選択してください</option>
                      {data.customers.map((c) => (
                        <option value={c.id} key={c.id}>
                          {customerFullName(c)} ／ {c.id}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label>
                    返金元の売上
                    <select
                      value={saleKey}
                      onChange={(e) => {
                        setSaleKey(e.target.value);
                        reset();
                      }}
                      className="block w-full rounded border p-2"
                    >
                      <option value="">選択してください</option>
                      {data.sales.map((s) => (
                        <option value={s.key} key={s.key}>
                          {s.date} ／ {s.label} ／{" "}
                          {referralCategories[s.category].label} ／{" "}
                          {money(s.amount)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  {kind === "direct" ? "販売日" : "返金日"}
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      reset();
                    }}
                    className="block w-full rounded border p-2"
                  />
                </label>
                <label>
                  {kind === "direct"
                    ? "商品代金（値引後・送料除外）"
                    : "商品分の返金額（送料除外）"}
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      reset();
                    }}
                    className="block w-full rounded border p-2"
                  />
                </label>
                <label>
                  {kind === "direct"
                    ? "一意の販売伝票番号"
                    : "一意の返金ID（Stripeのre_…等）"}
                  <input
                    value={reference}
                    maxLength={200}
                    onChange={(e) => {
                      setReference(e.target.value);
                      reset();
                    }}
                    className="block w-full rounded border p-2"
                  />
                </label>
                <label>
                  登録理由
                  <input
                    value={reason}
                    maxLength={200}
                    onChange={(e) => {
                      setReason(e.target.value);
                      reset();
                    }}
                    className="block w-full rounded border p-2"
                  />
                </label>
                <button className="rounded bg-emerald-800 p-3 text-white">
                  集計用の記録を保存
                </button>
              </fieldset>
            </form>
          </details>
        </>
      )}
    </div>
  );
}
