"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import KgSubscriptionSettings, {
  type RawBaseline,
  type ContractPlan,
  type DeliverySlot,
  type SubscriptionRow,
} from "./KgSubscriptionSettings";
import InventoryMapping from "./InventoryMapping";
import LegacyInventorySystem from "./LegacyInventorySystem";
import { isKgReportUnavailable } from "@/lib/kgInventoryAvailability";
import { supabase } from "@/lib/supabase";
import {
  varieties,
  summarize,
  summarizeRaw,
  unresolvedOrders,
  type Movement,
  type Snapshot,
  type Order,
  type LegacyStock,
  type LegacySale,
  type LegacyReview,
} from "@/lib/kgInventory";

type Season = { id: string; label: string; harvest_year: number };
type Product = { id: string; title: string };
type Spec = {
  id: string;
  product_id: string;
  options: unknown;
  components: unknown;
  excluded: boolean;
  note: string;
};
type Data = {
  accounting_version?: number;
  accounting_paused?: boolean;
  raw_baselines?: RawBaseline[];
  plans?: ContractPlan[];
  slots?: DeliverySlot[];
  subscriptions?: SubscriptionRow[];
  harvest_rules?: {
    season_id: string;
    variety_key: string;
    end_month: string;
  }[];
  reviews: LegacyReview[];
  seasons: Season[];
  products: Product[];
  specs: Spec[];
  movements: Movement[];
  snapshots: Snapshot[];
  orders: Order[];
  stocks: LegacyStock[];
  sales: LegacySale[];
};
const empty: Data = {
  reviews: [],
  seasons: [],
  products: [],
  specs: [],
  movements: [],
  snapshots: [],
  orders: [],
  stocks: [],
  sales: [],
};
const formatKg = (n: number) =>
  `${n.toLocaleString("ja-JP", { maximumFractionDigits: 6 })} kg`;
const control =
  "mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm";
const button =
  "min-h-11 rounded-lg bg-emerald-800 px-4 py-2 text-white disabled:opacity-40";
