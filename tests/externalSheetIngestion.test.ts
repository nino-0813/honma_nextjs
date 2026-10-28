// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { externalSheetSources } from '../lib/externalOrderSheets';
import { externalSyncAuthorized, prepareExternalSnapshot } from '../lib/externalSheetIngestion';
const mock = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ rpc: mock.rpc }) }));
import { POST } from '../app/api/external-sheet-sync/route';
const secret = 'fixture-only-token-not-real-123456789';
function body() {
  const source = externalSheetSources[0];
  return { source: source.id, spreadsheetId: source.spreadsheetId, sheetId: source.sheetId,
    capturedAt: new Date().toISOString(), headers: ['日時', '商品名', '個数', '年産', '種類', '重量', '注文状態', '明細ID'],
    rows: [['2026/10/28', 'にこまる', '2', '2026', '白米', '5kg', '有効', 'fixture-line']] };
}
function send(input: unknown = body(), token = secret, source = 'rice_tabechoku') {
  return POST(new Request('https://example.invalid/api/external-sheet-sync', { method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'x-sheet-source': source }, body: JSON.stringify(input) }));
}
beforeEach(() => {
  vi.stubEnv('EXTERNAL_SHEET_SYNC_ENABLED', 'true');
  vi.stubEnv('EXTERNAL_SHEET_TOKEN_RICE_TABECHOKU', secret);
  vi.stubEnv('SUPABASE_URL', 'https://db.example.invalid'); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fixture');
  mock.rpc.mockResolvedValue({ data: { revision: 1, duplicate: false }, error: null });
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it('rejects disabled integration, absent/short/wrong tokens and unregistered source', async () => {
  expect(externalSyncAuthorized(null, secret)).toBe(false);
  expect(externalSyncAuthorized('Bearer tiny', 'tiny')).toBe(false);
  expect((await send(body(), 'wrong')).status).toBe(401);
  expect((await send(body(), secret, 'unknown')).status).toBe(401);
  vi.stubEnv('EXTERNAL_SHEET_SYNC_ENABLED', 'false');
  expect((await send()).status).toBe(503); expect(mock.rpc).not.toHaveBeenCalled();
});
it('defaults to dry-run with aggregate response only and no writes', async () => {
  const result = await (await send()).json();
  expect(result).toMatchObject({ dryRun: true, saved: false, ready: 1, review: 0, inventoryChanged: false });
  expect(JSON.stringify(result)).not.toContain('fixture-line'); expect(mock.rpc).not.toHaveBeenCalled();
});
it('saves a full snapshot through one RPC, never an orders/stock write', async () => {
  const result = await (await send({ ...body(), dryRun: false })).json();
  expect(result.saved).toBe(true); expect(result.inventoryChanged).toBe(false);
  expect(mock.rpc).toHaveBeenCalledTimes(1);
  expect(mock.rpc.mock.calls[0][0]).toBe('ingest_external_sheet_snapshot');
});
it('counts unconfirmed/duplicate rows as review, retaining them without inventing stock or active state', () => {
  const input = body(); input.rows[0][6] = ''; input.rows.push([...input.rows[0]]);
  const result = prepareExternalSnapshot(input);
  expect(result.payload.readyCount).toBe(0); expect(result.payload.reviewCount).toBe(2);
  expect(result.payload.lines[0].status).toBe('unconfirmed');
});
it('keeps content hash stable across repeated reads and changes it on cancellation', () => {
  const input = body(); const first = prepareExternalSnapshot(input);
  expect(prepareExternalSnapshot({ ...input, capturedAt: new Date(Date.now() + 100).toISOString() }).hash).toBe(first.hash);
  input.rows[0][6] = 'キャンセル'; expect(prepareExternalSnapshot(input).hash).not.toBe(first.hash);
});
it('rejects mismatched spreadsheet/tab, malformed cells, extra PII columns and stale snapshots', async () => {
  for (const input of [{ ...body(), spreadsheetId: 'wrong' }, { ...body(), sheetId: 999 },
    { ...body(), headers: [...body().headers, '注文者住所'] }, { ...body(), rows: [[{ name: 'private' }]] },
    { ...body(), capturedAt: new Date(Date.now() - 1_000_000).toISOString() }, { ...body(), dryRun: 'false' }]) {
    expect((await send(input)).status).toBe(400);
  }
  expect(mock.rpc).not.toHaveBeenCalled();
});
it('does not accept a valid token for a different source', async () => {
  const second = externalSheetSources[1];
  expect((await send({ ...body(), source: second.id, sheetId: second.sheetId })).status).toBe(400);
});
it('rejects oversized raw request bodies before parsing', async () => {
  expect((await send({ ...body(), padding: 'x'.repeat(2_000_000) })).status).toBe(400);
  expect(mock.rpc).not.toHaveBeenCalled();
});
it('returns retryable DB failure and a conflict for stale snapshots, without DB details', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  mock.rpc.mockResolvedValue({ data: null, error: { code: '22023', message: 'private' } });
  const response = await send({ ...body(), dryRun: false });
  expect(response.status).toBe(409); expect(JSON.stringify(await response.json())).not.toContain('private');
  mock.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
  expect((await send({ ...body(), dryRun: false })).status).toBe(503); spy.mockRestore();
});
