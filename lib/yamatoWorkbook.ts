import { buildYamatoRows, type YamatoOrder } from './yamatoExport';
import type { Style } from 'exceljs';
import template from './yamatoTemplate.json';

const cloneStyle = (style: unknown): Partial<Style> => JSON.parse(JSON.stringify(style));

export async function createYamatoWorkbook(orders: YamatoOrder[]) {
  const rows = buildYamatoRows(orders);
  // Only load the Excel writer when an administrator asks for an export.
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(template.sheetName);
  sheet.columns = template.columns.map(column => ({ header: column.header, width: column.width }));
  sheet.getRow(1).height = template.headerHeight;
  template.columns.forEach((column, index) => {
    sheet.getCell(1, index + 1).style = cloneStyle(template.headerStyles[column.headerStyleIndex]);
  });
  sheet.getCell('C1').note = 'クール区分は出力後に手動入力してください。';
  sheet.getCell('E1').note = '出荷予定日は出力後にYYYY/MM/DDで手動入力してください。';
  for (const values of rows) {
    // Assign literal strings, never formulas, to preserve leading zeroes and customer text.
    const row = sheet.addRow(values);
    row.height = template.dataRowHeight;
    template.columns.forEach((column, index) => {
      row.getCell(index + 1).style = { ...cloneStyle(template.dataStyle), numFmt: '@' };
    });
  }
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
