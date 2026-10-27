// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { bankTransferDetails, renderBankTransferEmail, sendBankTransferEmail } from '../lib/bankTransferEmail';

const input = (instructions: any) => ({ name: '<script>test</script>', orderNumber: 'ORD-test', total: '2,340', due: '2026年11月3日', items: [{ product_name: '商品<&>', quantity: 1 }], instructions });
const bank = { account_holder_name: 'テスト', account_number: '0012345', bank_name: '銀行', branch_name: '支店', account_type: 'toza' };
const details = () => ({ hosted_instructions_url: 'https://payments.stripe.com/test', financial_addresses: [{ type: 'zengin', zengin: bank }] });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it('renders all five fields, preserved leading zeros, Japanese account type, amount and due date', () => {
  const result = renderBankTransferEmail(input(details()));
  for (const text of ['テスト', '0012345', '銀行', '支店', '当座', '2,340', '2026年11月3日']) expect(result.textContent).toContain(text);
  expect(result.htmlContent).not.toContain('<script>');
  expect(result.htmlContent).toContain('&lt;script&gt;');
  expect(result.htmlContent).toContain('商品&lt;&amp;&gt;');
});
it('shows only a working link, not empty bank fields, when Stripe provides link-only instructions', () => {
  const result = renderBankTransferEmail(input({ hosted_instructions_url: 'https://payments.stripe.com/test' }));
  expect(result.textContent).toContain('振込先口座は下記');
  expect(result.textContent).not.toContain('口座番号：');
  expect(result.htmlContent).toContain('href="https://payments.stripe.com/test"');
});
it('rejects missing instructions and unsafe URLs', () => {
  for (const url of ['', 'javascript:alert(1)', 'https://stripe.com.evil.invalid/test', 'http://payments.stripe.com/test']) {
    expect(bankTransferDetails({ hosted_instructions_url: url } as any).url).toBeNull();
    expect(() => renderBankTransferEmail(input({ hosted_instructions_url: url }))).toThrow();
  }
});
it('does not display partial bank details', () => {
  const instructions = details(); instructions.financial_addresses[0].zengin = { ...bank, account_number: '' };
  expect(renderBankTransferEmail(input(instructions)).textContent).not.toContain('口座番号：');
});
it('reuses template sender when direct-send configuration is absent, without modifying template', async () => {
  vi.stubEnv('BREVO_FROM_EMAIL', ''); vi.stubEnv('BREVO_API_KEY', 'fixture');
  const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ sender: { email: 'sender@example.invalid', name: 'イケベジ' } })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ messageId: 'fixture' })));
  vi.stubGlobal('fetch', fetchMock);
  await sendBankTransferEmail({ ...input(details()), email: 'customer@example.invalid', templateId: 8 });
  expect(fetchMock.mock.calls[0][0]).toBe('https://api.brevo.com/v3/smtp/templates/8');
  const sent = JSON.parse(fetchMock.mock.calls[1][1].body);
  expect(sent.sender.email).toBe('sender@example.invalid');
  expect(sent.templateId).toBeUndefined();
  expect(sent.htmlContent).toContain('0012345');
});
it('does not send if the verified sender cannot be obtained', async () => {
  vi.stubEnv('BREVO_FROM_EMAIL', ''); vi.stubEnv('BREVO_API_KEY', 'fixture');
  const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 503 }));
  vi.stubGlobal('fetch', fetchMock);
  await expect(sendBankTransferEmail({ ...input(details()), email: 'customer@example.invalid', templateId: 8 })).rejects.toThrow('sender lookup failed');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
