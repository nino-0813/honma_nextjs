"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { varieties, type Component, type Item } from "@/lib/kgInventory";
import { millingFactors, millingLabels } from "@/lib/inventoryPresentation";
import type { Product } from "@/types";

export type InventorySpec = {
  id: string;
  product_id: string;
  options: unknown;
  components: unknown;
  excluded: boolean;
  note: string;
};
type Season = { id: string; label: string };
type ReviewItem = {
  id: string;
  order: string;
  title: string;
  reason: string;
  item: Item | null;
};
type Props = {
  season: string;
  seasons: Season[];
  products: { id: string; title: string }[];
  specs: InventorySpec[];
  unknown: ReviewItem[];
  rawMode: boolean;
  busy: boolean;
  save: (
    action: () => PromiseLike<{ error: { message: string } | null }>,
  ) => Promise<unknown>;
};
const input =
  "mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm";
const btn =
  "min-h-11 rounded-lg bg-emerald-800 px-4 py-2 text-sm text-white disabled:opacity-40";
const blank = (season: string): Component => ({
  season_id: season,
  variety_key: "koshihikari",
  unit_kg: 0,
});

export default function InventoryMapping(p: Props) {
  const [target, setTarget] = useState("product");
  const [product, setProduct] = useState("");
  const [item, setItem] = useState("");
  const [groups, setGroups] = useState<NonNullable<Product["variants_config"]>>(
    [],
  );
  const [options, setOptions] = useState<Record<string, string>>({});
  const [optionsReady, setOptionsReady] = useState(false);
  const [parts, setParts] = useState<Component[]>([blank(p.season)]);
  const [excluded, setExcluded] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  useEffect(() => {
    setParts([blank(p.season)]);
  }, [p.season]);
  useEffect(() => {
    let active = true;
    setGroups([]);
    setOptions({});
    setOptionsReady(false);
    if (!product || target !== "product" || !supabase) return;
    void (async () => {
      try {
        const result = await supabase!
          .from("products")
          .select("variants_config,variants,has_variants")
          .eq("id", product)
          .single();
        if (!active) return;
        if (result.error) throw new Error(result.error.message);
        const config = result.data?.variants_config || [];
        if (!Array.isArray(config))
          throw new Error("商品の選択肢を読み取れませんでした");
        if (
          !config.length &&
          (result.data?.has_variants || result.data?.variants?.length)
        )
          throw new Error(
            "旧形式の選択肢です。商品管理で選択肢設定を確認してください",
          );
        setGroups(config);
        setOptionsReady(true);
        setError("");
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [product, target]);
  const reviews = p.unknown.filter((u) =>
    `${u.order} ${u.title} ${u.reason}`.includes(search),
  );
  const currentItem = p.unknown.find((u) => u.id === item);
  const update = (index: number, patch: Partial<Component>) =>
    setParts((rows) =>
      rows.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!supabase) return;
    if (
      target === "product" &&
      (!optionsReady || groups.some((g) => !options[g.id]))
    ) {
      setError("すべての商品選択肢を選んでください");
      return;
    }
    if (
      target === "item" &&
      (!currentItem?.item ||
        currentItem.reason.startsWith("REVIEW:") ||
        currentItem.reason.includes("旧重量基準"))
    )
      return;
    if (
      !excluded &&
      parts.some(
        (c) =>
          !c.season_id ||
          !c.milling ||
          !Number.isFinite(c.unit_kg) ||
          c.unit_kg <= 0 ||
          c.unit_kg !== Math.round(c.unit_kg * 1000) / 1000,
      )
    ) {
      setError(
        "年産・精米方法と1個あたりの商品重量（小数3桁まで）を確認してください",
      );
      return;
    }
    const components = excluded
      ? []
      : parts.map((c) =>
          p.rawMode
            ? c
            : {
                season_id: c.season_id,
                variety_key: c.variety_key,
                unit_kg:
                  Math.round(
                    c.unit_kg * millingFactors[c.milling || "brown"] * 1000,
                  ) / 1000,
              },
        );
    await p.save(() =>
      target === "item"
        ? supabase!.rpc("kg_resolve_item", {
            item,
            components,
            excluded,
            reason,
          })
        : supabase!
            .from("kg_product_specs")
            .upsert(
              {
                product_id: product,
                options,
                components,
                excluded,
                note: reason,
              },
              { onConflict: "product_id,options" },
            ),
    );
  }
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <h2 className="text-lg font-bold">商品設定 / 過去注文の確認</h2>
        <p className="mt-2 text-sm text-gray-600">
          商品重量と精米方法を選ぶと、必要な玄米量を自動計算します。今後の商品設定は過去注文には遡りません。
        </p>
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            対象
            <select
              className={input}
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setError("");
              }}
            >
              <option value="product">これからの注文の商品設定</option>
              <option value="item">過去の注文明細を確認</option>
            </select>
          </label>
          {target === "product" ? (
            <label>
              商品
              <select
                required
                className={input}
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              >
                <option value="">選択してください</option>
                {p.products.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              注文明細
              <select
                required
                className={input}
                value={item}
                onChange={(e) => setItem(e.target.value)}
              >
                <option value="">選択してください</option>
                {reviews
                  .filter(
                    (u) =>
                      u.item &&
                      !u.reason.startsWith("REVIEW:") &&
                      !u.reason.includes("旧重量基準"),
                  )
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.order}：{u.title}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {target === "product" &&
            groups.map((g) => (
              <label key={g.id}>
                {g.name}
                <select
                  required
                  className={input}
                  value={options[g.id] || ""}
                  onChange={(e) =>
                    setOptions({ ...options, [g.id]: e.target.value })
                  }
                >
                  <option value="">選択してください</option>
                  {g.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.value}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          <label className="flex min-h-11 items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={excluded}
              onChange={(e) => setExcluded(e.target.checked)}
            />
            米ではない（保存袋・柿・椎茸など）
          </label>
          {!excluded && (
            <div className="space-y-3 sm:col-span-2">
              {parts.map((c, i) => (
                <fieldset key={i} className="rounded-xl bg-gray-50 p-4">
                  <legend className="text-sm font-semibold">
                    {parts.length > 1 ? `構成品 ${i + 1}` : "1個あたりのお米"}
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label>
                      年産
                      <select
                        required
                        className={input}
                        value={c.season_id}
                        onChange={(e) =>
                          update(i, { season_id: e.target.value })
                        }
                      >
                        <option value="">選択してください</option>
                        {p.seasons.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      品種
                      <select
                        className={input}
                        value={c.variety_key}
                        onChange={(e) =>
                          update(i, {
                            variety_key: e.target
                              .value as Component["variety_key"],
                          })
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
                      商品重量（kg／個）
                      <input
                        required
                        type="number"
                        min="0.001"
                        step="0.001"
                        className={input}
                        value={c.unit_kg || ""}
                        onChange={(e) =>
                          update(i, { unit_kg: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      精米方法
                      <select
                        required
                        className={input}
                        value={c.milling || ""}
                        onChange={(e) =>
                          update(i, {
                            milling: e.target.value as Component["milling"],
                          })
                        }
                      >
                        <option value="">選択してください</option>
                        {Object.entries(millingLabels).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v} ×
                            {millingFactors[k as keyof typeof millingFactors]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="mt-3 text-sm font-medium text-emerald-800">
                    必要な玄米：
                    {c.milling
                      ? `${(Math.round(c.unit_kg * millingFactors[c.milling] * 1e6) / 1e6).toLocaleString()} kg／個`
                      : "精米方法を選んでください"}
                  </p>
                  {parts.length > 1 && (
                    <button
                      type="button"
                      className="mt-2 text-sm text-red-700 underline"
                      onClick={() =>
                        setParts((rows) => rows.filter((_, j) => j !== i))
                      }
                    >
                      この構成品を外す
                    </button>
                  )}
                </fieldset>
              ))}
              <button
                type="button"
                className="min-h-11 text-sm text-emerald-800 underline"
                onClick={() => setParts([...parts, blank(p.season)])}
              >
                ＋ セットのお米を追加
              </button>
            </div>
          )}
          <label className="sm:col-span-2">
            確認根拠・理由
            <input
              required
              className={input}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例：商品設定と発送記録を確認"
            />
          </label>
          {target === "item" && currentItem && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm sm:col-span-2">
              {currentItem.order}：{currentItem.title}
              。注文数量は自動で掛けます。年産・精米方法は当時の記録で確認してください。
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          )}
          <button
            className={btn}
            disabled={p.busy || (target === "product" && !optionsReady)}
          >
            確認して保存
          </button>
        </form>
        <details className="mt-5">
          <summary className="cursor-pointer text-sm font-medium">
            登録済み商品設定 {p.specs.length}件
          </summary>
          <ul className="divide-y">
            {p.specs.map((s) => (
              <li key={s.id} className="py-3 text-sm">
                <p className="font-medium">
                  {p.products.find((v) => v.id === s.product_id)?.title ||
                    s.product_id}
                </p>
                <p>
                  {s.excluded
                    ? "お米以外・集計対象外"
                    : Array.isArray(s.components)
                      ? (s.components as Component[])
                          .map(
                            (c) =>
                              `${p.seasons.find((v) => v.id === c.season_id)?.label || "年産不明"} / ${varieties[c.variety_key]} / ${c.unit_kg}kg${c.milling ? ` / ${millingLabels[c.milling]}` : "（旧重量基準）"}`,
                          )
                          .join("、")
                      : "設定を確認してください"}
                </p>
                <p className="text-gray-500">{s.note}</p>
                <details className="mt-1">
                  <summary>選択肢の識別情報</summary>
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(s.options)}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        </details>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <h2 className="text-lg font-bold">未判定・要確認一覧</h2>
        <p className="mt-2 text-sm text-gray-600">
          確認できる注文から選び、上のフォームで年産・品種・重量を登録します。明細欠落や確定後の変更は注文管理と履歴の照合が必要です。
        </p>
        <label className="mt-4 block">
          注文番号・商品名で検索
          <input
            type="search"
            className={input}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <p className="mt-3 text-sm text-gray-500">
          {reviews.length.toLocaleString()}件中{" "}
          {reviews.length ? page * 20 + 1 : 0}〜
          {Math.min((page + 1) * 20, reviews.length)}件
        </p>
        <ul className="divide-y">
          {reviews.slice(page * 20, (page + 1) * 20).map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold">
                  {u.order} · {u.title}
                </p>
                <p className="mt-1 text-xs text-amber-800">{u.reason}</p>
              </div>
              {u.item &&
                !u.reason.startsWith("REVIEW:") &&
                !u.reason.includes("旧重量基準") && (
                  <button
                    type="button"
                    className="min-h-11 rounded-lg border px-4 text-sm"
                    onClick={() => {
                      setItem(u.id);
                      setTarget("item");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    この注文を確認
                  </button>
                )}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between">
          <button
            type="button"
            disabled={page === 0}
            className="min-h-11 px-4 disabled:opacity-40"
            onClick={() => setPage((v) => v - 1)}
          >
            前へ
          </button>
          <button
            type="button"
            disabled={(page + 1) * 20 >= reviews.length}
            className="min-h-11 px-4 disabled:opacity-40"
            onClick={() => setPage((v) => v + 1)}
          >
            次へ
          </button>
        </div>
      </div>
    </section>
  );
}
