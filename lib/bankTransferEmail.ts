import type Stripe from 'stripe';
import { sendBrevoEmail } from './brevo';

type Instructions = Stripe.PaymentIntent.NextAction.DisplayBankTransferInstructions;
const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function bankTransferDetails(value: Instructions | null | undefined) {
  const bank = value?.financial_addresses?.find(a => a.type === 'zengin')?.zengin;
  const complete = bank && [bank.account_holder_name, bank.account_number, bank.bank_name, bank.branch_name, bank.account_type].every(v => typeof v === 'string' && v.trim());
  let url: string | null = null;
  try {
    const parsed = new URL(value?.hosted_instructions_url || '');
    if (parsed.protocol === 'https:' && (parsed.hostname === 'stripe.com' || parsed.hostname.endsWith('.stripe.com'))) url = parsed.href;
  } catch { /* Missing instructions must not become an empty email link. */ }
  return { bank: complete ? bank : null, url, reference: value?.reference || null };
}

export function renderBankTransferEmail(input: {
  name: string; orderNumber: string; total: string; due: string;
  instructions: Instructions;
  items: { product_name: string; quantity: number }[];
}) {
  const { bank, url, reference } = bankTransferDetails(input.instructions);
  if (!bank && !url) throw new Error('Bank transfer instructions unavailable');
  const rows = bank ? [
    ['振込先口座名義人', bank.account_holder_name],
    ['口座番号', bank.account_number],
    ['銀行名', bank.bank_name],
    ['支店名', bank.branch_name],
    ['口座種別', bank.account_type === 'futsu' ? '普通' : bank.account_type === 'toza' ? '当座' : bank.account_type],
  ] : [];
  const lines = [
    `${input.name} 様`, 'ご注文ありがとうございます。銀行振込のお手続きをお願いします。',
    `注文番号：${input.orderNumber}`,
    ...input.items.map(item => `${item.product_name} × ${item.quantity}`),
    `お振込金額：${input.total}円`, `お支払期限：${input.due}`,
    ...rows.map(([label, value]) => `${label}：${value}`),
    ...(!bank ? ['振込先口座は下記のStripeのページでご確認ください。'] : []),
    ...(reference ? [`振込時の参照番号：${reference}`] : []),
    ...(url ? [`振込先を確認する：${url}`] : []),
    '振込先はStripeがお客様ごとに発行する専用口座です。',
    '振込手数料はお客様のご負担となります。入金確認後に発送準備を進めます。',
  ];
  return {
    subject: '【イケベジ】銀行振込のお手続き・振込先のご案内',
    textContent: lines.join('\n\n'),
    htmlContent: `<div style="font-family:sans-serif;line-height:1.8;max-width:640px;margin:auto;padding:24px"><h1 style="font-size:22px">銀行振込のご案内</h1>${lines.map(line => `<p>${escapeHtml(line)}</p>`).join('')}${url ? `<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#c8652d;color:#fff;padding:12px 24px;border-radius:8px">振込先を確認する</a></p>` : ''}</div>`,
  };
}

// Reuse the existing verified template sender if direct-send env vars are absent.
// No change to the remote template and no customer data is sent by this GET.
async function bankTransferSender(templateId: number) {
  if (process.env.BREVO_FROM_EMAIL) return { email: process.env.BREVO_FROM_EMAIL, name: process.env.BREVO_FROM_NAME || 'イケベジ' };
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY is not configured');
  const response = await fetch(`https://api.brevo.com/v3/smtp/templates/${templateId}`, {
    headers: { 'api-key': key }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Bank mail sender lookup failed (${response.status})`);
  const template = await response.json();
  if (!template.sender?.email) throw new Error('Bank mail template sender unavailable');
  return { email: String(template.sender.email), name: String(template.sender.name || 'イケベジ') };
}

export async function sendBankTransferEmail(input: Parameters<typeof renderBankTransferEmail>[0] & { email: string; templateId: number }) {
  const content = renderBankTransferEmail(input);
  const sender = await bankTransferSender(input.templateId);
  return sendBrevoEmail({ to: [{ email: input.email, name: input.name }], sender, ...content });
}
