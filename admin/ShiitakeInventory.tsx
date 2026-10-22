"use client";

import React, { useId, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Info,
  Mail,
  Minus,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import styles from "./ShiitakeInventory.module.css";

type Entry = {
  id: number;
  date: string;
  kind: string;
  quantity: number;
  note: string;
};
const initialEntries: Entry[] = [
  {
    id: 2,
    date: "2026-10-21",
    kind: "売上メール",
    quantity: -1,
    note: "サンプルデータ",
  },
  {
    id: 1,
    date: "2026-10-20",
    kind: "棚卸し",
    quantity: 18,
    note: "開始在庫（サンプル）",
  },
];
const target = 18;
function dateLabel(date: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${date}T12:00:00+09:00`));
}

/** UI-only preview. No storage, network, or live inventory writes. */
export default function ShiitakeInventory() {
  const [stock, setStock] = useState(17);
  const [entries, setEntries] = useState(initialEntries);
  const [mode, setMode] = useState<"restock" | "count">("restock");
  const [date, setDate] = useState("2026-10-22");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [panel, setPanel] = useState<"history" | "settings" | null>(null);
  const numberInput = useRef<HTMLInputElement>(null);
  const prefix = useId();
  const count = Number(quantity);
  const valid =
    quantity.trim() !== "" &&
    Number.isSafeInteger(count) &&
    count >= (mode === "count" ? 0 : 1) &&
    count <= 9999;
  const after = valid ? (mode === "count" ? count : stock + count) : null;
  const needed = Math.max(0, target - stock);
  function changeMode(next: "restock" | "count") {
    setMode(next);
    setQuantity(String(next === "count" ? stock : Math.max(1, needed)));
    setError("");
    setNotice("");
    numberInput.current?.focus();
  }
  function save(event: React.FormEvent) {
    event.preventDefault();
    if (
      !valid ||
      after === null ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date))
    ) {
      setError("日付と数量を確認してください。数量は整数で入力してください。");
      return;
    }
    if (mode === "count" && !note.trim()) {
      setError("実数を調整する理由をメモに入力してください。");
      return;
    }
    const delta = after - stock;
    if (delta === 0) {
      setError("現在の在庫と同じ数量です。変更はありません。");
      return;
    }
    setEntries((previous) => [
      {
        id: Math.max(...previous.map((entry) => entry.id)) + 1,
        date,
        kind: mode === "count" ? "実数調整" : "補充",
        quantity: delta,
        note: note.trim() || "画面内の試し操作",
      },
      ...previous,
    ]);
    setStock(after);
    setNotice(
      `サンプル在庫を${after}個に変更しました。実際の在庫には保存されていません。`,
    );
    setNote("");
    setQuantity(mode === "count" ? String(after) : "1");
    setError("");
  }
  return (
    <div className={styles.body}>
      <div className={styles.grid}>
        <section className={styles.stockPanel} aria-label="椎茸の在庫">
          <p className={styles.store}>Aコープ金井店</p>
          <div className={styles.productHeading}>
            <h2>乾椎茸（原木）</h2>
            <button
              className={styles.textButton}
              type="button"
              onClick={() => changeMode(mode === "count" ? "restock" : "count")}
            >
              <Pencil size={17} aria-hidden="true" />
              {mode === "count" ? "補充を記録に戻る" : "実数を調整"}
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.metrics}>
            <div>
              <p className={styles.metricLabel}>
                推定在庫{" "}
                <Info size={16} aria-label="前日の売上まで反映した推定値です" />
              </p>
              <p className={styles.stockValue} aria-live="polite">
                {stock}
                <span>個</span>
              </p>
              <div className={styles.progressRow}>
                <progress
                  aria-label="目標18個に対する在庫"
                  max={target}
                  value={Math.min(stock, target)}
                />
                <span>
                  {stock} / {target}
                </span>
              </div>
            </div>
            <div className={styles.target}>
              <p className={styles.metricLabel}>
                目標在庫 <Info size={16} aria-hidden="true" />
              </p>
              <p className={styles.targetValue}>
                18<span>個</span>
              </p>
            </div>
          </div>
          <p className={styles.warning}>
            <AlertCircle size={19} aria-hidden="true" />
            <span>
              18個は補充目標です。補充を記録するまで在庫は増えません。
            </span>
          </p>
          <div className={styles.historyHeading}>
            <h3>最近の入出庫履歴</h3>
            <button
              type="button"
              className={styles.textButton}
              onClick={() => setPanel("history")}
            >
              取込履歴を見る
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>サンプルの入出庫履歴</caption>
              <thead>
                <tr>
                  <th>日付</th>
                  <th>内容</th>
                  <th>数量</th>
                  <th>メモ</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 5).map((entry) => (
                  <tr key={entry.id}>
                    <td>{dateLabel(entry.date)}</td>
                    <td>{entry.kind}</td>
                    <td
                      className={
                        entry.quantity > 0 ? styles.positive : styles.negative
                      }
                    >
                      {entry.quantity > 0 ? "+" : ""}
                      {entry.quantity}個
                    </td>
                    <td className={styles.noteCell}>{entry.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.scrollHint}>
            履歴は横にスクロールして確認できます。
          </p>
          <p className={styles.freshness}>
            サンプル：10/21の売上まで反映しています。
          </p>
        </section>
        <section
          className={styles.formPanel}
          aria-labelledby={`${prefix}-form-heading`}
        >
          <h2 id={`${prefix}-form-heading`}>
            {mode === "count" ? "実数を調整" : "補充を記録"}
          </h2>
          <p className={styles.formHelp}>
            {mode === "count"
              ? "店頭で数えた数量に合わせます。調整理由を残してください。"
              : needed > 0
                ? `あと${needed}個で目標の18個になります。`
                : "目標の18個に達しています。必要に応じて補充できます。"}
          </p>
          <form onSubmit={save} noValidate>
            <label className={styles.label} htmlFor={`${prefix}-date`}>
              日付
            </label>
            <input
              id={`${prefix}-date`}
              className={styles.input}
              type="date"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <label className={styles.label} htmlFor={`${prefix}-quantity`}>
              {mode === "count" ? "店頭の実数" : "数量"}
            </label>
            <div className={styles.stepper}>
              <button
                type="button"
                aria-label="数量を1個減らす"
                disabled={!valid || count <= (mode === "count" ? 0 : 1)}
                onClick={() => setQuantity(String(count - 1))}
              >
                <Minus size={19} aria-hidden="true" />
              </button>
              <input
                ref={numberInput}
                id={`${prefix}-quantity`}
                className={styles.input}
                type="number"
                inputMode="numeric"
                min={mode === "count" ? 0 : 1}
                max={9999}
                step={1}
                required
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
              <button
                type="button"
                aria-label="数量を1個増やす"
                disabled={!valid || count >= 9999}
                onClick={() => setQuantity(String(count + 1))}
              >
                <Plus size={19} aria-hidden="true" />
              </button>
              <span>個</span>
            </div>
            <label className={styles.label} htmlFor={`${prefix}-note`}>
              メモ（{mode === "count" ? "調整理由・必須" : "任意"}）
            </label>
            <textarea
              id={`${prefix}-note`}
              className={styles.textarea}
              maxLength={100}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={
                mode === "count"
                  ? "実際に数えた数量と異なっていたため"
                  : "納品時のメモ"
              }
            />
            <p className={styles.characterCount}>{note.length} / 100</p>
            <div className={styles.after}>
              <p>{mode === "count" ? "調整後" : "補充後"}の推定在庫</p>
              <strong>
                {after ?? "—"}
                <span>個</span>
              </strong>
            </div>
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <button type="submit" className={styles.save}>
              試しに保存する
            </button>
            <p className={styles.disclaimer}>
              <Info size={16} aria-hidden="true" />
              画面内のみの試し操作です。再読み込みで元に戻ります。
            </p>
            {notice && (
              <p role="status" className={styles.success}>
                {notice}
              </p>
            )}
          </form>
        </section>
      </div>
      <section className={styles.integration} aria-label="メール連携">
        <div className={styles.integrationTitle}>
          <Mail size={24} aria-hidden="true" />
          <h2>メール連携</h2>
        </div>
        <p className={styles.pipeline}>
          Gmail <ArrowRight size={13} aria-hidden="true" /> GAS{" "}
          <ArrowRight size={13} aria-hidden="true" /> スプレッドシート{" "}
          <ArrowRight size={13} aria-hidden="true" /> Supabase
        </p>
        <span className={styles.unconfigured}>未設定</span>
        <p className={styles.integrationHelp}>
          売上メールの取込には連携設定が必要です。
        </p>
        <button
          type="button"
          className={styles.settingsButton}
          onClick={() => setPanel("settings")}
        >
          設定を見る
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </section>
      {panel && (
        <section
          className={styles.details}
          aria-label={
            panel === "history" ? "売上メールの取込履歴" : "連携設定の準備"
          }
        >
          <div className={styles.historyHeading}>
            <h2>
              {panel === "history" ? "売上メールの取込履歴" : "連携設定の準備"}
            </h2>
            <button
              type="button"
              aria-label="詳細を閉じる"
              className={styles.closeButton}
              onClick={() => setPanel(null)}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          {panel === "history" ? (
            <>
              <p>まだメールは取り込まれていません。以下は表示例です。</p>
              <p className={styles.example}>
                2026/10/21　乾椎茸（原木）　1個　サンプル・実取込なし
              </p>
            </>
          ) : (
            <>
              <p>
                GAS・スプレッドシート・Supabaseへの接続は次の工程で設定します。
              </p>
              <ol>
                <li>売上メールを受け取るGmailとスプレッドシートを用意</li>
                <li>GASで売上日・商品・販売数を抽出</li>
                <li>重複確認を行い、Supabaseへ記録</li>
              </ol>
              <p>
                この画面からメールを読んだり、実在庫を更新したりすることはありません。
              </p>
            </>
          )}
        </section>
      )}
    </div>
  );
}
