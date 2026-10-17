import type { CartItem } from '@/types';

export const RICE_KEEP_HANDLE = 'ricekeep';

export const RICE_KEEP_ONE_BAG_PRODUCT_IDS = new Set([
  '0172778d-95b3-4c54-9cca-bee0e5c9acd1',
  '0f0277f0-9672-4b1e-963f-cbbb03706ba6',
  '70bc4f05-dd74-4e08-af2e-21f33c4ad5cf',
  '95687191-5591-4484-a743-a989c20257ff',
]);

export const RICE_KEEP_TWO_BAG_PRODUCT_IDS = new Set([
  '2fed8c16-144c-4980-957a-d3eeeccc1117',
  '1fa3031a-8edb-49d8-bcf5-5e74cdf70ecc',
  '30fdab5e-79e4-4dbc-9457-44e7496a7520',
  '732fdade-8531-4ce1-9334-b491c8c10fc9',
  '62f1e4ab-034e-48c5-a1c1-b56b528bf793',
  'e88e29f3-81e6-4236-951f-c70bdd7fde8f',
]);

export type RiceKeepKind = 'one' | 'two';

export function getRiceKeepKind(label?: string | null): RiceKeepKind | null {
  if (!label) return null;
  if (label.includes('1枚入り')) return 'one';
  if (label.includes('2枚入り')) return 'two';
  return null;
}

export function getRiceKeepPurchaseState(items: Pick<CartItem, 'product' | 'quantity' | 'variant'>[]) {
  let oneLimit = 0;
  let twoLimit = 0;
  let oneInCart = 0;
  let twoInCart = 0;
  let unknownVariant = false;

  for (const item of items) {
    const quantity = Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 0;
    if (RICE_KEEP_ONE_BAG_PRODUCT_IDS.has(item.product.id)) oneLimit += quantity;
    if (RICE_KEEP_TWO_BAG_PRODUCT_IDS.has(item.product.id)) twoLimit += quantity;
    if (item.product.handle !== RICE_KEEP_HANDLE) continue;
    const kind = getRiceKeepKind(item.variant);
    if (kind === 'one') oneInCart += quantity;
    else if (kind === 'two') twoInCart += quantity;
    else unknownVariant = true;
  }

  const hasRiceKeep = oneInCart > 0 || twoInCart > 0 || unknownVariant;
  let issue: string | null = null;
  if (unknownVariant) issue = 'Ricekeepの枚数を選び直してください。';
  else if (oneInCart > oneLimit) issue = `Ricekeep「1枚入り」は対象商品数まで購入できます（現在の上限：${oneLimit}個）。`;
  else if (twoInCart > twoLimit) issue = `Ricekeep「2枚入り」は対象商品数まで購入できます（現在の上限：${twoLimit}個）。`;
  else if (hasRiceKeep && oneLimit + twoLimit === 0) issue = 'Ricekeepは対象商品と一緒に購入してください。';

  return {
    oneLimit,
    twoLimit,
    oneInCart,
    twoInCart,
    oneRemaining: Math.max(0, oneLimit - oneInCart),
    twoRemaining: Math.max(0, twoLimit - twoInCart),
    issue,
  };
}
