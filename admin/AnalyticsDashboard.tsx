"use client";
import React, { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Flag,
  Info,
  Settings2,
  Users,
  RefreshCw,
} from "lucide-react";
import {
  calculateAnalytics,
  inventoryForYear,
  jstDay,
  periodRange,
  yen,
  type AnalyticsData,
  type AnalyticsTarget,
} from "@/lib/storeAnalytics";
import styles from "./AnalyticsDashboard.module.css";
type Props = {
  data: AnalyticsData;
  now: Date;
  onRefresh: () => void;
  onSaveTarget: (target: AnalyticsTarget) => Promise<void>;
};
const periods = [
  { value: "month", label: "今月" },
  { value: "7", label: "過去7日間" },
  { value: "30", label: "過去30日間" },
  { value: "90", label: "過去90日間" },
  { value: "365", label: "過去1年間" },
];
function TargetForm({
  target,
  year,
  ready,
  onSave,
}: {
  target?: AnalyticsTarget;
  year: number;
  ready: boolean;
  onSave: Props["onSaveTarget"];
}) {
  const [revenue, setRevenue] = useState(
    target?.revenue_target?.toString() || "",
  );
  const [profit, setProfit] = useState(
    target?.gross_profit_target?.toString() || "",
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !ready) return;
    setError("");
    setNotice("");
    if (
      [revenue, profit].some(
        (value) =>
          value.trim() !== "" &&
          (!Number.isSafeInteger(Number(value)) ||
            Number(value) <= 0 ||
            Number(value) > 999999999999),
      )
    ) {
      setError(
        "目標は1円以上の整数で入力してください。未設定にする項目は空欄にしてください。",
      );
      return;
    }
    setBusy(true);
    try {
      await onSave({
        year,
        revenue_target: revenue.trim() ? Number(revenue) : null,
        gross_profit_target: profit.trim() ? Number(profit) : null,
      });
      setNotice("目標を保存しました。");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "保存できませんでした。入力を残しているので再試行できます。",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className={styles.targetForm}
      onSubmit={submit}
      noValidate
      aria-label="年間目標の設定"
    >
      <div>
        <h3>{year}年の目標を設定</h3>
        <p>
          空欄は未設定です。原価が未登録のため、粗利益の実績は自動計算しません。
        </p>
      </div>
      <label>
        年間売上目標（円）
        <input
          type="number"
          min="1"
          step="1"
          value={revenue}
          onChange={(event) => setRevenue(event.target.value)}
        />
      </label>
      <label>
        年間粗利益目標（円）
        <input
          type="number"
          min="1"
          step="1"
          value={profit}
          onChange={(event) => setProfit(event.target.value)}
        />
      </label>
      {!ready && (
        <p className={styles.caution}>
          目標設定を読み込めないため保存できません。SQLの適用状況・権限・接続を確認してください。
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className={styles.success}>
          {notice}
        </p>
      )}
      <button className={styles.primary} disabled={busy || !ready}>
        {busy ? "保存中…" : "目標を保存"}
      </button>
    </form>
  );
}
export default function AnalyticsDashboard({
  data,
  now,
  onRefresh,
  onSaveTarget,
}: Props) {
  const currentYear = Number(jstDay(now).slice(0, 4));
  const [year, setYear] = useState(currentYear),
    [period, setPeriod] = useState("month"),
    [editing, setEditing] = useState(false);
  const metrics = calculateAnalytics(data, year, period, now);
  const target = data.targets.find((target) => Number(target.year) === year);
  const goal = target?.revenue_target ? Number(target.revenue_target) : null;
  const achievement = goal ? (metrics.annualRevenue / goal) * 100 : null;
  const goalState = data.targetsReady ? "未設定" : "未取得";
  const years = [
    ...new Set([
      currentYear - 1,
      currentYear,
      currentYear + 1,
      ...data.targets.map((target) => Number(target.year)),
      ...data.orders
        .map((order) => new Date(order.paid_at || order.created_at))
        .filter((date) => Number.isFinite(date.getTime()))
        .map((date) => Number(jstDay(date).slice(0, 4))),
    ]),
  ].sort((a, b) => b - a);
  const rows = inventoryForYear(data.inventory, year);
  const periodLabel = periods.find((item) => item.value === period)!.label;
  const periodStart = jstDay(new Date(periodRange(period, now).start));
  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1>ストア分析</h1>
          <p>目標まであとどのくらいか、次に何を改善するかを確認します。</p>
        </div>
        <button type="button" className={styles.secondary} onClick={onRefresh}>
          <RefreshCw size={16} aria-hidden="true" />
          最新に更新
        </button>
      </header>
      {data.warnings.length > 0 && (
        <div role="status" className={styles.warning}>
          <Info size={19} aria-hidden="true" />
          <div>
            {data.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      )}
      <section aria-label="年間目標と進捗">
        <div className={styles.sectionHeading}>
          <h2>
            <Flag size={20} aria-hidden="true" />
            年間目標と進捗 <span>KGI</span>
          </h2>
          <div className={styles.controls}>
            <label>
              集計年
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              >
                {years.map((value) => (
                  <option key={value} value={value}>
                    {value}年
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={styles.textButton}
              onClick={() => setEditing(!editing)}
              aria-expanded={editing}
            >
              <Settings2 size={16} aria-hidden="true" />
              {editing ? "設定を閉じる" : "目標を設定"}
            </button>
          </div>
        </div>
        <p className={styles.caption}>
          1月1日〜12月31日の暦年・ストア全体です。お米の年産・販売期間とは別に集計します。
        </p>
        <div className={styles.goalGrid}>
          <article className={styles.card}>
            <div className={styles.cardTitle}>
              <h3>年間売上</h3>
              <span className={styles.badge}>
                {achievement === null
                  ? `目標${goalState}`
                  : `${achievement.toFixed(1)}% 達成`}
              </span>
            </div>
            <p className={styles.heroNumber}>{yen(metrics.annualRevenue)}</p>
            <div className={styles.goalMeta}>
              <span>目標 {goal ? yen(goal) : goalState}</span>
              <strong>
                {goal
                  ? metrics.annualRevenue >= goal
                    ? "目標達成"
                    : `あと ${yen(Math.max(0, goal - metrics.annualRevenue))}`
                  : data.targetsReady
                    ? "目標は後から設定できます"
                    : "目標設定を読み込めていません"}
              </strong>
            </div>
            {achievement !== null ? (
              <progress
                aria-label="年間売上目標の達成率"
                max={100}
                value={Math.min(100, achievement)}
              />
            ) : (
              <p className={styles.caption}>達成率：目標設定後に表示します</p>
            )}
            <p className={styles.caption}>
              支払済み注文額。定期便の未決済の将来分は含みません。
            </p>
          </article>
          <article className={styles.card}>
            <div className={styles.cardTitle}>
              <h3>年間粗利益</h3>
              <span className={styles.neutralBadge}>原価未登録</span>
            </div>
            <p className={styles.unavailable}>未集計</p>
            <p className={styles.caption}>
              目標{" "}
              {target?.gross_profit_target
                ? yen(Number(target.gross_profit_target))
                : goalState}
            </p>
            <p className={styles.caption}>
              仕入れ・製造原価の登録後に算出します。売上から推測した利益は表示しません。
            </p>
          </article>
        </div>
        {editing && (
          <TargetForm
            key={year}
            year={year}
            target={target}
            ready={data.targetsReady}
            onSave={onSaveTarget}
          />
        )}
      </section>
      <section aria-label="期間別KPI">
        <div className={styles.sectionHeading}>
          <h2>
            <BarChart3 size={20} aria-hidden="true" />
            日々の成果を確認 <span>KPI</span>
          </h2>
          <label className={styles.periodLabel}>
            期間
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              {periods.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className={styles.caption}>
          対象期間：{periodStart}〜{jstDay(now)}
          （日本時間・上段の集計年とは独立しています）
        </p>
        <div className={styles.kpis}>
          <article className={styles.card}>
            <h3>{periodLabel}の売上</h3>
            <p className={styles.metric}>{yen(metrics.revenue)}</p>
            <p>{metrics.orderCount}件の支払済み注文</p>
          </article>
          <article className={styles.card}>
            <h3>新規購入者数</h3>
            <p className={styles.metric}>
              {metrics.newCustomers}
              <small>人</small>
            </p>
            <p>全履歴の初回支払日が期間内</p>
          </article>
          <article className={styles.card}>
            <h3>定期便の新規登録</h3>
            <p className={styles.metric}>
              {metrics.newSubscriptions ?? "未取得"}
              {metrics.newSubscriptions !== null && <small>件</small>}
            </p>
            <p>期間内の登録・未完了状態を除く</p>
          </article>
          <article className={styles.card}>
            <h3>定期便の解約記録</h3>
            <p className={styles.metric}>
              {metrics.cancellationRequests ?? "未取得"}
              {metrics.cancellationRequests !== null && <small>件</small>}
            </p>
            <p>記録された解約日時で集計・予約を含む</p>
          </article>
        </div>
        <div className={styles.supporting}>
          <span>
            平均注文額 <strong>{yen(metrics.avgOrder)}</strong>
          </span>
          <span>
            購入者数 <strong>{metrics.customers}人</strong>
          </span>
          <span>
            現在の継続中契約{" "}
            <strong>
              {metrics.active === null ? "未取得" : `${metrics.active}件`}
            </strong>
          </span>
          <span>
            うち期末解約予約{" "}
            <strong>
              {metrics.scheduled === null ? "未取得" : `${metrics.scheduled}件`}
            </strong>
          </span>
        </div>
        <details className={styles.definitions}>
          <summary>集計条件・未集計の指標</summary>
          <p>
            売上は税込・送料を含む支払済み注文総額です。キャンセル・全額返金済みは除外し、部分返金額の控除には未対応です。入金日時が未記録の注文は作成日を使います（全支払履歴の対象{" "}
            {metrics.fallbackDates}
            件）。新規・購入者数はメールを正規化して識別し、メールなしはユーザーIDで補完します。期間内の識別不能注文{" "}
            {metrics.unknownCustomers}件は人数に含めません。
          </p>
          <p>
            継続中契約は現在のactive・trialing・past_due・pausedの合計で、期間開始時点の契約数ではありません。解約記録は現存レコードのcanceled_atで集計し、解約予約・自動解約も含みます。契約の終了月とは異なる場合があります。申出取消などの履歴は未保存です。解約済みで日時不明の{" "}
            {metrics.undatedCancellations}
            件は期間内の解約数に含みません。継続率・お試しから定期便への移行率は、契約履歴と対象条件を整備するまで未集計です。
          </p>
        </details>
      </section>
      <div className={styles.analysisGrid}>
        <section className={styles.card} aria-label="月別売上推移">
          <div className={styles.sectionHeading}>
            <h2>{year}年の月別売上</h2>
            <span className={styles.caption}>支払済み注文額</span>
          </div>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>月</th>
                  <th>売上</th>
                  <th>注文数</th>
                </tr>
              </thead>
              <tbody>
                {metrics.months.map((month) => (
                  <tr key={month.month}>
                    <th scope="row">{month.month}月</th>
                    <td>{yen(month.revenue)}</td>
                    <td>{month.orders}件</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className={styles.card} aria-label="人気商品">
          <h2>
            人気商品トップ5 <small>（{periodLabel}）</small>
          </h2>
          <p className={styles.caption}>
            商品明細の売上順。注文総額とは税・送料・割引配分等で差が出る場合があります。
          </p>
          {data.items === null ? (
            <p className={styles.empty}>商品明細は未取得です</p>
          ) : !metrics.topProducts.length ? (
            <p className={styles.empty}>この期間の対象商品はありません</p>
          ) : (
            <ol className={styles.products}>
              {metrics.topProducts.map((product, index) => (
                <li key={product.key}>
                  <span className={styles.rank}>{index + 1}</span>
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.orders}件の注文</p>
                  </div>
                  <strong>{yen(product.sales)}</strong>
                </li>
              ))}
            </ol>
          )}
          <a className={styles.textButton} href="/admin/orders">
            注文一覧を見る
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </section>
      </div>
      <section className={styles.card} aria-label="品種別の販売と確保">
        <div className={styles.sectionHeading}>
          <h2>{year}年産のお米の販売・確保状況</h2>
          <a className={styles.textButton} href="/admin/inventory">
            在庫管理へ
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
        <p className={styles.caption}>
          確認済み台帳の参考値・玄米換算kgです。未確認注文・契約や初期量の不足があり得るため、販売判断は在庫管理で確認してください。
        </p>
        {rows ? (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>品種</th>
                  <th>販売・使用済み</th>
                  <th>注文・定期等の確保</th>
                  <th>うち定期将来分</th>
                  <th>差引き（参考）</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">{row.label}</th>
                    <td>{row.used.toLocaleString()} kg</td>
                    <td>{row.held.toLocaleString()} kg</td>
                    <td>{row.futureHeld.toLocaleString()} kg</td>
                    <td>
                      {row.available.toLocaleString()} kg
                      {row.basisMissing && (
                        <small className={styles.caution}>収穫量未登録</small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.empty}>
            この年産の玄米換算データは未取得・未登録、または連動停止中です。在庫管理で確認してください。
          </p>
        )}
        {rows && (
          <p className={styles.scrollHint}>
            表は横にスクロールして確認できます。
          </p>
        )}
      </section>
      <footer className={styles.footer}>
        <span>
          <Users size={15} aria-hidden="true" />
          登録商品数 {data.productCount ?? "未取得"} ／ 全期間の注文レコード{" "}
          {data.orders.length}件
        </span>
        <span>
          更新 {now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
          （日本時間）
        </span>
      </footer>
    </div>
  );
}
