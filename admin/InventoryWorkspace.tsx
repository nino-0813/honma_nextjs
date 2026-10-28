"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import ShiitakeInventory from "./ShiitakeInventory";
import styles from "./ShiitakeInventory.module.css";

export default function InventoryWorkspace({
  ricePanel,
  initialCategory = "rice",
  shiitakeSettings,
  shiitakePanel,
  externalPanel,
}: {
  ricePanel: React.ReactNode;
  initialCategory?: "rice" | "shiitake";
  shiitakeSettings?: React.ReactNode;
  shiitakePanel?: React.ReactNode;
  externalPanel?: React.ReactNode;
}) {
  const [category, setCategory] = useState<"rice" | "shiitake" | "external">(initialCategory);
  return (
    <div className={styles.workspace}>
      {category === "shiitake" && (
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h1>在庫システム</h1>
            <span className={styles.sampleBadge}>
              {shiitakePanel ? "照合済みデータを集計" : shiitakeSettings ? "開始在庫設定／在庫表示はサンプル" : "デザイン案・サンプルデータ"}
            </span>
          </div>
          <p>
            {shiitakePanel ? "開始在庫と補充・調整、照合済みの売上を集計します。未照合分がある間は参考値です。" : shiitakeSettings
              ? "開始在庫の設定を保存・修正できます。推定在庫・補充操作の表示例は、実データとは別のサンプルです。"
              : "店舗の在庫状況を確認し、補充の記録・管理を行います。すべての数値・履歴はサンプルであり、実際の在庫ではありません。"}
          </p>
          <div className={styles.connectionNotice}>
            <Info size={18} aria-hidden="true" />
            <span>{shiitakePanel ? "実際の受信・要確認状況は「外部注文・取込確認」で確認できます。" : "GAS・スプレッドシート連携は未設定です。"}</span>
          </div>
        </header>
      )}
      <nav className={styles.categoryTabs} aria-label="在庫の商品カテゴリー">
        <button
          type="button"
          aria-pressed={category === "rice"}
          className={category === "rice" ? styles.activeTab : ""}
          onClick={() => setCategory("rice")}
        >
          お米
        </button>
        {externalPanel && <button type="button" aria-pressed={category === 'external'} className={category === 'external' ? styles.activeTab : ''} onClick={() => setCategory('external')}>外部注文・取込確認</button>}
        <button
          type="button"
          aria-pressed={category === "shiitake"}
          className={category === "shiitake" ? styles.activeTab : ""}
          onClick={() => setCategory("shiitake")}
        >
          椎茸・直売所
        </button>
      </nav>
      <div hidden={category !== "rice"}>{ricePanel}</div>
      {category === "shiitake" && shiitakeSettings}
      {category === "external" && externalPanel}
      {/* Preserve trial state when switching categories; no writes or persistence. */}
      <div hidden={category !== "shiitake"}>
        {shiitakePanel ? category === 'shiitake' && shiitakePanel : <ShiitakeInventory />}
      </div>
    </div>
  );
}
