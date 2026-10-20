"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { varieties } from "@/lib/kgInventory";
export type RawBaseline = {
  season_id: string;
  variety_key: string;
  incoming_kg: number;
  external_used_kg: number;
  external_held_kg: number;
};
export type ContractPlan = {
  id: string;
  subscription_id: string;
  issue: string | null;
  anchor_date: string;
  quantity: number;
};
export type DeliverySlot = {
  id: string;
  plan_id: string;
  shipping_date: string;
  quantity: number;
  components: unknown;
  item_id: string | null;
  canceled: boolean;
};
export type SubscriptionRow = {
  id: string;
  stripe_subscription_id: string;
  status: string;
  interval: string;
};
type Props = {
  season: string;
  baselines: RawBaseline[];
  rules: { season_id: string; variety_key: string; end_month: string }[];
  plans: ContractPlan[];
  slots: DeliverySlot[];
  subscriptions: SubscriptionRow[];
  products: { id: string; title: string }[];
  orders: {
    id: string;
    stripe_subscription_id?: string;
    order_number: string;
    order_items: {
      id: string;
      product_title: string;
      is_subscription?: boolean;
    }[];
  }[];
  save: (
    action: () => PromiseLike<{ error: { message: string } | null }>,
  ) => Promise<unknown>;
  busy: boolean;
};
const cls = "mt-1 w-full min-h-11 rounded border border-gray-300 p-2 bg-white";
const btn =
  "min-h-11 rounded bg-emerald-800 text-white p-3 disabled:opacity-40";