const kinds: Record<string, string> = {
  receipt: "入庫",
  direct: "直売",
  wholesale: "卸",
  gift: "贈答",
  home_use: "自家用",
  adjustment: "理由付き調整",
  ec: "EC状態変更",
  forecast: "定期の将来確保",
  legacy_review: "旧確保照合",
};
export default function InventorySystem() {
  const [view, setView] = useState("overview");
  const [data, setData] = useState<Data>(empty),
    [season, setSeason] = useState("");
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [legacyMode, setLegacyMode] = useState(false);
  const [ready, setReady] = useState(false);
  const lock = useRef(false),
    request = useRef<string | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [movement, setMovement] = useState({
    variety: "koshihikari",
    kind: "receipt",
    milling: "",
    kg: "",
    reason: "",
  });
  const [legacy, setLegacy] = useState({
    variety: "koshihikari",
    kg: "0",
    reason: "",
  });
  const load = useCallback(async () => {
    setLoading(true);
    setLegacyMode(false);
    setError("");
    try {
      if (!supabase) throw new Error("接続設定がありません");
      const { data: report, error: reportError } =
        await supabase.rpc("kg_report");
      if (reportError) {
        if (isKgReportUnavailable(reportError)) {
          setData(empty);
          setReady(false);
          setLegacyMode(true);
          return;
        }
        throw new Error(reportError.message);
      }
      if (!report) throw new Error("管理者権限を確認してください");
      setData(report as Data);
      setReady(true);
      setSeason((s) => s || report.seasons[0]?.id || "");
    } catch (e) {
      setError((e as Error).message);
      setData(empty);
      setReady(false);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const unknown = useMemo(
    () =>
      unresolvedOrders(
        data.orders,
        data.snapshots,
        data.accounting_version === 2,
      ),
    [data],
  );
  const rawMode = data.accounting_version === 2;
  const rows = rawMode
    ? summarizeRaw(season, data.movements, data.raw_baselines || [])
    : summarize(season, data.movements, data.stocks, data.sales, data.reviews);
  const contractIssues =
    (data.subscriptions || []).filter(
      (s) =>
        ["active", "trialing", "paused", "past_due"].includes(s.status) &&
        !(data.plans || []).some((p) => p.subscription_id === s.id),
    ).length +
    (data.plans || []).filter((p) => !!p.issue).length +
    (data.slots || []).filter(
      (s) =>
        !s.canceled &&
        !s.item_id &&
        s.shipping_date <
          new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10),
    ).length;
  const uncertain =
    unknown.length > 0 ||
    contractIssues > 0 ||
    rows.some(
      (r) => r.reviewRequired || ("basisMissing" in r && r.basisMissing),
    );
  const harvestMissing =
    rawMode && rows.some((row) => "basisMissing" in row && row.basisMissing);
  async function save(
    action: () => PromiseLike<{ error: { message: string } | null }>,
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await action();
      if (result.error) throw new Error(result.error.message);
      request.current = null;
      setNotice("保存しました");
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function record(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    const convertsProduct =
      rawMode && !["receipt", "adjustment"].includes(movement.kind);
    const factor = (
      { white: 1.1, partial: 1.05, brown: 1 } as Record<string, number>
    )[movement.milling];
    if (convertsProduct && !factor) {
      setError("販売・使用分の精米区分を選択してください");
      return;
    }
    const amount = convertsProduct
      ? Math.round(Number(movement.kg) * factor * 1e6) / 1e6
      : Number(movement.kg);
    request.current ||= crypto.randomUUID();
    const saved = await save(() =>
      supabase!.rpc("kg_record_movement", {
        request: request.current,
        season,
        variety: movement.variety,
        kind: movement.kind,
        kg: amount,
        reason: convertsProduct
          ? `${movement.reason} / 製品${movement.kg}kg・${movement.milling}×${factor}`
          : movement.reason,
      }),
    );
    if (saved) setMovement((m) => ({ ...m, kg: "", reason: "" }));
  }
  if (rawMode && data.accounting_paused)
    return (
      <section
        role="alert"
        className="rounded-xl border border-red-300 bg-red-50 p-5"
      >
        <h1 className="text-xl font-bold">kg在庫連動を停止中</h1>
        <p>
          台帳は最新ではありません。在庫数の利用・編集を止め、停止期間の注文・出荷・契約変更を照合してください。トリガー再開だけでは過去イベントは再生されません。
        </p>
        <button className={`${button} mt-3`} onClick={load}>
          状態を再確認
        </button>
      </section>
    );
  if (legacyMode && !loading)
    return (
      <div className="space-y-6">
        <section
          role="status"
          aria-label="従来の在庫管理を表示中"
          className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950"
        >
          <h1 className="font-bold">従来の在庫管理（参考集計）</h1>
          <p className="mt-2">
            新しいkg管理の集計機能がDBに未導入、または関数の公開情報に未反映のため、従来画面を表示しています。収穫量・手動確保・販売使用実績は従来どおり閲覧・編集できます。
          </p>
          <p className="mt-2">
            以下は商品名・注文日から推定する旧方式の参考値です。購入時の銘柄・年産・重量を確定した新しいkg管理ではありません。残量や定期受付人数を、正確な販売可能量として使用しないでください。
          </p>
          <button type="button" className={`${button} mt-3`} onClick={load}>
            新しいkg管理の準備状況を再確認
          </button>
        </section>
        <LegacyInventorySystem />
      </div>
    );
  return (
    <div className="mx-auto max-w-[1500px] space-y-6 text-gray-900">
      <header>
        <h1 className="text-2xl font-bold">在庫システム</h1>
        <p className="mt-2 text-sm">
          選択した年産のお米がどれだけ使われ、注文{rawMode ? "・定期便" : ""}
          にどれだけ確保されているかを確認できます。
          収穫量は後から登録できます。
        </p>
      </header>
      {ready && !rawMode && (
        <section
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm"
        >
          <h2 className="font-bold">
            初期kg版を使用中（玄米換算・定期将来確保は未導入）
          </h2>
          <p>
            以下は初期版の重量基準による集計です。精米係数と未作成の定期発送分は含みません。玄米残量や定期受付可能量として使用しないでください。既存の閲覧・記録は引き続き利用できます。
          </p>
        </section>
      )}
      <details className="rounded-xl border border-gray-200 bg-white p-4 text-sm space-y-2">
        <summary className="cursor-pointer font-medium">
          在庫の計算方法と確認事項
        </summary>
        <p>
          販売可能量は倉庫の現物量ではありません。支払済み・未出荷は玄米基準では確保中として扱います。精米前後の重量基準を統一してください。
        </p>
        <p>
          未判定がある場合、販売可能量は確定できません。年産が不明な注文は全年度共通の要確認として表示します。発送済み返品は返金だけでは入庫せず、検品後に理由付き調整を登録してください。
        </p>
        <p>
          既存の手動確保は自動確保と重複する可能性があるため別表示します。照合完了まで販売可能量は未確定です。玄米基準では確認済み発送回の将来分を確保します。
        </p>
      </details>
      <div className="flex flex-wrap gap-3 items-end">
        <label>
          年産
          <select
            className={control}
            value={season}
            onChange={(e) => setSeason(e.target.value)}
          >
            {data.seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button className={button} disabled={busy || loading} onClick={load}>
          更新
        </button>
        <label hidden={view !== "settings"}>
          追加する収穫年
          <input
            className={control}
            type="number"
            min="2020"
            max="2100"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </label>
        <button
          className={button}
          hidden={view !== "settings"}
          disabled={busy || loading || !!error || year < 2020 || year > 2100}
          onClick={() =>
            save(() =>
              supabase!.from("inventory_seasons").insert({
                harvest_year: year,
                label: `${year}年産`,
                starts_on: `${year}-10-01`,
                ends_on: `${year + 1}-09-30`,
              }),
            )
          }
        >
          年産を追加
        </button>
      </div>
      <nav
        aria-label="在庫管理の画面"
        className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2"
      >
        {[
          ["overview", "在庫一覧"],
          ["record", "入出庫・販売履歴"],
          ["schedule", "定期便の発送予定"],
          ["settings", "詳細設定・過去データ"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={view === key}
            onClick={() => setView(key)}
            className={`min-h-11 shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${view === key ? "bg-emerald-800 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            {label}
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">
          読み込み・保存を完了できませんでした: {error}
          。権限・接続状態を確認して再試行してください。
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <p role="status">全件を集計中…</p>
      ) : (
        ready && (
          <>
            {unknown.length + contractIssues > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
                <p className="text-sm text-amber-900">
                  未判定 {unknown.length + contractIssues}
                  件（全年度）。確認済み分の残量を参考表示しています。
                </p>
                <button
                  type="button"
                  onClick={() => setView("settings")}
                  className="min-h-11 text-sm font-medium text-amber-900 underline"
                >
                  確認・設定へ
                </button>
              </div>
            )}
            <div hidden={view !== "overview"} className="space-y-6">
              {harvestMissing && (
                <section
                  aria-label="収穫量は後から登録できます"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-950"
                >
                  <div>
                    <h2 className="font-semibold">
                      収穫量は後から登録できます
                    </h2>
                    <p className="mt-1 text-sm">
                      未登録の間も、確認できた販売・使用・注文・定期便分を差し引いて表示します。マイナスは実際の在庫不足ではなく、収穫量をまだ加えていない参考値です。
                    </p>
                    <p className="mt-1 text-sm">
                      未登録を0kgとして保存することはありません。総量の登録後に残量が再計算されます。
                    </p>
                  </div>
                  <button
                    type="button"
                    className={button}
                    onClick={() => setView("settings")}
                  >
                    収穫量をあとから登録
                  </button>
                </section>
              )}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  [
                    harvestMissing
                      ? "収穫量未登録・入庫登録分"
                      : "収穫・入庫量（調整後）",
                    rows.reduce((n, r) => n + r.incoming, 0),
                  ],
                  ["販売・使用済み", rows.reduce((n, r) => n + r.used, 0)],
                  ["注文・定期便の確保", rows.reduce((n, r) => n + r.held, 0)],
                  [
                    uncertain ? "差引き（参考値）" : "あと販売できる量",
                    formatKg(rows.reduce((n, r) => n + r.available, 0)),
                  ],
                ].map(([label, value]) => (
                  <article
                    key={String(label)}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="mt-3 text-xl font-bold tabular-nums">
                      {typeof value === "number" ? formatKg(value) : value}
                    </p>
                    {label === "差引き（参考値）" && (
                      <p className="mt-2 text-xs text-amber-800">
                        {harvestMissing
                          ? "収穫量未登録を含むため、実在庫ではありません"
                          : "未確認分を含まないため、販売判断には使えません"}
                      </p>
                    )}
                  </article>
                ))}
              </div>
              <section
                aria-label="銘柄別在庫"
                className="grid gap-4 lg:grid-cols-3"
              >
                {rows.map((r) => (
                  <article
                    key={r.key}
                    className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm"
                  >
                    <p className="mb-2 text-xs font-medium text-gray-500">
                      {data.seasons.find((s) => s.id === season)?.label}
                    </p>
                    <h2 className="text-lg font-bold">{r.label}</h2>
                    <p className="mt-4 text-2xl font-bold tabular-nums text-emerald-900">
                      {formatKg(r.available)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {"basisMissing" in r && r.basisMissing
                        ? "差引き（収穫量未登録・参考値）"
                        : uncertain
                          ? "差引き（確認済み分の参考値）"
                          : "あと販売できる玄米量"}
                    </p>
                    <div className="my-4 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={
                          r.available < 0
                            ? "h-full bg-red-500"
                            : "h-full bg-emerald-600"
                        }
                        style={{
                          width: `${Math.max(0, Math.min(100, r.incoming > 0 ? (r.available / r.incoming) * 100 : 0))}%`,
                        }}
                      />
                    </div>
                    <dl className="mt-3 space-y-2">
                      <div className="flex justify-between gap-2">
                        <dt>収穫・入庫量</dt>
                        <dd>
                          {"basisMissing" in r && r.basisMissing
                            ? "収穫量未登録"
                            : formatKg(r.incoming)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>販売・使用済み</dt>
                        <dd>{formatKg(r.used)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>注文・定期便などの確保</dt>
                        <dd>{formatKg(r.held)}</dd>
                      </div>
                    </dl>
                    <details className="mt-4 border-t border-gray-100 pt-3 text-sm">
                      <summary className="cursor-pointer text-gray-600">
                        詳しい内訳を見る
                      </summary>
                      <dl className="mt-3 space-y-2">
                        {[
                          ["入庫・調整後", r.incoming],
                          ["販売・使用済み", r.used],
                          [
                            rawMode ? "確保中の合計" : "確保中（入金待ち）",
                            r.held,
                          ],
                          ...(rawMode
                            ? [
                                [
                                  "注文済み・未発送",
                                  r.held -
                                    ("futureHeld" in r
                                      ? Number(r.futureHeld)
                                      : 0) -
                                    Number(
                                      (data.raw_baselines || []).find(
                                        (b) =>
                                          b.season_id === season &&
                                          b.variety_key === r.key,
                                      )?.external_held_kg || 0,
                                    ),
                                ],
                                [
                                  "うち定期の将来確保",
                                  "futureHeld" in r ? Number(r.futureHeld) : 0,
                                ],
                                [
                                  "その他の確保",
                                  Number(
                                    (data.raw_baselines || []).find(
                                      (b) =>
                                        b.season_id === season &&
                                        b.variety_key === r.key,
                                    )?.external_held_kg || 0,
                                  ),
                                ],
                              ]
                            : []),
                          ...(!rawMode
                            ? [
                                [
                                  r.reviewRequired
                                    ? "旧確保（要照合）"
                                    : "旧確保（原記録）",
                                  r.legacyHeld,
                                ],
                              ]
                            : []),
                        ].map(([label, n]) => (
                          <div
                            className="flex justify-between gap-2"
                            key={String(label)}
                          >
                            <dt>{String(label)}</dt>
                            <dd>{formatKg(n as number)}</dd>
                          </div>
                        ))}
                      </dl>
                      <p className="mt-3 text-xs text-gray-500">
                        {rawMode
                          ? "発送済み等は販売・使用済みに、支払済み・未発送は注文の確保に含まれます。将来の定期発送分も確保に含み、二重には差し引きません。数値はすべて玄米換算です。"
                          : "初期kg版の重量基準です。支払済みを販売・使用済みに、入金待ちを確保に含みます。玄米換算・定期便の将来確保は未導入です。"}
                      </p>
                    </details>
                    {rawMode &&
                      "basisMissing" in r &&
                      Boolean(r.basisMissing) && (
                        <p className="text-amber-800">
                          収穫量は未登録です。あとから登録できます。
                        </p>
                      )}
                    {uncertain && !("basisMissing" in r && r.basisMissing) && (
                      <p className="text-sm">
                        未確認分があるため、販売可能量は未確定です。
                      </p>
                    )}
                    {r.available < 0 && !uncertain && (
                      <p className="text-red-700 font-bold">
                        不足 {formatKg(-r.available)}
                      </p>
                    )}
                  </article>
                ))}
              </section>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={button}
                  onClick={() => setView("record")}
                >
                  ＋ 入庫・販売を記録
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm"
                  onClick={() => setView("schedule")}
                >
                  定期便の内訳を見る
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm"
                  onClick={() => setView("settings")}
                >
                  収穫量を登録・確認
                </button>
              </div>
            </div>
            <div hidden={view !== "settings"}>
              {!rawMode && rows.some((r) => r.legacyHeld > 0) && (
                <section className="rounded-xl border bg-amber-50 p-5">
                  <h2 className="font-bold">旧手動確保の個別照合</h2>
                  <p className="text-sm">
                    旧確保のうちEC以外の確保として残す量を確認してください。EC注文分を含めず、全て重複なら0kgにします。元データは保持し、照合結果を履歴に記録します。
                  </p>
                  <form
                    className="mt-3 grid gap-3 sm:grid-cols-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void save(() =>
                        supabase!.rpc("kg_review_legacy", {
                          season,
                          variety: legacy.variety,
                          external_kg: Number(legacy.kg),
                          reason: legacy.reason,
                        }),
                      );
                    }}
                  >
                    <label>
                      照合する銘柄
                      <select
                        className={control}
                        value={legacy.variety}
                        onChange={(e) =>
                          setLegacy({ ...legacy, variety: e.target.value })
                        }
                      >
                        {Object.entries(varieties).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      EC以外の確保 kg
                      <input
                        required
                        className={control}
                        type="number"
                        min="0"
                        step="0.000001"
                        value={legacy.kg}
                        onChange={(e) =>
                          setLegacy({ ...legacy, kg: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      照合根拠
                      <input
                        required
                        className={control}
                        value={legacy.reason}
                        onChange={(e) =>
                          setLegacy({ ...legacy, reason: e.target.value })
                        }
                      />
                    </label>
                    <button disabled={busy} className={button}>
                      照合結果を記録
                    </button>
                  </form>
                </section>
              )}
            </div>
            {rawMode && (
              <div hidden={view !== "settings" && view !== "schedule"}>
                <KgSubscriptionSettings
                  mode={view === "schedule" ? "schedule" : "settings"}
                  harvestYear={
                    data.seasons.find((s) => s.id === season)?.harvest_year
                  }
                  specs={data.specs}
                  season={season}
                  baselines={data.raw_baselines || []}
                  rules={data.harvest_rules || []}
                  plans={data.plans || []}
                  slots={data.slots || []}
                  subscriptions={data.subscriptions || []}
                  products={data.products}
                  orders={data.orders}
                  save={save}
                  busy={busy}
                />
              </div>
            )}
            {!rawMode && view === "schedule" && (
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="font-bold">定期便の発送予定</h2>
                <p className="mt-3 text-sm text-gray-600">
                  定期便の将来確保には追加SQLの適用が必要です。設定・過去データで準備状況を確認してください。
                </p>
              </section>
            )}
            <div hidden={view !== "record"} className="space-y-6">
              <section className="rounded-xl border bg-white p-5">
                <h2 className="text-lg font-bold">
                  入庫・販売・使用・調整を記録
                </h2>
                <p className="text-sm mt-1">
                  入庫・調整は玄米kg、直売・使用は製品kgと精米区分を入力し玄米換算します。EC注文はここに再入力しないでください。訂正は削除せず、理由付き調整を追加します。
                </p>
                <form
                  onSubmit={record}
                  className="mt-4 grid gap-3 sm:grid-cols-2"
                >
                  <label>
                    銘柄
                    <select
                      className={control}
                      value={movement.variety}
                      onChange={(e) => {
                        request.current = null;
                        setMovement({ ...movement, variety: e.target.value });
                      }}
                    >
                      {Object.entries(varieties).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    区分
                    <select
                      className={control}
                      value={movement.kind}
                      onChange={(e) => {
                        request.current = null;
                        setMovement({ ...movement, kind: e.target.value });
                      }}
                    >
                      {Object.entries(kinds)
                        .filter(
                          ([k]) =>
                            k !== "ec" &&
                            k !== "legacy_review" &&
                            k !== "forecast",
                        )
                        .map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                    </select>
                  </label>
                  {rawMode &&
                    !["receipt", "adjustment"].includes(movement.kind) && (
                      <label>
                        販売・使用の精米区分
                        <select
                          required
                          className={control}
                          value={movement.milling}
                          onChange={(e) => {
                            request.current = null;
                            setMovement({
                              ...movement,
                              milling: e.target.value,
                            });
                          }}
                        >
                          <option value="">選択してください</option>
                          <option value="white">白米 ×1.1</option>
                          <option value="partial">分づき ×1.05</option>
                          <option value="brown">玄米 ×1</option>
                        </select>
                      </label>
                    )}
                  <label>
                    重量 kg（調整のみ負数可）
                    <input
                      required
                      className={control}
                      type="number"
                      step="0.000001"
                      value={movement.kg}
                      onChange={(e) => {
                        request.current = null;
                        setMovement({ ...movement, kg: e.target.value });
                      }}
                    />
                  </label>
                  <label>
                    理由・販売先
                    <input
                      required
                      className={control}
                      value={movement.reason}
                      onChange={(e) => {
                        request.current = null;
                        setMovement({ ...movement, reason: e.target.value });
                      }}
                    />
                  </label>
                  <button className={button} disabled={busy || !season}>
                    履歴に追加
                  </button>
                </form>
              </section>
              <section className="rounded-xl border bg-white p-5">
                <h2 className="text-lg font-bold">増減履歴</h2>
                <div className="overflow-x-auto">
                  <table className="mt-3 w-full min-w-[720px] text-sm text-left">
                    <thead>
                      <tr>
                        {[
                          "日時",
                          "銘柄",
                          "区分",
                          "入庫/調整",
                          "使用増減",
                          "確保増減",
                          "理由 / 注文",
                        ].map((t) => (
                          <th className="p-2" key={t}>
                            {t}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.movements
                        .filter((m) => m.season_id === season)
                        .sort((a, b) =>
                          b.created_at.localeCompare(a.created_at),
                        )
                        .map((m) => (
                          <tr key={m.id} className="border-t">
                            <td className="p-2">
                              {new Date(m.created_at).toLocaleString("ja-JP")}
                            </td>
                            <td>
                              {
                                varieties[
                                  m.variety_key as keyof typeof varieties
                                ]
                              }
                            </td>
                            <td>{kinds[m.kind] || m.kind}</td>
                            <td>{formatKg(Number(m.incoming_kg))}</td>
                            <td>{formatKg(Number(m.used_kg))}</td>
                            <td>{formatKg(Number(m.held_kg))}</td>
                            <td className="max-w-xs break-words">
                              {m.reason}
                              <br />
                              {m.order_id}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <details className="mt-4">
                  <summary>移行前データ（基準量・既存販売履歴を保持）</summary>
                  <pre className="whitespace-pre-wrap break-all text-xs">
                    {JSON.stringify(
                      {
                        stocks: data.stocks.filter(
                          (s) => s.season_id === season,
                        ),
                        sales: data.sales.filter((s) => s.season_id === season),
                      },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              </section>
            </div>
            <div hidden={view !== "settings"}>
              <InventoryMapping
                season={season}
                seasons={data.seasons}
                products={data.products}
                specs={data.specs}
                unknown={unknown}
                rawMode={rawMode}
                busy={busy}
                save={save}
              />
            </div>
          </>
        )
      )}
    </div>
  );
}
