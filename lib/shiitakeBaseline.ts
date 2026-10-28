export type ShiitakeBaseline = {
  baseline_date: string;
  phase: 'before_open' | 'after_close';
  quantity: number;
  revision: number;
  reason: string;
  updated_at: string;
};

// Confirmed by the user. A suggested form value, not a database seed or live stock.
export const suggestedShiitakeBaseline = { date: '2026-10-20', phase: 'before_open' as const, quantity: 18 };
export function validateShiitakeBaseline(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('入力内容を確認してください');
  const input = value as Record<string, unknown>;
  const date = input.date;
  if (typeof date !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('基準日を確認してください');
  if (input.phase !== 'before_open' && input.phase !== 'after_close') throw new Error('棚卸し時点を選んでください');
  if (typeof input.quantity !== 'number' || !Number.isSafeInteger(input.quantity) || input.quantity < 0 || input.quantity > 9999) throw new Error('数量は0〜9999個の整数で入力してください');
  if (typeof input.expectedRevision !== 'number' || !Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0) throw new Error('保存済みの設定を読み直してください');
  if (typeof input.reason !== 'string' || !input.reason.trim() || input.reason.trim().length > 200) throw new Error('変更理由を200文字以内で入力してください');
  return { date, phase: input.phase, quantity: input.quantity, expectedRevision: input.expectedRevision, reason: input.reason.trim() };
}

/** Daily sales inclusion boundary; this does not write or calculate live stock. */
export function shiitakeSaleAfterBaseline(saleDate: string, baseline: Pick<ShiitakeBaseline, 'baseline_date' | 'phase'>) {
  return baseline.phase === 'before_open' ? saleDate >= baseline.baseline_date : saleDate > baseline.baseline_date;
}
