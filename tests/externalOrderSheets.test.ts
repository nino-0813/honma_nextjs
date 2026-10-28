// @vitest-environment node
import { expect, it } from 'vitest';
import { externalSheetSources, parseExternalSheet } from '../lib/externalOrderSheets';
const headers = ['注文番号', '日時', '商品名', '種類', '重量', '個数', '売上', '取込メールID（管理用）', '年産', '注文状態', '明細ID'];
const row = ['ORD-fixture', '2026/10/28', 'にこまる', '白米', '5kg', '1', '6,625', 'mail-fixture', '2026', '有効', ''];
it('uses only the five verified source tabs and source IDs', () => {
  expect(externalSheetSources.map(s => s.tab)).toEqual(['食べチョク', 'さとふる', 'ふるさとdo', 'よらんか舎', 'シート1']);
});
it('parses controlled rice inputs without taking actions or treating reported sales as referral revenue', () => {
  const result = parseExternalSheet('rice_tabechoku', headers, [row]);
  expect(result.readyCount).toBe(1);
  expect(result.lines[0]).toMatchObject({ date: '2026-10-28', unitKg: 5, quantity: 1, reportedSales: 6625, variety: 'nikomaru', milling: 'white', productSales: null });
  expect(result.referralFinancialBasisConfirmed).toBe(false);
});
it('does not guess rice harvest year from order date or assume missing state means active', () => {
  const input = [...row]; input[8] = ''; input[9] = '';
  const result = parseExternalSheet('rice_tabechoku', headers, [input]);
  expect(result.lines[0].harvestYear).toBeNull(); expect(result.reviewCount).toBe(1); expect(result.readyCount).toBe(0);
});
it('does not assume a quantity of one for portal sheets without a quantity column', () => {
  const result = parseExternalSheet('rice_satofuru', ['注文番号', '日時', '商品名', '種類', '重量', '売上'], [['ORDER', '2026/10/28', '亀の尾', '玄米', '10kg', '10000']]);
  expect(result.lines[0].quantity).toBeNull(); expect(result.readyCount).toBe(0);
});
it('keeps source identity stable when quantity, state, year and revenue are edited', () => {
  const a = parseExternalSheet('rice_tabechoku', headers, [row]).lines[0];
  const input = [...row]; input[5] = '3'; input[6] = '19000'; input[8] = '2025'; input[9] = 'キャンセル';
  const b = parseExternalSheet('rice_tabechoku', headers, [input]).lines[0];
  expect(a.sourceKey).toBe(b.sourceKey); expect(b.status).toBe('cancelled');
});
it('does not merge distinct products in the same order', () => {
  const second = [...row]; second[2] = '亀の尾';
  const result = parseExternalSheet('rice_tabechoku', headers, [row, second]);
  expect(result.readyCount).toBe(2); expect(result.lines[0].sourceKey).not.toBe(result.lines[1].sourceKey);
});
it('requires confirmation for repeated identical lines rather than doubling quantities', () => {
  const result = parseExternalSheet('rice_tabechoku', headers, [row, row]);
  expect(result.readyCount).toBe(0); expect(result.reviewCount).toBe(2);
});
it('explicit immutable line IDs distinguish genuinely separate identical items', () => {
  const a = [...row]; a[10] = 'line-a'; const b = [...row]; b[10] = 'line-b';
  expect(parseExternalSheet('rice_tabechoku', headers, [a, b]).readyCount).toBe(2);
});
it('parses the shop daily sales using mail identity and keeps target 18 out of actual stock', () => {
  const result = parseExternalSheet('shiitake_yorankasha', ['日時', '商品名', '個数', '売上', '取込メールID（管理用）'], [['2026/08/16', '乾椎茸（原木）', '3', '4,440', 'mail-1']]);
  expect(result.lines[0]).toMatchObject({ quantity: 3, reportedSales: 4440, harvestYear: null, status: 'unconfirmed' });
  expect(result.lines[0].sourceKeyBasis).toBe('mail_product'); expect(result.readyCount).toBe(0);
});
it('rejects invalid calendar dates and fractional quantities', () => {
  const input = [...row]; input[1] = '2026/02/30'; input[5] = '1.5';
  const parsed = parseExternalSheet('rice_tabechoku', headers, [input]).lines[0];
  expect(parsed.date).toBeNull(); expect(parsed.quantity).toBeNull(); expect(parsed.inventoryReady).toBe(false);
});
it('ignores empty rows, rejects ambiguous duplicate headers, and never uses row number as identity', () => {
  expect(parseExternalSheet('rice_tabechoku', headers, [[]]).lines).toEqual([]);
  expect(() => parseExternalSheet('rice_tabechoku', ['日時', '商品名', '商品名'], [])).toThrow('重複');
  const a = parseExternalSheet('rice_tabechoku', headers, [row]).lines[0];
  const b = parseExternalSheet('rice_tabechoku', headers, [[], row]).lines[0];
  expect(a.sourceKey).toBe(b.sourceKey); expect(a.sourceRow).not.toBe(b.sourceRow);
});
