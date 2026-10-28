// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ admin: true, user: true, storageError: false, rpc: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  auth: { getUser: async () => ({ data: { user: mock.user ? { id: 'fixture-admin' } : null }, error: null }) },
  rpc: mock.rpc,
  from: (table: string) => ({ select: () => ({ eq: () => ({
    maybeSingle: async () => ({ data: table === 'profiles' ? { is_admin: mock.admin } : null, error: table !== 'profiles' && mock.storageError ? { code: '42P01' } : null }),
    order: () => ({ limit: async () => ({ data: [], error: null }) }),
  }) }) }),
}) }));
import { GET, POST } from '../app/api/admin/shiitake-baseline/route';
const input = { date: '2026-10-20', phase: 'before_open', quantity: 18, expectedRevision: 0, reason: '初回登録', actor: 'attacker' };
const request = (method = 'GET', body: unknown = input) => new Request('https://fixture.invalid/api/admin/shiitake-baseline', {
  method, headers: { authorization: 'Bearer fixture' }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
});
beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://fixture.invalid'); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fixture');
  mock.admin = true; mock.user = true; mock.storageError = false; mock.rpc.mockResolvedValue({ data: { revision: 1 }, error: null });
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it('requires authenticated administrator for reads and writes', async () => {
  expect((await GET(new Request('https://fixture.invalid'))).status).toBe(401);
  mock.user = false; expect((await POST(request('POST'))).status).toBe(401);
  mock.user = true; mock.admin = false; expect((await GET(request())).status).toBe(403);
  expect((await POST(request('POST'))).status).toBe(403); expect(mock.rpc).not.toHaveBeenCalled();
});
it('loads empty baseline without seeding and attributes writes to verified administrator only', async () => {
  expect((await (await GET(request())).json()).baseline).toBeNull(); expect(mock.rpc).not.toHaveBeenCalled();
  expect((await POST(request('POST'))).status).toBe(200);
  expect(mock.rpc.mock.calls[0][1]).toMatchObject({ p_actor: 'fixture-admin', p_expected_revision: 0, p_quantity: 18 });
});
it('rejects invalid input and returns conflicts without overwriting', async () => {
  expect((await POST(request('POST', { ...input, reason: '' }))).status).toBe(400);
  expect(mock.rpc).not.toHaveBeenCalled(); mock.rpc.mockResolvedValue({ error: { code: '40001' } });
  expect((await POST(request('POST'))).status).toBe(409);
});
it('reports missing SQL as an error, never as a saved default', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  mock.storageError = true; expect((await GET(request())).status).toBe(503); spy.mockRestore();
});
