import type { AreaFees } from '../types';

export type ShippingPlanItem = { product_id: string; title: string; quantity: number; free: boolean };
export function datedShipmentShippingPlan(items: (ShippingPlanItem & { firstShipping: string })[], links: Record<string,string[]>, methods: any[], prefecture: string, preferred?: string) {
  const byDate = new Map<string,ShippingPlanItem[]>();
  for (const item of items) byDate.set(item.firstShipping,[...(byDate.get(item.firstShipping) || []),item]);
  const shipments = [...byDate].sort(([a],[b]) => a.localeCompare(b)).map(([firstShipping,entries]) => ({ firstShipping,...shipmentShippingPlan(entries,links,methods,prefecture,preferred) }));
  const byMethod: Record<string,{cost:number;itemsText:string;sizeBreakdownText?:string}> = {};
  for (const shipment of shipments) for (const [id,entry] of Object.entries(shipment.byMethod)) {
    byMethod[id] = { cost:(byMethod[id]?.cost || 0)+entry.cost, itemsText:[byMethod[id]?.itemsText,`${shipment.firstShipping}発送：${entry.itemsText}`].filter(Boolean).join(' / ') };
  }
  return { totalCost:shipments.reduce((sum,shipment) => sum+shipment.totalCost,0),byMethod,shipments };
}
export function shipmentShippingPlan(items: ShippingPlanItem[], links: Record<string,string[]>, methods: any[], prefecture: string, preferred?: string) {
  const area = getAreaFromPrefecture(prefecture);
  if (!area) throw new Error('都道府県から送料を計算できません');
  const byId = new Map(methods.map(method => [method.id,method]));
  const methodCost = (method: any, quantity: number) => {
    const cap = Number(method.max_items_per_box || 1);
    if (!Number.isSafeInteger(cap) || cap < 1) throw new Error('箱の上限数量が不正です');
    let cost: number;
    if (method.fee_type === 'uniform' && method.uniform_fee != null) cost = Math.ceil(quantity/cap) * Number(method.uniform_fee);
    else if (method.fee_type === 'area') {
      const key = method.area_fees?.[area] != null ? area : AREA_KEY_COMPAT[area];
      if (method.area_fees?.[key] == null) throw new Error('配送地域の送料設定がありません');
      cost = Math.ceil(quantity/cap) * Number(method.area_fees[key]);
    } else if (method.fee_type === 'size') {
      cost = getMinPlanForSizeFees(method.size_fees, quantity, area).cost;
      if (!cost) throw new Error('配送地域のサイズ別送料設定がありません');
    } else throw new Error('発送方法の料金設定がありません');
    if (!Number.isSafeInteger(cost) || cost < 0) throw new Error('送料が不正です');
    return cost;
  };
  const assigned = new Map<string,ShippingPlanItem[]>();
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000) throw new Error('発送数量が不正です');
    if (item.free) continue;
    const ids = links[item.product_id] || [];
    const candidates = ids.flatMap(id => {
      const method = byId.get(id); if (!method) return [];
      try { return [{id,cost:methodCost(method,item.quantity)}]; } catch { return []; }
    });
    if (!candidates.length) throw new Error('商品に有効な発送方法が設定されていません');
    const chosen = candidates.find(candidate => candidate.id === preferred) || candidates.filter(candidate => candidate.cost > 0).sort((a,b) => a.cost-b.cost)[0] || candidates[0];
    assigned.set(chosen.id,[...(assigned.get(chosen.id) || []),item]);
  }
  const byMethod: Record<string,{cost:number;itemsText:string;sizeBreakdownText?:string}> = {};
  for (const [id,entries] of assigned) {
    const quantity = entries.reduce((sum,item) => sum+item.quantity,0);
    if (quantity > 10000) throw new Error('発送数量が上限を超えています');
    byMethod[id] = { cost:methodCost(byId.get(id),quantity), itemsText:entries.map(item => `${item.title}×${item.quantity}`).join(' / ') };
  }
  const totalCost = Object.values(byMethod).reduce((sum,entry) => sum+entry.cost,0);
  if (!Number.isSafeInteger(totalCost)) throw new Error('送料が上限を超えています');
  return { totalCost,byMethod };
}

// 都道府県から地域（AreaFeesのキー）を判定
// NOTE: 送料テーブルの地域キーは運用で変遷しやすい（旧: north_tohoku/kanto... 新: kitatohoku/kanto_area...）
//       Checkout側は両方に対応して「0円」にならないようにする。
export const getAreaFromPrefecture = (prefecture: string): keyof AreaFees | null => {
  if (!prefecture) return null;

  if (prefecture === '北海道') return 'hokkaido';
  // 新地域区分（ShippingMethodEditorのキーに合わせる）
  if (['青森県', '秋田県', '岩手県'].includes(prefecture)) return 'kitatohoku' as any;
  if (['宮城県', '山形県', '福島県'].includes(prefecture)) return 'minamitohoku' as any;
  if (['東京都', '神奈川県', '山梨県', '千葉県', '茨城県', '栃木県', '群馬県', '埼玉県'].includes(prefecture)) return 'kanto_area' as any;
  if (['新潟県', '長野県'].includes(prefecture)) return 'shinetsu';
  if (['富山県', '石川県', '福井県'].includes(prefecture)) return 'hokuriku';
  if (['静岡県', '愛知県', '三重県', '岐阜県'].includes(prefecture)) return 'chubu_area' as any;
  if (['大阪府', '京都府', '滋賀県', '奈良県', '和歌山県', '兵庫県'].includes(prefecture)) return 'kansai_area' as any;
  if (['岡山県', '広島県', '山口県', '鳥取県', '島根県'].includes(prefecture)) return 'chugoku_area' as any;
  if (['香川県', '徳島県', '愛媛県', '高知県'].includes(prefecture)) return 'shikoku_area' as any;
  if (['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県'].includes(prefecture)) return 'kyushu_area' as any;
  if (prefecture === '沖縄県') return 'okinawa_area' as any;

  return null;
};