export default function KgSubscriptionSettings(p: Props) {
  const [variety, setVariety] = useState("koshihikari"),
    [month, setMonth] = useState(""),
    [reason, setReason] = useState("");
  const [baseline, setBaseline] = useState({
    incoming: "",
    used: "",
    held: "",
  });
  const [plan, setPlan] = useState({
    subscription: "",
    product: "",
    options: "{}",
    quantity: "1",
    date: "",
    reason: "",
  });
  const [link, setLink] = useState({ slot: "", item: "", reason: "" });
  const [validation, setValidation] = useState("");
  const call = (name: string, args: Record<string, unknown>) =>
    p.save(() => supabase!.rpc(name, args));
  const selectedSlot = p.slots.find((s) => s.id === link.slot);
  const selectedPlan = p.plans.find((s) => s.id === selectedSlot?.plan_id);
  const sub = p.subscriptions.find(
    (s) => s.id === selectedPlan?.subscription_id,
  );
  return (
    <section className="rounded-xl border p-5 bg-white space-y-6">
      <h2 className="text-xl font-bold">玄米基準・定期便の将来確保</h2>
      <p className="text-sm">
        白米 ×1.1、分づき ×1.05、玄米
        ×1。期限月を含む発送回ごとの確保です。旧入庫値や過去注文は自動換算しません。設定・紐付け未確認の間は販売可能量を確定しません。
      </p>
      {validation && <p role="alert">{validation}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          設定する銘柄
          <select
            className={cls}
            value={variety}
            onChange={(e) => setVariety(e.target.value)}
          >
            {Object.entries(varieties).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          確認根拠
          <input
            className={cls}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
      </div>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void call("kg_save_harvest_rule", {
            season: p.season,
            variety,
            last_month: `${month}-01`,
            reason,
          });
        }}
      >
        <label>
          この年産の最終発送月（未確定の値を入れない）
          <input
            required
            type="month"
            className={cls}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <button
          className={btn}
          disabled={p.busy || !p.season || !reason.trim()}
        >
          期限月を保存・予測再計算
        </button>
      </form>
      <p className="text-sm">
        登録済み期限:{" "}
        {p.rules
          .filter((r) => r.season_id === p.season)
          .map(
            (r) =>
              `${varieties[r.variety_key as keyof typeof varieties]} ${r.end_month.slice(0, 7)}`,
          )
          .join(" / ") || "未設定"}
      </p>
      <form
        className="grid gap-3 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          void call("kg_confirm_raw_baseline", {
            season: p.season,
            variety,
            incoming: Number(baseline.incoming),
            external_used: Number(baseline.used),
            external_held: Number(baseline.held),
            reason,
          });
        }}
      >
        <p className="sm:col-span-3 text-sm">
          選択年産・銘柄の玄米総入庫と、移行前のEC以外の使用・確保を証拠に基づき一度だけ登録します。現在庫の転記ではありません。EC分は注文照合で別に反映します。登録後の訂正は理由付き調整で記録します。
        </p>
        {(
          [
            ["incoming", "玄米総入庫 kg"],
            ["used", "旧EC以外の使用済み kg"],
            ["held", "旧EC以外の確保中 kg"],
          ] as const
        ).map(([k, label]) => (
          <label key={k}>
            {label}
            <input
              required
              type="number"
              min="0"
              step="0.000001"
              className={cls}
              value={baseline[k]}
              onChange={(e) =>
                setBaseline({ ...baseline, [k]: e.target.value })
              }
            />
          </label>
        ))}
        <button
          className={btn}
          disabled={
            p.busy ||
            !p.season ||
            !reason.trim() ||
            p.baselines.some(
              (b) => b.season_id === p.season && b.variety_key === variety,
            )
          }
        >
          玄米基準を確認して登録
        </button>
      </form>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          let options;
          try {
            options = JSON.parse(plan.options);
          } catch {
            setValidation("選択肢JSONを確認してください");
            return;
          }
          setValidation("");
          void call("kg_save_plan", {
            subscription: plan.subscription,
            product: plan.product,
            options,
            quantity: Number(plan.quantity),
            first_shipping: plan.date,
            reason: plan.reason,
          });
        }}
      >
        <h3 className="font-bold sm:col-span-2">契約の発送アンカーを確認</h3>
        <p className="text-sm sm:col-span-2">
          契約・商品設定を確認して発送回を生成します。周期は契約の値を使います。次回請求日だけでは過去の発送実績を判定しません。休止が不明な契約は登録せず要確認としてください。
        </p>
        <label>
          契約
          <select
            required
            className={cls}
            value={plan.subscription}
            onChange={(e) => setPlan({ ...plan, subscription: e.target.value })}
          >
            <option value="">選択</option>
            {p.subscriptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.stripe_subscription_id} · {s.status} · {s.interval}
              </option>
            ))}
          </select>
        </label>
        <label>
          商品
          <select
            required
            className={cls}
            value={plan.product}
            onChange={(e) => setPlan({ ...plan, product: e.target.value })}
          >
            <option value="">選択</option>
            {p.products.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          確認済み初回/再開発送日
          <input
            required
            type="date"
            className={cls}
            value={plan.date}
            onChange={(e) => setPlan({ ...plan, date: e.target.value })}
          />
        </label>
        <label>
          1回の数量
          <input
            required
            type="number"
            min="1"
            step="1"
            className={cls}
            value={plan.quantity}
            onChange={(e) => setPlan({ ...plan, quantity: e.target.value })}
          />
        </label>
        <label>
          商品設定と一致する選択肢JSON
          <textarea
            required
            className={cls}
            value={plan.options}
            onChange={(e) => setPlan({ ...plan, options: e.target.value })}
          />
        </label>
        <label>
          確認根拠
          <input
            required
            className={cls}
            value={plan.reason}
            onChange={(e) => setPlan({ ...plan, reason: e.target.value })}
          />
        </label>
        <button disabled={p.busy} className={btn}>
          契約を確認・発送回を生成
        </button>
      </form>
      <ul className="space-y-2 text-sm">
        {p.plans.map((x) => (
          <li key={x.id} className={x.issue ? "text-red-800" : ""}>
            {
              p.subscriptions.find((s) => s.id === x.subscription_id)
                ?.stripe_subscription_id
            }
            ：{x.issue || "予測生成済み（実注文との照合が必要）"}
          </li>
        ))}
      </ul>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void call("kg_link_delivery", {
            slot: link.slot,
            item: link.item,
            reason: link.reason,
          });
        }}
      >
        <h3 className="font-bold sm:col-span-2">実注文を発送回へ紐付け</h3>
        <p className="text-sm sm:col-span-2">
          注文・請求・出荷証拠を確認して1回だけ紐付けます。予測を注文の原料確保へ置き換え、二重に控除しません。発送済みの品種・重量・精米区分はこの照合時に固定します。過去の発送情報のコピーが疑われる場合は紐付けないでください。
        </p>
        <label>
          未紐付けの発送回
          <select
            required
            className={cls}
            value={link.slot}
            onChange={(e) =>
              setLink({ ...link, slot: e.target.value, item: "" })
            }
          >
            <option value="">選択</option>
            {p.slots
              .filter((s) => !s.item_id)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shipping_date} ·{" "}
                  {
                    p.subscriptions.find(
                      (x) =>
                        x.id ===
                        p.plans.find((x) => x.id === s.plan_id)
                          ?.subscription_id,
                    )?.stripe_subscription_id
                  }{" "}
                  {s.canceled ? "（予測取消済み）" : ""}
                </option>
              ))}
          </select>
        </label>
        <label>
          同じ契約の注文明細
          <select
            required
            className={cls}
            value={link.item}
            onChange={(e) => setLink({ ...link, item: e.target.value })}
          >
            <option value="">選択</option>
            {p.orders
              .filter(
                (o) =>
                  o.stripe_subscription_id === sub?.stripe_subscription_id &&
                  sub,
              )
              .flatMap((o) =>
                o.order_items
                  .filter((i) => i.is_subscription)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {o.order_number} · {i.product_title}
                    </option>
                  )),
              )}
          </select>
        </label>
        <label>
          照合根拠
          <input
            required
            className={cls}
            value={link.reason}
            onChange={(e) => setLink({ ...link, reason: e.target.value })}
          />
        </label>
        <button className={btn} disabled={p.busy}>
          予測を注文確保に置き換え
        </button>
      </form>
      <details>
        <summary>発送回と固定構成 {p.slots.length}件</summary>
        <ul className="text-sm space-y-2 mt-3">
          {p.slots.map((s) => (
            <li key={s.id} className="break-all">
              {s.shipping_date} ·{" "}
              {s.item_id ? "注文紐付け済み" : s.canceled ? "取消" : "予測確保"}{" "}
              · 数量{s.quantity}
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(s.components)}
              </pre>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
