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
  const [target, setTarget] = useState("product"),
    [product, setProduct] = useState(""),
    [item, setItem] = useState("");
  const [options, setOptions] = useState("{}"),
    [components, setComponents] = useState(""),
    [excluded, setExcluded] = useState(false),
    [reason, setReason] = useState("");
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
  async function mapping(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    let parsed: unknown, opts: unknown;
    try {
      parsed = excluded ? [] : JSON.parse(components);
      opts = JSON.parse(options);
    } catch {
      setError("構成品または選択肢のJSONを確認してください");
      return;
    }
    await save(() =>
      target === "item"
        ? supabase!.rpc("kg_resolve_item", {
            item,
            components: parsed,
            excluded,
            reason,
          })
        : supabase!.from("kg_product_specs").upsert(
            {
              product_id: product,
              options: opts,
              components: parsed,
              excluded,
              note: reason,
            },
            { onConflict: "product_id,options" },
          ),
    );
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
    <div className="mx-auto max-w-7xl space-y-6 text-gray-900">
      <header>
        <h1 className="text-2xl font-bold">在庫システム · kg管理</h1>
        <p className="mt-2 text-sm">
          年産・銘柄ごとに、入庫 − 販売・使用済み −
          {rawMode ? "注文・定期将来分・EC以外の確保" : "入金待ち確保"}
          を集計します。購入受付とSKU在庫は従来どおりです。
        </p>
      </header>
      {ready && !rawMode && (
        <section role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
          <h2 className="font-bold">初期kg版を使用中（玄米換算・定期将来確保は未導入）</h2>
          <p>以下は初期版の重量基準による集計です。精米係数と未作成の定期発送分は含みません。玄米残量や定期受付可能量として使用しないでください。既存の閲覧・記録は引き続き利用できます。</p>
        </section>
      )}
      <div className="rounded-xl bg-amber-50 p-4 text-sm space-y-2">
        <p>
          販売可能量は倉庫の現物量ではありません。支払済み・未出荷は玄米基準では確保中として扱います。精米前後の重量基準を統一してください。
        </p>
        <p>
          未判定がある場合、販売可能量は確定できません。年産が不明な注文は全年度共通の要確認として表示します。発送済み返品は返金だけでは入庫せず、検品後に理由付き調整を登録してください。
        </p>
        <p>
          既存の手動確保は自動確保と重複する可能性があるため別表示します。照合完了まで販売可能量は未確定です。玄米基準では確認済み発送回の将来分を確保します。
        </p>
      </div>
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
        <label>
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
            <p className="font-semibold">
              未判定 {unknown.length + contractIssues}件（全年度）
            </p>
            <section
              aria-label="銘柄別在庫"
              className="grid gap-4 lg:grid-cols-3"
            >
              {rows.map((r) => (
                <article key={r.key} className="rounded-xl border p-5 bg-white">
                  <h2 className="text-lg font-bold">{r.label}</h2>
                  <dl className="mt-3 space-y-2">
                    {[
                      ["入庫・調整後", r.incoming],
                      ["販売・使用済み", r.used],
                      [rawMode ? "確保中（注文＋将来＋EC以外）" : "確保中（入金待ち）", r.held],
                      ...(rawMode
                        ? [
                            [
                              "うち定期の将来確保",
                              "futureHeld" in r ? Number(r.futureHeld) : 0,
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
                  {rawMode &&
                    "basisMissing" in r &&
                    Boolean(r.basisMissing) && (
                      <p className="text-amber-800">
                        玄米基準の入庫・旧使用量が未確認
                      </p>
                    )}
                  <p className="mt-4 font-bold">
                    販売可能: {uncertain ? "未確定" : formatKg(r.available)}
                  </p>
                  {uncertain && (
                    <p className="text-sm">
                      判定済み分の差引残: {formatKg(r.available)}
                      （販売判断に使用不可）
                    </p>
                  )}
                  {r.available < 0 && (
                    <p className="text-red-700 font-bold">
                      不足 {formatKg(-r.available)}
                    </p>
                  )}
                </article>
              ))}
            </section>
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
            {rawMode && (
              <KgSubscriptionSettings
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
            )}
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
                          setMovement({ ...movement, milling: e.target.value });
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
              <h2 className="text-lg font-bold">商品設定 / 過去注文の確認</h2>
              <p className="text-sm mt-1">
                購入時に設定をコピーします。商品設定を変えても既存注文は変わりません。Ricekeepなど保存袋は「米ではない」を指定。混合セットは構成品を複数登録します。
              </p>
              <form
                onSubmit={mapping}
                className="mt-4 grid gap-3 sm:grid-cols-2"
              >
                <label>
                  対象
                  <select
                    className={control}
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  >
                    <option value="product">今後の商品・選択肢</option>
                    <option value="item">未紐付け注文明細を個別確認</option>
                  </select>
                </label>
                {target === "product" ? (
                  <label>
                    商品
                    <select
                      required
                      className={control}
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                    >
                      <option value="">選択してください</option>
                      {data.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label>
                    注文明細
                    <select
                      required
                      className={control}
                      value={item}
                      onChange={(e) => setItem(e.target.value)}
                    >
                      <option value="">選択してください</option>
                      {unknown
                        .filter(
                          (u) => u.item && !u.reason.startsWith("REVIEW:"),
                        )
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.order}: {u.title}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                {target === "product" && (
                  <label className="sm:col-span-2">
                    選択肢のID対応（selected_optionsと完全一致・選択肢なしは{" "}
                    {"{}"}）
                    <textarea
                      className={control}
                      value={options}
                      onChange={(e) => setOptions(e.target.value)}
                    />
                  </label>
                )}
                <label className="sm:col-span-2 flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={excluded}
                    onChange={(e) => setExcluded(e.target.checked)}
                  />
                  米ではない（保存袋など・kg集計から除外）
                </label>
                {!excluded && (
                  <label className="sm:col-span-2">
                    1点あたりの構成品（製品kgは小数3桁、millingはwhite/partial/brown）
                    <textarea
                      required
                      rows={4}
                      className={`${control} font-mono`}
                      value={components}
                      placeholder={JSON.stringify([
                        {
                          season_id: season || "年産ID",
                          variety_key: "koshihikari",
                          unit_kg: 5,
                          milling: "white",
                        },
                      ])}
                      onChange={(e) => setComponents(e.target.value)}
                    />
                    <button
                      type="button"
                      className="underline text-sm"
                      onClick={() =>
                        setComponents(
                          JSON.stringify(
                            [
                              {
                                season_id: season,
                                variety_key: "koshihikari",
                                unit_kg: 5,
                                milling: "white",
                              },
                            ],
                            null,
                            2,
                          ),
                        )
                      }
                    >
                      選択中の年産で入力例を入れる
                    </button>
                  </label>
                )}
                <label className="sm:col-span-2">
                  確認根拠・理由
                  <input
                    required
                    className={control}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <button className={button} disabled={busy}>
                  確認して保存
                </button>
              </form>
              <details className="mt-4">
                <summary>登録済み商品設定 {data.specs.length}件</summary>
                {data.specs.map((s) => (
                  <pre
                    key={s.id}
                    className="mt-3 whitespace-pre-wrap break-all text-xs"
                  >
                    {data.products.find((p) => p.id === s.product_id)?.title}
                    {"\n"}
                    {JSON.stringify(s, null, 2)}
                  </pre>
                ))}
              </details>
            </section>
            <section className="rounded-xl border bg-white p-5">
              <h2 className="text-lg font-bold">未判定・要確認一覧</h2>
              <p className="text-sm">
                過去注文・作成済み定期注文・情報変更済み明細を確認してください。確定後の明細変更は台帳照合と理由付き調整が必要です。
              </p>
              <ul className="mt-3 divide-y">
                {unknown.map((u) => (
                  <li key={u.id} className="py-3 break-words">
                    <strong>{u.order}</strong> · {u.title}
                    <p className="text-sm text-amber-800">{u.reason}</p>
                    {u.item && (
                      <code className="text-xs break-all">
                        選択肢: {JSON.stringify(u.item.selected_options || {})}
                      </code>
                    )}
                  </li>
                ))}
              </ul>
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
                      .sort((a, b) => b.created_at.localeCompare(a.created_at))
                      .map((m) => (
                        <tr key={m.id} className="border-t">
                          <td className="p-2">
                            {new Date(m.created_at).toLocaleString("ja-JP")}
                          </td>
                          <td>
                            {varieties[m.variety_key as keyof typeof varieties]}
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
                      stocks: data.stocks.filter((s) => s.season_id === season),
                      sales: data.sales.filter((s) => s.season_id === season),
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </section>
          </>
        )
      )}
    </div>
  );
}
