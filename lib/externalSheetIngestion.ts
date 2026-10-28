import { createHash, timingSafeEqual } from 'node:crypto';
import { externalSheetSources, parseExternalSheet } from './externalOrderSheets';

// Customer names, addresses, phone numbers and free-form notes are deliberately excluded.
export const externalSyncColumns = ['注文番号', '日時', '商品名', '種類', '重量', '個数', '数量',
  '売上', '取込メールID（管理用）', '年産', '注文状態', '明細ID', '販売チャネル',
  '商品売上', '送料', '商品値引き', '紹介者ID'] as const;
export const externalSyncMaxBytes = 2_000_000;
export const externalSyncMaxRows = 5000;
const normalize = (value: string) => value.normalize('NFKC').replace(/\s/g, '');

export function externalSyncAuthorized(provided: string | null, secret: string | undefined) {
  if (!secret || secret.length < 32 || !provided) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(provided);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function prepareExternalSnapshot(body: unknown, now = Date.now()) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
  const input = body as Record<string, unknown>;
  const source = externalSheetSources.find(s => s.id === input.source);
  if (!source || input.spreadsheetId !== source.spreadsheetId || input.sheetId !== source.sheetId) {
    throw new Error('Source does not match the registered spreadsheet/tab');
  }
  if (typeof input.capturedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(input.capturedAt)) throw new Error('Invalid capturedAt');
  const capturedTime = Date.parse(input.capturedAt);
  if (!Number.isFinite(capturedTime) || capturedTime > now + 300_000 || capturedTime < now - 900_000) {
    throw new Error('Snapshot is too old or in the future; read the sheet again');
  }
  if (input.dryRun !== undefined && typeof input.dryRun !== 'boolean') throw new Error('Invalid dryRun');
  if (!Array.isArray(input.headers) || !input.headers.length || input.headers.length > 40 ||
    !input.headers.every(h => typeof h === 'string' && h.length <= 100)) throw new Error('Invalid headers');
  const headers = (input.headers as string[]).map(normalize);
  if (headers.some(h => !externalSyncColumns.some(c => normalize(c) === h))) throw new Error('Unexpected column; do not send personal information');
  if (!headers.includes('注文状態') || !headers.includes('明細ID')) throw new Error('Sync columns are missing');
  if (!Array.isArray(input.rows) || input.rows.length > externalSyncMaxRows) throw new Error('Too many rows');
  const rows = input.rows as unknown[][];
  if (!rows.every(row => Array.isArray(row) && row.length <= headers.length && row.every(cell =>
    typeof cell === 'string' && cell.length <= 2000))) throw new Error('Invalid cells');
  // A whole tab is parsed together: duplicate identities cannot hide at page boundaries.
  const parsed = parseExternalSheet(source.id, headers, rows);
  const payload = { schemaVersion: 1, ...parsed };
  const serialized = JSON.stringify(payload);
  if (Buffer.byteLength(serialized) > externalSyncMaxBytes) throw new Error('Parsed snapshot is too large');
  return { source: source.id, capturedAt: new Date(capturedTime).toISOString(), dryRun: input.dryRun !== false,
    payload, hash: createHash('sha256').update(serialized).digest('hex') };
}
