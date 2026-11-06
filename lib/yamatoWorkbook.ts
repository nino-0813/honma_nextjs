import { buildYamatoRows, YAMATO_HEADERS, type YamatoOrder } from './yamatoExport';

export async function createYamatoWorkbook(orders: YamatoOrder[]) {
  const rows = buildYamatoRows(orders);
  // Only load the Excel writer when an administrator asks for an export.
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('外部データ取り込み基本レイアウト', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = YAMATO_HEADERS.map((header, index) => ({
    header, width: [11, 22, 27, 32].includes(index) ? 45 : 22, style: { numFmt: '@' },
  }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).height = 32;
  sheet.getRow(1).alignment = { vertical: 'middle', wrapText: true };
  sheet.getCell('C1').note = 'クール区分は出力後に手動入力してください。';
  sheet.getCell('E1').note = '出荷予定日は出力後にYYYY/MM/DDで手動入力してください。';
  for (const values of rows) {
    // Assign literal strings, never formulas, to preserve leading zeroes and customer text.
    const row = sheet.addRow(values);
    row.eachCell({ includeEmpty: true }, cell => { cell.numFmt = '@'; });
    for (const column of [3, 5]) row.getCell(column).fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' },
    };
  }
  sheet.autoFilter = { from: 'A1', to: `AP${rows.length + 1}` };
  return workbook;
}

export async function downloadYamatoWorkbook(orders: YamatoOrder[], filename: string) {
  const workbook = await createYamatoWorkbook(orders);
  const bytes = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
