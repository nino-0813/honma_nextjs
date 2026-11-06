/** EC-003: column order from the revised 42-column Yamato template (2026-11-06). */
export const YAMATO_HEADERS = [
  'お客様管理番号', '送り状種類', 'クール区分', '伝票番号', '出荷予定日', 'お届け予定日',
  '配達時間帯', 'お届け先コード', 'お届け先電話番号', 'お届け先電話番号枝番',
  'お届け先郵便番号', 'お届け先住所', 'お届け先アパートマンション名', 'お届け先会社・部門１',
  'お届け先会社・部門２', 'お届け先名', 'お届け先名(ｶﾅ)', '敬称', 'ご依頼主コード',
  'ご依頼主電話番号', 'ご依頼主電話番号枝番', 'ご依頼主郵便番号', 'ご依頼主住所',
  'ご依頼主アパートマンション', 'ご依頼主名', 'ご依頼主名(ｶﾅ)', '品名コード１', '品名１',
  '品名コード２', '品名２', '荷扱い１', '荷扱い２', '記事', 'ｺﾚｸﾄ代金引換額（税込)',
  '内消費税額等', '止置き', '営業所コード', '発行枚数', '個数口表示フラグ',
  '請求先顧客コード', '請求先分類コード', '運賃管理番号',
] as const;

export interface YamatoOrderItem {
  product_id?: string | null;
  product_title: string;
  variant?: string | null;
  selected_options?: unknown;
  quantity: number;
  is_subscription?: boolean;
}

export interface YamatoOrder {
  id: string;
  order_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  billing_postal_code?: string | null;
  billing_prefecture?: string | null;
  billing_city?: string | null;
  billing_address?: string | null;
  billing_building?: string | null;
  shipping_first_name?: string | null;
  shipping_last_name?: string | null;
  shipping_phone?: string | null;
  shipping_postal_code?: string | null;
  // Orders store the full shipping address, including city and building.
  shipping_address?: string | null;
  delivery_time_slot?: string | null;
  stripe_subscription_id?: string | null;
  subscription_interval?: string | null;
  order_items?: YamatoOrderItem[] | null;
}

const text = (value: string | null | undefined) => (value || '').trim();
const comparable = (value: string) => value.normalize('NFKC').replace(/[\s\-‐‑–—−ー]/g, '');
const digits = (value: string) => value.normalize('NFKC').replace(/[^0-9]/g, '');
const fullName = (last?: string | null, first?: string | null) => [text(last), text(first)].filter(Boolean).join(' ');

export function yamatoTimeCode(value?: string | null): string {
  const input = text(value).normalize('NFKC').replace(/\s/g, '');
  if (!input || ['指定なし', '希望なし', 'なし'].includes(input)) return '';
  if (['0812', '1416', '1618', '1820', '1921'].includes(input)) return input;
  if (input === '午前中') return '0812';
  const normalized = input.replace(/[~〜～‐–—−ー-]/g, '-').replace(/時/g, '');
  const codes: Record<string, string> = { '8-12': '0812', '08-12': '0812', '14-16': '1416', '16-18': '1618', '18-20': '1820', '19-21': '1921' };
  if (codes[normalized]) return codes[normalized];
  throw new Error('配達時間帯がヤマトの対応時間帯と一致しません。注文の時間指定を確認してください。');
}

// selected_options is JSON; sort keys so equivalent variants group together.
function stableOptions(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return `[${value.map(stableOptions).join(',')}]`;
  if (typeof value === 'object') return JSON.stringify(Object.keys(value).sort().map(key => [key, stableOptions((value as Record<string, unknown>)[key])]));
  return JSON.stringify(value);
}

export function buildYamatoRows(orders: YamatoOrder[]): string[][] {
  if (!orders.length) throw new Error('出力する注文がありません。');
  const rows: string[][] = [];
  for (const order of orders) {
    const number = text(order.order_number) || order.id;
    const recipientName = order.shipping_last_name || order.shipping_first_name
      ? fullName(order.shipping_last_name, order.shipping_first_name)
      : fullName(order.last_name, order.first_name);
    const recipientPhone = text(order.shipping_phone) || text(order.phone);
    const recipientPostcode = text(order.shipping_postal_code);
    const recipientAddress = text(order.shipping_address);
    const buyerName = fullName(order.last_name, order.first_name);
    const buyerPhone = text(order.phone);
    const buyerPostcode = text(order.billing_postal_code);
    const buyerAddress = [text(order.billing_prefecture), text(order.billing_city), text(order.billing_address)].join('')
      + (text(order.billing_building) ? ` ${text(order.billing_building)}` : '');
    const required = { 注文番号: number, 発送先氏名: recipientName, 発送先電話番号: recipientPhone,
      発送先郵便番号: recipientPostcode, 発送先住所: recipientAddress, 注文者氏名: buyerName,
      注文者電話番号: buyerPhone, 注文者郵便番号: buyerPostcode, 注文者住所: buyerAddress };
    const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key);
    if (missing.length) throw new Error(`注文 ${number}：${missing.join('・')}が未登録です。注文情報を確認してください。`);
    const sameParty = comparable(recipientName) === comparable(buyerName)
      && digits(recipientPhone) === digits(buyerPhone)
      && digits(recipientPostcode) === digits(buyerPostcode)
      && comparable(recipientAddress) === comparable(buyerAddress);
    const timeCode = yamatoTimeCode(order.delivery_time_slot);
    if (!order.order_items?.length) throw new Error(`注文 ${number}：商品明細がありません。`);

    const groups = new Map<string, { item: YamatoOrderItem; quantity: number; subscription: boolean }>();
    for (const item of order.order_items) {
      if (!text(item.product_title) || !Number.isSafeInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
        throw new Error(`注文 ${number}：商品名または数量を確認してください。`);
      }
      const key = JSON.stringify([item.product_id || item.product_title, text(item.variant), stableOptions(item.selected_options)]);
      const group = groups.get(key);
      if (group) {
        group.quantity += Number(item.quantity);
        group.subscription ||= Boolean(item.is_subscription);
      } else groups.set(key, { item, quantity: Number(item.quantity), subscription: Boolean(item.is_subscription) });
    }
    for (const { item, quantity, subscription } of groups.values()) {
      const row = Array<string>(42).fill('');
      row[0] = number; // A
      row[1] = '0'; // B: prepaid
      // C (cool type) and E (shipping date) are deliberately left for manual entry.
      row[5] = '最短日'; // F
      row[6] = timeCode; // G
      row[8] = recipientPhone; // I
      row[10] = recipientPostcode; // K
      row[11] = recipientAddress; // L (already contains city/building)
      row[15] = recipientName; // P
      row[17] = '様'; // R
      row[19] = sameParty ? '05036345251' : buyerPhone; // T
      row[21] = sameParty ? '9520317' : buyerPostcode; // V
      row[22] = sameParty ? '新潟県佐渡市豊田560' : buyerAddress; // W
      row[24] = sameParty ? 'イケベジ' : buyerName; // Y
      row[27] = `${text(item.product_title)}${text(item.variant) ? ` / ${text(item.variant)}` : ''}${quantity > 1 ? `×${quantity}` : ''}`; // AB
      const isSubscription = subscription || Boolean(order.stripe_subscription_id || order.subscription_interval);
      row[32] = sameParty ? '' : `イケベジECサイトより発送${isSubscription ? ' 定期便' : ''}`; // AG
      row[39] = '05036345251'; // AN: specified billing customer code
      row[41] = '01'; // AP
      rows.push(row);
    }
  }
  return rows;
}
