import { createClient } from '@supabase/supabase-js';
import { validateShiitakeBaseline } from '@/lib/shiitakeBaseline';

export const dynamic = 'force-dynamic';
async function authorize(request: Request) {
  const token = request.headers.get('authorization');
  if (!token?.startsWith('Bearer ') || !token.slice(7).trim()) return { response: Response.json({ error: 'ログインしてください' }, { status: 401 }) };
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { response: Response.json({ error: '開始在庫の保存先が未設定です' }, { status: 503 }) };
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.auth.getUser(token.slice(7).trim());
  if (error || !data.user) return { response: Response.json({ error: 'ログインし直してください' }, { status: 401 }) };
  const profile = await db.from('profiles').select('is_admin').eq('id', data.user.id).maybeSingle();
  if (profile.error || !profile.data?.is_admin) return { response: Response.json({ error: '管理者権限が必要です' }, { status: 403 }) };
  return { db, userId: data.user.id };
}
export async function GET(request: Request) {
  try {
    const auth = await authorize(request);
    if (auth.response) return auth.response;
    const { db } = auth;
    const [current, history] = await Promise.all([
      db.from('shiitake_stock_baselines').select('baseline_date,phase,quantity,revision,reason,updated_at').eq('source', 'shiitake_yorankasha').maybeSingle(),
      db.from('shiitake_stock_baseline_history').select('baseline_date,phase,quantity,revision,reason,updated_at').eq('source', 'shiitake_yorankasha').order('revision', { ascending: false }).limit(10),
    ]);
    if (current.error || history.error) throw new Error('storage');
    return Response.json({ baseline: current.data, history: history.data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    console.error('[ShiitakeBaseline] read unavailable');
    return Response.json({ error: '開始在庫設定を読み込めません。接続と追加SQLの適用をご確認ください。' }, { status: 503 });
  }
}
export async function POST(request: Request) {
  try {
    const auth = await authorize(request);
    if (auth.response) return auth.response;
    // Small bounded JSON body; do not trust Content-Length.
    const reader = request.body?.getReader();
    let body = '';
    const decoder = new TextDecoder();
    let bytes = 0;
    if (!reader) return Response.json({ error: '入力がありません' }, { status: 400 });
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 4096) { await reader.cancel(); return Response.json({ error: '入力が長すぎます' }, { status: 400 }); }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    let input;
    try { input = validateShiitakeBaseline(JSON.parse(body)); }
    catch (error) { return Response.json({ error: error instanceof SyntaxError ? '入力内容を確認してください' : (error as Error).message }, { status: 400 }); }
    const { data, error } = await auth.db.rpc('save_shiitake_stock_baseline', {
      p_date: input.date, p_phase: input.phase, p_quantity: input.quantity, p_reason: input.reason,
      p_expected_revision: input.expectedRevision, p_actor: auth.userId,
    });
    if (error?.code === '40001') return Response.json({ error: '別の管理者が変更しました。再読み込みして内容を確認してください。' }, { status: 409 });
    if (error) throw new Error('storage');
    return Response.json({ baseline: data, inventoryChanged: false });
  } catch {
    console.error('[ShiitakeBaseline] save unavailable');
    return Response.json({ error: '保存できませんでした。接続と追加SQLの適用をご確認ください。' }, { status: 503 });
  }
}