const AREA_KEY_COMPAT: Record<string, string> = {
  // new -> old
  kitatohoku: 'north_tohoku',
  minamitohoku: 'south_tohoku',
  kanto_area: 'kanto',
  chubu_area: 'chubu',
  kansai_area: 'kansai',
  chugoku_area: 'chugoku',
  shikoku_area: 'shikoku',
  kyushu_area: 'kyushu',
  okinawa_area: 'okinawa',
  // old -> new
  north_tohoku: 'kitatohoku',
  south_tohoku: 'minamitohoku',
  kanto: 'kanto_area',
  chubu: 'chubu_area',
  kansai: 'kansai_area',
  chugoku: 'chugoku_area',
  shikoku: 'shikoku_area',
  kyushu: 'kyushu_area',
  okinawa: 'okinawa_area',
};

export const getAreaFee = (fees: any, areaKey: string | null): number => {
  if (!fees || !areaKey) return 0;
  const direct = fees?.[areaKey];
  if (direct !== undefined && direct !== null) return Number(direct) || 0;
  const compat = AREA_KEY_COMPAT[areaKey];
  const alt = compat ? fees?.[compat] : undefined;
  if (alt !== undefined && alt !== null) return Number(alt) || 0;
  return 0;
};

type SizeBoxType = {
  size?: number;
  weight_kg?: number;
  cap: number;   // 1箱に入る数
  cost: number;  // 1箱あたりの送料（地域別）
};

type SizeFeePlan = {
  cost: number;
  boxes: Array<{ label: string; count: number; perBoxCost: number; cap: number }>;
};

// サイズ別送料（size_fees）で、qty個を送る最小送料と箱割りを求める
// - boxType: { max_items_per_box, area_fees } を1箱として扱う
// - 例: 100サイズ(5個/箱) + 60サイズ(1個/箱) など「混在」も最小化に含める
export const getMinPlanForSizeFees = (sizeFees: any, qty: number, areaKey: string | null): SizeFeePlan => {
  const target = Math.max(0, Number(qty || 0));
  if (!sizeFees || target <= 0) return { cost: 0, boxes: [] };

  const boxTypes: SizeBoxType[] = [];
  for (const sf of Object.values(sizeFees as any)) {
    const cap = Math.max(1, Number((sf as any)?.max_items_per_box || 1));
    const cost = getAreaFee((sf as any)?.area_fees, areaKey);
    const size = (sf as any)?.size;
    const weight_kg = (sf as any)?.weight_kg;
    if (cost > 0) boxTypes.push({ size, weight_kg, cap, cost });
  }
  if (boxTypes.length === 0) return { cost: 0, boxes: [] };

  // dp[i] = i個送る最小送料（iは0..target）
  const dp = Array(target + 1).fill(Infinity) as number[];
  const prev = Array(target + 1).fill(-1) as number[];
  const prevBoxIdx = Array(target + 1).fill(-1) as number[];
  dp[0] = 0;
  for (let i = 0; i <= target; i++) {
    if (!Number.isFinite(dp[i])) continue;
    for (let b = 0; b < boxTypes.length; b++) {
      const bt = boxTypes[b];
      const next = Math.min(target, i + bt.cap);
      const cand = dp[i] + bt.cost;
      if (cand < dp[next]) {
        dp[next] = cand;
        prev[next] = i;
        prevBoxIdx[next] = b;
      }
    }
  }
  if (!Number.isFinite(dp[target])) return { cost: 0, boxes: [] };

  // reconstruct
  const counts = new Map<number, number>(); // boxIdx -> count
  let cur = target;
  while (cur > 0 && prev[cur] !== -1 && prevBoxIdx[cur] !== -1) {
    const bi = prevBoxIdx[cur];
    counts.set(bi, (counts.get(bi) || 0) + 1);
    cur = prev[cur];
  }

  const boxes: SizeFeePlan['boxes'] = [];
  for (const [bi, count] of counts.entries()) {
    const bt = boxTypes[bi];
    const label = bt.size ? `${bt.size}サイズ` : 'サイズ別';
    boxes.push({ label, count, perBoxCost: bt.cost, cap: bt.cap });
  }
  // size順に並べる（見やすさ）
  boxes.sort((a, b) => {
    const an = Number(String(a.label).replace(/[^0-9]/g, '') || 0);
    const bn = Number(String(b.label).replace(/[^0-9]/g, '') || 0);
    return an - bn;
  });

  return { cost: dp[target], boxes };
};
