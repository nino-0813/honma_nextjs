import { describe, expect, it } from 'vitest';
import { autoMappingError, autoMappingTotals, decodeAutoBatch } from '../lib/inventoryAutoMapping';
const id = '30000000-0000-0000-0000-000000000001';
const candidate = {
 item_id: id, order_number: 'fixture', title: '3品種お試しセット 令和8年産',
 status: 'ready', reason: 'fixture', fingerprint: 'a'.repeat(32), quantity: 2,
 harvest_year: 2026, excluded: false,
 components: ['koshihikari','nikomaru','kamenoo'].map(variety_key => ({
  season_id: '40000000-0000-0000-0000-000000000001', variety_key, unit_kg: 0.3, milling: 'white',
 })),
};
const batch = () => ({ id, harvest_year: 2026, processed: 0, candidates: [structuredClone(candidate)] });
describe('auto mapping review data', () => {
 it('shows separate variety totals using quantity and white rice factor', () => {
  const decoded = decodeAutoBatch(batch());
  expect(autoMappingTotals(decoded).map(x => x.kg)).toEqual([0.66,0.66,0.66]);
 });
 it('never merges years or counts non-rice exclusions', () => {
  const value: any = batch();
  value.candidates.push({ ...structuredClone(candidate), item_id:'30000000-0000-0000-0000-000000000002', harvest_year:2025 });
  value.candidates.push({ ...candidate, item_id:'30000000-0000-0000-0000-000000000003', status:'exclude',excluded:true,harvest_year:null,components:[] });
  expect(autoMappingTotals(decodeAutoBatch(value))).toHaveLength(6);
 });
 it('retains an item without an order number for ID-based review', () => {
  const value: any = batch(); value.candidates[0].order_number=null;
  expect(decodeAutoBatch(value).candidates[0].order_number).toBeNull();
 });
 it.each([
  (b: any) => { b.processed=2; },
  (b: any) => { b.candidates.push(b.candidates[0]); },
  (b: any) => { b.candidates[0].components[0].milling=null; },
  (b: any) => { b.candidates[0].quantity=0; },
  (b: any) => { b.candidates[0].harvest_year=null; },
  (b: any) => { b.candidates[0].fingerprint=''; },
 ])('rejects incomplete or contradictory reviews', mutate => {
  const value = batch(); mutate(value); expect(() => decodeAutoBatch(value)).toThrow();
 });
 it('explains missing migrations and stale source data', () => {
  expect(autoMappingError({code:'PGRST202'})).toContain('SQL');
  expect(autoMappingError({code:'40001'})).toContain('変更');
 });
});
