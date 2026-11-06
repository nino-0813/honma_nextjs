// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildYamatoRows, yamatoTimeCode, YAMATO_HEADERS, type YamatoOrder } from '../lib/yamatoExport';
import { createYamatoWorkbook } from '../lib/yamatoWorkbook';
import template from '../lib/yamatoTemplate.json';

// Synthetic fixtures only, not customer records.
export const sampleOrder: YamatoOrder = {
  id: 'order-fixture', order_number: '00001234',
  last_name: '試験', first_name: '購入者', phone: '010-0000-0001',
  billing_postal_code: '0123456', billing_prefecture: '試験県', billing_city: '試験市',
  billing_address: '試験町1-2-3', billing_building: 'テスト棟101',
  shipping_address: '試験県試験市試験町1-2-3 テスト棟101', shipping_postal_code: '012-3456',
  delivery_time_slot: '8~12時',
  order_items: [{ product_id: 'rice', product_title: '試験米5kg', variant: '玄米', quantity: 1 }],
};

const column = (row: string[], letter: string) => row[[...letter].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1];

describe('revised Yamato 42-column mapping', () => {
  it('maps sender substitution, fixed codes and all deliberately blank columns without instruction text', () => {
    const [row] = buildYamatoRows([sampleOrder]);
    expect(YAMATO_HEADERS).toHaveLength(42);
    expect(row).toHaveLength(42);
    const populated: Record<string, string> = {
      A: '00001234', B: '0', F: '最短日', G: '0812', I: '010-0000-0001', K: '012-3456',
      L: '試験県試験市試験町1-2-3 テスト棟101', P: '試験 購入者', R: '様',
      T: '05036345251', V: '9520317', W: '新潟県佐渡市豊田560', Y: 'イケベジ',
      AB: '試験米5kg / 玄米', AN: '05036345251', AP: '01',
    };
    for (const [letter, expected] of Object.entries(populated)) expect(column(row, letter), letter).toBe(expected);
    for (const letter of ['C', 'D', 'E', 'H', 'J', 'M', 'N', 'O', 'Q', 'S', 'U', 'X', 'Z', 'AA', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AO']) {
      expect(column(row, letter), letter).toBe('');
    }
  });

  it('retains the buyer as sender for a gift, with the EC message and a subscription label for both same and different parties', () => {
    const gift = { ...sampleOrder, shipping_last_name: '試験', shipping_first_name: '受取人', shipping_phone: '010-0000-0002' };
    for (const subscription of [false, true]) {
      const [row] = buildYamatoRows([{ ...gift, stripe_subscription_id: subscription ? 'sub_fixture' : null }]);
      expect(column(row, 'P')).toBe('試験 受取人');
      expect(column(row, 'I')).toBe('010-0000-0002');
      expect(column(row, 'T')).toBe('010-0000-0001');
      expect(column(row, 'V')).toBe('0123456');
      expect(column(row, 'W')).toBe('試験県試験市試験町1-2-3 テスト棟101');
      expect(column(row, 'Y')).toBe('試験 購入者');
      expect(column(row, 'AG')).toBe(`イケベジECサイトより発送${subscription ? ' 定期便' : ''}`);
    }
    expect(column(buildYamatoRows([{ ...sampleOrder, stripe_subscription_id: 'sub_fixture' }])[0], 'AG')).toBe('定期便');
  });

  it.each([
    { phone: '010-0000-0099' }, { billing_postal_code: '0999999' },
    { billing_address: '別町9' }, { first_name: '別名', shipping_first_name: '購入者' },
  ])('requires all four party fields to match, not just a matching address: %j', changes => {
    const order = { ...sampleOrder, shipping_phone: '010-0000-0001', ...changes };
    const [row] = buildYamatoRows([order]);
    expect(column(row, 'Y')).not.toBe('イケベジ');
    expect(column(row, 'AG')).toBe('イケベジECサイトより発送');
  });

  it('groups identical product variants within an order, without merging other variants, products or orders', () => {
    const [base] = sampleOrder.order_items!;
    const rows = buildYamatoRows([{ ...sampleOrder, order_items: [
      { ...base, selected_options: { milling: 'brown', size: '5' }, quantity: 2 },
      { ...base, selected_options: { size: '5', milling: 'brown' }, quantity: 3 },
      { ...base, variant: '白米' },
      { ...base, product_id: 'different-product' },
    ] }, { ...sampleOrder, id: 'second-order', order_number: '00001235' }]);
    expect(rows.map(row => column(row, 'AB'))).toEqual(['試験米5kg / 玄米×5', '試験米5kg / 白米', '試験米5kg / 玄米', '試験米5kg / 玄米']);
    expect(rows.map(row => row[0])).toEqual(['00001234', '00001234', '00001234', '00001235']);
  });

  it.each([
    ['', ''], [null, ''], ['指定なし', ''], ['午前中', '0812'], ['8~12時', '0812'],
    ['０８１２', '0812'], ['14〜16時', '1416'], ['16～18時', '1618'],
    ['18-20時', '1820'], ['19~21時', '1921'], ['1921', '1921'],
  ])('maps checkout time %s to %s', (value, expected) => expect(yamatoTimeCode(value)).toBe(expected));

  it('reports unknown time codes and missing data instead of inventing shipment details', () => {
    expect(() => yamatoTimeCode('12~14時')).toThrow('時間帯');
    expect(() => buildYamatoRows([{ ...sampleOrder, billing_address: '', billing_city: '', billing_prefecture: '', billing_building: '' }])).toThrow('注文者住所');
    expect(() => buildYamatoRows([{ ...sampleOrder, order_items: [] }])).toThrow('商品明細');
    expect(() => buildYamatoRows([{ ...sampleOrder, order_items: [{ ...sampleOrder.order_items![0], quantity: 0 }] }])).toThrow('数量');
  });
});

it('round-trips a macro-free XLSX with literal strings, 42 columns, and data from row 2', async () => {
  const order = { ...sampleOrder, order_number: '00001234', first_name: '=1+1' };
  const book = await createYamatoWorkbook([order]);
  const bytes = await book.xlsx.writeBuffer();
  const { default: ExcelJS } = await import('exceljs');
  const reread = new ExcelJS.Workbook();
  await reread.xlsx.load(bytes);
  expect(reread.worksheets).toHaveLength(1);
  const sheet = reread.worksheets[0];
  expect(sheet.rowCount).toBe(2);
  expect(sheet.columnCount).toBe(42);
  expect(sheet.getCell('A2').value).toBe('00001234');
  expect(sheet.getCell('G2').value).toBe('0812');
  expect(sheet.getCell('AP2').value).toBe('01');
  expect(sheet.getCell('P2').value).toBe('試験 =1+1');
  expect(Array.from({ length: 42 }, (_, i) => sheet.getCell(1, i + 1).value)).toEqual(template.columns.map(column => column.header));
  expect(sheet.getRow(1).height).toBe(template.headerHeight);
  for (let i = 0; i < 42; i++) {
    expect(template.columns[i].header.split('\n')[0]).toBe(YAMATO_HEADERS[i]);
    expect(sheet.getColumn(i + 1).width).toBe(template.columns[i].width);
    expect(sheet.getCell(1, i + 1).fill).toEqual(template.headerStyles[template.columns[i].headerStyleIndex].fill);
  }
  for (let i = 1; i <= 42; i++) expect(sheet.getCell(2, i).numFmt).toBe('@');
  expect(sheet.getCell('C2').value || '').toBe('');
  expect(sheet.getCell('E2').value || '').toBe('');
  // XLSX ZIP must not contain a VBA project or a macro-enabled workbook type.
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(bytes);
  expect(Object.keys(zip.files).some(name => /vba|macros/i.test(name))).toBe(false);
  expect(await zip.file('[Content_Types].xml')!.async('string')).not.toContain('macroEnabled');
});
