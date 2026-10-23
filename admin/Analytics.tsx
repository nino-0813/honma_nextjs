"use client";
import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { loadStoreAnalytics } from "@/lib/loadStoreAnalytics";
import type { AnalyticsData, AnalyticsTarget } from "@/lib/storeAnalytics";
import AnalyticsDashboard from "./AnalyticsDashboard";
export default function Analytics() {
  const [snapshot, setSnapshot] = useState<{
    data: AnalyticsData;
    now: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!supabase) throw new Error("接続設定がありません");
      const data = await loadStoreAnalytics(supabase);
      setSnapshot({ data, now: new Date() });
    } catch (error) {
      setSnapshot(null);
      setError(
        error instanceof Error ? error.message : "集計を読み込めませんでした",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function saveTarget(target: AnalyticsTarget) {
    if (!supabase || !snapshot?.data.targetsReady)
      throw new Error("目標設定を読み込めていないため保存できません。");
    const { data, error } = await supabase
      .from("analytics_yearly_targets")
      .upsert(target, { onConflict: "year" })
      .select("year,revenue_target,gross_profit_target")
      .single();
    if (error) throw new Error(error.message);
    if (!data)
      throw new Error(
        "保存結果を確認できませんでした。再読み込みして確認してください。",
      );
    setSnapshot((previous) =>
      previous
        ? {
            ...previous,
            data: {
              ...previous.data,
              targets: [
                ...previous.data.targets.filter(
                  (row) => Number(row.year) !== target.year,
                ),
                data as AnalyticsTarget,
              ],
            },
          }
        : previous,
    );
  }
  if (loading)
    return (
      <div
        role="status"
        className="rounded-xl border bg-white p-8 text-gray-600"
      >
        ストア分析を全件集計しています…
      </div>
    );
  if (error || !snapshot)
    return (
      <section
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6"
      >
        <h1 className="text-xl font-bold">ストア分析を読み込めませんでした</h1>
        <p className="mt-2">
          {error}。取得に失敗した数値は0として表示しません。
        </p>
        <button
          type="button"
          className="mt-4 rounded-lg bg-white px-4 py-3"
          onClick={() => void load()}
        >
          再試行
        </button>
      </section>
    );
  return (
    <AnalyticsDashboard
      data={snapshot.data}
      now={snapshot.now}
      onRefresh={() => void load()}
      onSaveTarget={saveTarget}
    />
  );
}
