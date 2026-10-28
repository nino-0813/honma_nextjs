/** Read-only adapters for the exact source tabs confirmed on 2026-10-28.
 * Parsing has no database, mail, stock, spreadsheet-write or network effects.
 */
export const externalSheetSources = [
  { id: 'rice_tabechoku', category: 'rice', channel: 'tabechoku', spreadsheetId: '1XvPCDAYhGXSpQV_rWgTbAgefmegEFulj3YCwgHPfDJg', tab: '食べチョク', sheetId: 0 },
  { id: 'rice_satofuru', category: 'rice', channel: 'satofuru', spreadsheetId: '1XvPCDAYhGXSpQV_rWgTbAgefmegEFulj3YCwgHPfDJg', tab: 'さとふる', sheetId: 1791632146 },
  { id: 'rice_furusatodo', category: 'rice', channel: 'furusatodo', spreadsheetId: '1XvPCDAYhGXSpQV_rWgTbAgefmegEFulj3YCwgHPfDJg', tab: 'ふるさとdo', sheetId: 1053753979 },
  { id: 'shiitake_yorankasha', category: 'shiitake', channel: 'yorankasha', spreadsheetId: '1BOqMaHeY0zyX8AZ3duvOhUhSzxBEAOXycRieN80JpQw', tab: 'よらんか舎', sheetId: 1999545666 },
  { id: 'shiitake_other', category: 'shiitake', channel: 'unconfirmed', spreadsheetId: '1BOqMaHeY0zyX8AZ3duvOhUhSzxBEAOXycRieN80JpQw', tab: 'シート1', sheetId: 0 },
] as const;
export type ExternalSheetSourceId = typeof externalSheetSources[number]['id'];
export type ExternalSheetLine = {
  source: ExternalSheetSourceId;
  sourceRow: number;
  sourceKey: string | null;
  sourceKeyBasis: 'explicit_line_id' | 'order_product' | 'mail_product' | 'unresolved';
  externalOrderId: string | null;
  date: string | null;
  product: string;
  quantity: number | null;
  reportedSales: number | null;
  productSales: number | null;
  shippingAmount: number | null;
  productDiscount: number | null;
  harvestYear: number | null;
  unitKg: number | null;
  variety: 'koshihikari' | 'kamenoo' | 'nikomaru' | null;
  milling: 'white' | 'partial' | 'brown' | null;
  status: 'active' | 'cancelled' | 'unconfirmed';
  mailIds: string[];
  referrerId: string | null;
  issues: string[];
  inventoryReady: boolean;
};
const text = (value: unknown) => value == null ? '' : String(value).normalize('NFKC').trim();
function nonnegativeNumber(value: unknown): number | null {
  const raw = text(value).replace(/[,，¥￥円\s]/g, '');
  if (!/^\d+(?:\.\d+)?$/.test(raw)) return null;
  const number = Number(raw);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
function day(value: unknown) {
  const match = text(value).match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s.*|T.*)?$/);
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2]), date = Number(match[3]);
  const checked = new Date(Date.UTC(year, month - 1, date));
  if (checked.getUTCFullYear() !== year || checked.getUTCMonth() !== month - 1 || checked.getUTCDate() !== date) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
}
export function parseExternalSheet(sourceId: ExternalSheetSourceId, headers: unknown[], rows: unknown[][]) {
  const source = externalSheetSources.find(s => s.id === sourceId);
  if (!source) throw new Error('Unknown external sheet source');
  const header = headers.map(h => text(h).replace(/\s/g, ''));
  for (const name of ['日時', '商品名']) if (!header.includes(name)) throw new Error(`必須の列がありません：${name}`);
  if (header.some((name, index) => name && header.indexOf(name) !== index)) throw new Error('同じ名前の列が重複しています');
  const lines: ExternalSheetLine[] = [];
  rows.forEach((row, index) => {
    if (row.every(v => !text(v))) return;
    const get = (name: string) => { const i = header.indexOf(text(name).replace(/\s/g, '')); return i < 0 ? '' : text(row[i]); };
    const issues: string[] = [];
    const date = day(get('日時'));
    const product = get('商品名');
    const rawQuantity = nonnegativeNumber(get('個数') || get('数量'));
    const quantity = rawQuantity != null && Number.isSafeInteger(rawQuantity) && rawQuantity <= 1_000_000 ? rawQuantity : null;
    const order = get('注文番号') || null;
    const state = get('注文状態');
    const status = ['有効', 'active'].includes(state) ? 'active'
      : ['キャンセル', '取消', 'cancelled', 'canceled'].includes(state) ? 'cancelled' : 'unconfirmed';
    const mailIds = [...new Set(get('取込メールID（管理用）').split(/[,、\s]+/).filter(Boolean))].sort();
    const rawYear = get('年産').replace(/年産$/, '');
    const harvestYear = /^20\d{2}$/.test(rawYear) ? Number(rawYear) : null;
    const weightMatch = get('重量').match(/^(\d+(?:\.\d+)?)\s*(kg|g)$/i);
    const unitKg = weightMatch ? Number(weightMatch[1]) / (weightMatch[2].toLowerCase() === 'g' ? 1000 : 1) : null;
    const variety = ['コシヒカリ', '在来コシヒカリ'].includes(product) ? 'koshihikari'
      : product === '亀の尾' ? 'kamenoo' : product === 'にこまる' ? 'nikomaru' : null;
    const millingValue = get('種類');
    const milling = millingValue === '白米' ? 'white' : millingValue === '玄米' ? 'brown'
      : /^(?:[357]分づき|分づき|分搗き)$/.test(millingValue) ? 'partial' : null;
    const lineId = get('明細ID');
    const identity = lineId ? ['line', lineId]
      : order ? ['order', order, product, millingValue, get('重量')]
      : mailIds.length && date ? ['mail', mailIds.join(','), date, product] : null;
    const sourceKey = identity ? [source.id, ...identity].map(encodeURIComponent).join(':') : null;
    if (!date) issues.push('日時を確認してください');
    if (!product) issues.push('商品名がありません');
    if (quantity == null || (status !== 'cancelled' && quantity === 0)) issues.push('数量が未登録または不正です');
    if (status === 'unconfirmed') issues.push('注文状態が未確認です');
    if (!sourceKey) issues.push('注文番号・メールID・明細IDによる識別ができません');
    if (source.channel === 'unconfirmed') issues.push('販売チャネルを確認してください');
    if (source.category === 'rice') {
      if (!harvestYear) issues.push('年産が未登録です');
      if (!variety) issues.push('品種を確認してください');
      if (!milling) issues.push('精米区分を確認してください');
      if (!unitKg || unitKg > 100000) issues.push('重量を確認してください');
    }
    lines.push({ source: sourceId, sourceRow: index + 2, sourceKey,
      sourceKeyBasis: lineId ? 'explicit_line_id' : order ? 'order_product' : identity ? 'mail_product' : 'unresolved',
      externalOrderId: order, date, product, quantity,
      reportedSales: nonnegativeNumber(get('売上')), productSales: nonnegativeNumber(get('商品売上')),
      shippingAmount: nonnegativeNumber(get('送料')), productDiscount: nonnegativeNumber(get('商品値引き')),
      harvestYear, unitKg, variety, milling, status, mailIds,
      referrerId: get('紹介者ID') || null, issues, inventoryReady: issues.length === 0,
    });
  });
  const counts = new Map<string, number>();
  for (const line of lines) if (line.sourceKey) counts.set(line.sourceKey, (counts.get(line.sourceKey) || 0) + 1);
  for (const line of lines) if (line.sourceKey && counts.get(line.sourceKey)! > 1) {
    line.issues.push('同じ明細が複数あります。明細IDで区別するか重複を確認してください');
    line.inventoryReady = false;
  }
  return {
    source: source.id,
    lines,
    readyCount: lines.filter(l => l.inventoryReady).length,
    reviewCount: lines.filter(l => !l.inventoryReady).length,
    // The sheet's generic 売上 column has not been certified as merchandise
    // revenue. Never silently use it to calculate referral commissions.
    referralFinancialBasisConfirmed: false as const,
  };
}
