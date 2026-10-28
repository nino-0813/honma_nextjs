// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';
import { externalSyncColumns, prepareExternalSnapshot } from '../lib/externalSheetIngestion';
const code = readFileSync(new URL('../scripts/gas/external-sheet-sync.gs', import.meta.url), 'utf8');
function fixture(status = 200, mode?: string) {
  const fetch = vi.fn((_url: string, options: { payload: string }) => {
    const input = JSON.parse(options.payload);
    return { getResponseCode: () => status, getContentText: () => JSON.stringify({
      source: input.source, saved: !input.dryRun, stockTablesChanged: false, lines: 1, review: 1,
    }) };
  });
  const release = vi.fn();
  const range = { getValues: () => [
    ['日時', '商品名', '個数', '注文状態', '明細ID', '注文者住所', '備考'],
    ['2026/10/28', '乾椎茸（原木）', '2', '', 'fixture-line', 'private-address', 'private-note'],
  ] };
  const tab = { getSheetId: () => 1999545666, getLastRow: () => 2, getLastColumn: () => 7, getRange: () => range };
  const properties: Record<string, string | undefined> = { IKEVEGE_SYNC_ORIGIN: 'https://example.invalid',
    IKEVEGE_SYNC_MODE: mode, IKEVEGE_SYNC_TOKEN_SHIITAKE_YORANKASHA: 'fixture-only-token-not-real-123456789' };
  const context = { PropertiesService: { getScriptProperties: () => ({ getProperty: (key: string) => properties[key] }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: release }) },
    SpreadsheetApp: { openById: () => ({ getSheets: () => [tab] }) },
    Utilities: { newBlob: (s: string) => ({ getBytes: () => Buffer.from(s) }) },
    UrlFetchApp: { fetch }, console: { log: vi.fn() }, syncIkevegeExternalSheets: () => {}, IKEVEGE_SYNC_COLUMNS: [] };
  runInNewContext(code, context);
  return { context, fetch, release, tab, properties };
}
it('GAS projects only allowed columns, defaults to dry-run and supplies correct source credentials', () => {
  const f = fixture(); f.context.syncIkevegeExternalSheets();
  expect(f.context.IKEVEGE_SYNC_COLUMNS).toEqual([...externalSyncColumns]);
  expect(f.fetch).toHaveBeenCalledTimes(1);
  const [url, options] = f.fetch.mock.calls[0];
  expect(url).toBe('https://example.invalid/api/external-sheet-sync');
  expect(options.payload).not.toMatch(/private-address|private-note|注文者住所|備考/);
  const parsed = prepareExternalSnapshot(JSON.parse(options.payload));
  expect(parsed.dryRun).toBe(true); expect(parsed.payload.reviewCount).toBe(1);
  expect(f.release).toHaveBeenCalledTimes(1);
});
it('GAS explicit save is sent, while a failed send can be rerun and always releases lock', () => {
  const f = fixture(503, 'save');
  expect(() => f.context.syncIkevegeExternalSheets()).toThrow('同期失敗');
  expect(JSON.parse(f.fetch.mock.calls[0][1].payload).dryRun).toBe(false);
  expect(f.release).toHaveBeenCalledTimes(1);
});
it('GAS never splits a full source, to avoid hiding duplicate identities', () => {
  const f = fixture(); f.tab.getLastRow = () => 5002;
  expect(() => f.context.syncIkevegeExternalSheets()).toThrow('同期失敗');
  expect(f.fetch).not.toHaveBeenCalled(); expect(f.release).toHaveBeenCalled();
});
it('GAS refuses redirects and a non-HTTPS destination', () => {
  const f = fixture(302); expect(() => f.context.syncIkevegeExternalSheets()).toThrow('同期失敗');
  const g = fixture(); g.properties.IKEVEGE_SYNC_ORIGIN = 'http://example.invalid';
  expect(() => g.context.syncIkevegeExternalSheets()).toThrow('HTTPS'); expect(g.fetch).not.toHaveBeenCalled();
});
