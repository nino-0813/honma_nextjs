// @vitest-environment node
import { expect, it } from 'vitest';
import { shiitakeSaleAfterBaseline, suggestedShiitakeBaseline, validateShiitakeBaseline } from '../lib/shiitakeBaseline';
const input = { ...suggestedShiitakeBaseline, expectedRevision: 0, reason: '初回登録' };
it('remembers the confirmed opening baseline separately from the target and includes same-day sales', () => {
  expect(validateShiitakeBaseline(input)).toEqual(input);
  const baseline = { baseline_date: input.date, phase: input.phase };
  expect(shiitakeSaleAfterBaseline('2026-10-19', baseline)).toBe(false);
  expect(shiitakeSaleAfterBaseline('2026-10-20', baseline)).toBe(true);
  expect(shiitakeSaleAfterBaseline('2026-10-20', { ...baseline, phase: 'after_close' })).toBe(false);
  expect(shiitakeSaleAfterBaseline('2026-10-21', { ...baseline, phase: 'after_close' })).toBe(true);
});
it('requires a reason, real date, integer quantity and known revision, and allows zero', () => {
  expect(validateShiitakeBaseline({ ...input, quantity: 0 }).quantity).toBe(0);
  for (const patch of [{ quantity: -1 }, { quantity: 1.5 }, { quantity: '18' }, { quantity: 10000 },
    { date: '2026-02-30' }, { phase: 'noon' }, { reason: '' }, { expectedRevision: -1 }]) {
    expect(() => validateShiitakeBaseline({ ...input, ...patch })).toThrow();
  }
});
