import { type Component, varieties } from './kgInventory';

export type AutoCandidate = {
  item_id: string; order_number: string | null; title: string;
  status: 'ready' | 'exclude'; reason: string; fingerprint: string;
  quantity: number; harvest_year: number | null; components: Component[];
  excluded: boolean;
};
export type AutoBatch = {
  id: string; harvest_year: number | null; candidates: AutoCandidate[]; processed: number;
};
export type AutoSummary = { status: string; reason: string; harvest_year: string | null; items: number };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const object = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

/** Fail closed if an old/malformed SQL result would make the review misleading. */
export function decodeAutoBatch(value: unknown): AutoBatch {
  if (!object(value) || typeof value.id !== 'string' || !uuid.test(value.id) ||
      !Array.isArray(value.candidates) || !Number.isInteger(value.processed) ||
      (value.processed as number) < 0 || (value.processed as number) > value.candidates.length ||
      !(value.harvest_year === null || Number.isInteger(value.harvest_year))) {
    throw new Error('確認結果の形式が一致しません。追加SQL・ログイン権限を確認してください。');
  }
  const seen = new Set<string>();
  for (const c of value.candidates) {
    if (!object(c) || typeof c.item_id !== 'string' || !uuid.test(c.item_id) || seen.has(c.item_id) ||
        typeof c.title !== 'string' || !(c.order_number === null || typeof c.order_number === 'string') ||
        typeof c.reason !== 'string' || typeof c.fingerprint !== 'string' || !/^[0-9a-f]{32}$/.test(c.fingerprint) ||
        !Number.isInteger(c.quantity) || (c.quantity as number) <= 0 || (c.quantity as number) > 10000 ||
        !Array.isArray(c.components) || !['ready', 'exclude'].includes(String(c.status)) ||
        c.excluded !== (c.status === 'exclude') ||
        (c.status === 'exclude' ? c.components.length !== 0 : !Number.isInteger(c.harvest_year) || c.components.length === 0)) {
      throw new Error('明細の確認情報が不完全です。反映せず、再判定してください。');
    }
    for (const p of c.components) {
      if (!object(p) || typeof p.season_id !== 'string' || !uuid.test(p.season_id) ||
          !Object.hasOwn(varieties, String(p.variety_key)) ||
          typeof p.unit_kg !== 'number' || !Number.isFinite(p.unit_kg) || p.unit_kg <= 0 ||
          !['white', 'partial', 'brown'].includes(String(p.milling))) {
        throw new Error('年産・品種・重量・精米区分を確認できないため反映できません。');
      }
    }
    seen.add(c.item_id);
  }
  return value as unknown as AutoBatch;
}

export function autoMappingTotals(batch: AutoBatch) {
  const groups = new Map<string, { year: number; variety: keyof typeof varieties; kg: number }>();
  for (const c of batch.candidates) {
    if (c.status !== 'ready' || c.harvest_year === null) continue;
    for (const p of c.components) {
      const key = `${c.harvest_year}:${p.variety_key}`;
      const factor = { white: 1.1, partial: 1.05, brown: 1 }[p.milling!];
      const previous = groups.get(key);
      // Integer milligrams match the existing raw-rice ledger's precision.
      const amount = Math.round(p.unit_kg * factor * c.quantity * 1e6);
      groups.set(key, { year: c.harvest_year, variety: p.variety_key, kg: (previous?.kg || 0) + amount });
    }
  }
  return [...groups.values()].map(g => ({ ...g, kg: g.kg / 1e6 }));
}

export function autoMappingError(error: unknown): string {
  const e = error as { message?: string; code?: string };
  if (e?.code === 'PGRST202' || e?.code === '42883' || /does not exist|schema cache/i.test(e?.message || '')) {
    return '自動判定用SQLが未適用、または公開情報に未反映です。migration_add_kg_auto_mapping.sql を確認してください。';
  }
  if (e?.code === '40001' || e?.code === '55P03') {
    return '確認後にデータが変更されたか、別の処理が更新中です。処理状況を再取得し、再判定してください。';
  }
  return e?.message || '処理に失敗しました。ログイン状態・接続を確認してください。';
}
