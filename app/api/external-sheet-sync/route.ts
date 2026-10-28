import { createClient } from '@supabase/supabase-js';
import { externalSheetSources } from '@/lib/externalOrderSheets';
import { externalSyncAuthorized, externalSyncMaxBytes, prepareExternalSnapshot } from '@/lib/externalSheetIngestion';

export const dynamic = 'force-dynamic';

// Limited stream read: Content-Length is not trusted as a body-size guard.
async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const parts: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > externalSyncMaxBytes) { await reader.cancel(); throw new Error('Body too large'); }
    parts.push(value);
  }
  return JSON.parse(Buffer.concat(parts).toString('utf8')) as unknown;
}

export async function POST(request: Request) {
  if (process.env.EXTERNAL_SHEET_SYNC_ENABLED !== 'true') return Response.json({ error: 'sync_disabled' }, { status: 503 });
  const sourceId = request.headers.get('x-sheet-source');
  const source = externalSheetSources.find(s => s.id === sourceId);
  const secret = source && process.env[`EXTERNAL_SHEET_TOKEN_${source.id.toUpperCase()}`];
  if (!source || !externalSyncAuthorized(request.headers.get('authorization'), secret)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  let snapshot: ReturnType<typeof prepareExternalSnapshot>;
  try {
    snapshot = prepareExternalSnapshot(await readBody(request));
    if (snapshot.source !== source.id) throw new Error('Token source mismatch');
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'invalid_request' }, { status: 400 });
  }
  const summary = { source: snapshot.source, lines: snapshot.payload.lines.length,
    ready: snapshot.payload.readyCount, review: snapshot.payload.reviewCount, inventoryChanged: false };
  if (snapshot.dryRun) return Response.json({ ...summary, dryRun: true, saved: false });
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({ error: 'storage_not_configured' }, { status: 503 });
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.rpc('ingest_external_sheet_snapshot', {
      p_source: snapshot.source, p_captured_at: snapshot.capturedAt, p_hash: snapshot.hash, p_payload: snapshot.payload,
    });
    if (error) {
      console.error('[ExternalSheetSync] storage rejected', { source: snapshot.source, code: error.code });
      return Response.json({ error: error.code === '22023' ? 'stale_or_invalid_snapshot' : 'storage_failed' },
        { status: error.code === '22023' ? 409 : 503 });
    }
    return Response.json({ ...summary, dryRun: false, saved: true, receipt: data });
  } catch {
    console.error('[ExternalSheetSync] storage unavailable', { source: snapshot.source });
    return Response.json({ error: 'storage_failed' }, { status: 503 });
  }
}
