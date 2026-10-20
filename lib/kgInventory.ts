export const varieties = {
  koshihikari: "コシヒカリ",
  nikomaru: "にこまる",
  kamenoo: "亀の尾",
} as const;
export type Component = {
  season_id: string;
  variety_key: keyof typeof varieties;
  unit_kg: number;
  milling?: "white" | "partial" | "brown";
  raw_unit_kg?: number;
};
export type Movement = {
  id: string;
  season_id: string;
  variety_key: string;
  kind: string;
  incoming_kg: number;
  used_kg: number;
  held_kg: number;
  reason: string;
  created_at: string;
  order_id?: string;
  accounting_version?: number;
};
export type Snapshot = {
  item_id: string;
  accounting_version?: number;
  reason: string;
  excluded: boolean;
  components: Component[];
  quantity: number;
};
export type Item = {
  id: string;
  product_title: string;
  is_subscription?: boolean;
  quantity: number;
  selected_options: unknown;
  order_id: string;
};
export type Order = {
  id: string;
  order_number: string;
  stripe_subscription_id?: string;
  payment_status: string;
  order_status: string;
  order_items: Item[];
};
export type LegacyStock = {
  season_id: string;
  variety_key: string;
  harvested_kg: number;
  reserved_kg: number;
};
export type LegacySale = {
  id: string;
  season_id: string;
  variety_key: string;
  quantity_kg: number;
  channel: string;
  note: string;
  sold_on: string;
};
// Integer grams prevent accumulated binary floating point rounding errors in presentation.
export const grams = (kg: number) => Math.round(Number(kg) * 1000);
export type LegacyReview = {
  season_id: string;
  variety_key: string;
  original_kg: number;
};
export function summarize(
  season: string,
  movements: Movement[],
  stocks: LegacyStock[],
  sales: LegacySale[],
  reviews: LegacyReview[] = [],
) {
  return Object.entries(varieties).map(([key, label]) => {
    const stock = stocks.find(
      (s) => s.season_id === season && s.variety_key === key,
    );
    let incoming = grams(stock?.harvested_kg || 0),
      used = 0,
      held = 0;
    for (const sale of sales.filter(
      (s) => s.season_id === season && s.variety_key === key,
    ))
      used += grams(sale.quantity_kg);
    for (const m of movements.filter(
      (m) => m.season_id === season && m.variety_key === key,
    )) {
      incoming += grams(m.incoming_kg);
      used += grams(m.used_kg);
      held += grams(m.held_kg);
    }
    const legacyHeld = grams(stock?.reserved_kg || 0);
    const reviewed = reviews.some(
      (r) =>
        r.season_id === season &&
        r.variety_key === key &&
        grams(r.original_kg) === legacyHeld,
    );
    // Legacy manual reservations are shown separately, never blindly added to automatic order holds.
    return {
      key,
      label,
      incoming: incoming / 1000,
      used: used / 1000,
      held: held / 1000,
      legacyHeld: legacyHeld / 1000,
      reviewRequired: legacyHeld > 0 && !reviewed,
      available: (incoming - used - held) / 1000,
    };
  });
}
export function unresolvedOrders(
  orders: Order[],
  snapshots: Snapshot[],
  requireRaw = false,
) {
  const byId = new Map(snapshots.map((s) => [s.item_id, s]));
  return orders.flatMap<{
    id: string;
    order: string;
    title: string;
    item: Item | null;
    reason: string;
  }>((o) => {
    if (!o.order_items?.length)
      return [
        {
          id: o.id,
          order: o.order_number || o.id,
          title: "明細なし（注文画面で要確認）",
          item: null,
          reason: "明細欠落",
        },
      ];
    return o.order_items.flatMap((i) => {
      const s = byId.get(i.id);
      if (
        s &&
        !s.reason.startsWith("REVIEW:") &&
        (!requireRaw || s.accounting_version === 2)
      )
        return [];
      return [
        {
          id: i.id,
          order: o.order_number || o.id,
          title: `${i.product_title} × ${i.quantity}`,
          item: i,
          reason: s
            ? requireRaw && s.accounting_version !== 2
              ? "旧重量基準のスナップショット（自動換算しません）"
              : s.reason
            : "購入時情報なし・未紐付け（年産を推定しません）",
        },
      ];
    });
  });
}

/** Raw-rice v2 uses integer milligrams; old unconfirmed values are not converted. */
export function summarizeRaw(
  season: string,
  movements: Movement[],
  baselines: {
    season_id: string;
    variety_key: string;
    incoming_kg: number;
    external_used_kg: number;
    external_held_kg: number;
  }[],
) {
  const mg = (n: unknown) => Math.round(Number(n || 0) * 1_000_000);
  return Object.entries(varieties).map(([key, label]) => {
    const b = baselines.find(
      (x) => x.season_id === season && x.variety_key === key,
    );
    let incoming = mg(b?.incoming_kg),
      used = mg(b?.external_used_kg),
      held = mg(b?.external_held_kg),
      future = 0;
    for (const m of movements.filter(
      (x) =>
        x.season_id === season &&
        x.variety_key === key &&
        x.accounting_version === 2,
    )) {
      incoming += mg(m.incoming_kg);
      used += mg(m.used_kg);
      held += mg(m.held_kg);
      if (m.kind === "forecast") future += mg(m.held_kg);
    }
    return {
      key,
      label,
      incoming: incoming / 1e6,
      used: used / 1e6,
      held: held / 1e6,
      futureHeld: future / 1e6,
      legacyHeld: 0,
      reviewRequired: false,
      basisMissing: !b,
      available: (incoming - used - held) / 1e6,
    };
  });
}
