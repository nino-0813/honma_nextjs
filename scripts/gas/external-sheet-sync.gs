/** Standalone GAS project. READS sheets only. No Gmail, sheet writes or trigger creation.
 * Script Properties: IKEVEGE_SYNC_ORIGIN, IKEVEGE_SYNC_MODE (dry_run/save),
 * IKEVEGE_SYNC_TOKEN_<SOURCE_ID in uppercase> (one secret per source).
 * Leave MODE unset for a dry run. Do not put Supabase service-role keys here.
 */
var IKEVEGE_SOURCES = [
  { id: 'rice_tabechoku', spreadsheetId: '1XvPCDAYhGXSpQV_rWgTbAgefmegEFulj3YCwgHPfDJg', sheetId: 0 },
  { id: 'rice_satofuru', spreadsheetId: '1XvPCDAYhGXSpQV_rWgTbAgefmegEFulj3YCwgHPfDJg', sheetId: 1791632146 },
  { id: 'rice_furusatodo', spreadsheetId: '1XvPCDAYhGXSpQV_rWgTbAgefmegEFulj3YCwgHPfDJg', sheetId: 1053753979 },
  { id: 'shiitake_yorankasha', spreadsheetId: '1BOqMaHeY0zyX8AZ3duvOhUhSzxBEAOXycRieN80JpQw', sheetId: 1999545666 },
  { id: 'shiitake_other', spreadsheetId: '1BOqMaHeY0zyX8AZ3duvOhUhSzxBEAOXycRieN80JpQw', sheetId: 0 }
];
var IKEVEGE_SYNC_COLUMNS = ['注文番号', '日時', '商品名', '種類', '重量', '個数', '数量', '売上',
  '取込メールID（管理用）', '年産', '注文状態', '明細ID', '販売チャネル', '商品売上', '送料', '商品値引き', '紹介者ID'];

function syncIkevegeExternalSheets() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) throw new Error('別の同期が実行中です');
  try {
    var properties = PropertiesService.getScriptProperties();
    var origin = properties.getProperty('IKEVEGE_SYNC_ORIGIN');
    if (!origin || !/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin)) throw new Error('HTTPSの送信先originを設定してください（末尾スラッシュなし）');
    var dryRun = properties.getProperty('IKEVEGE_SYNC_MODE') !== 'save';
    var failures = [];
    IKEVEGE_SOURCES.forEach(function(source) {
      var token = properties.getProperty('IKEVEGE_SYNC_TOKEN_' + source.id.toUpperCase());
      // Only explicitly configured sources run. Unknown-source tab stays unconnected by default.
      if (!token) return;
      try {
        if (token.length < 32) throw new Error('連携キーが短すぎます');
        var capturedAt = new Date().toISOString();
        var workbook = SpreadsheetApp.openById(source.spreadsheetId);
        var sheet = workbook.getSheets().filter(function(s) { return s.getSheetId() === source.sheetId; })[0];
        if (!sheet) throw new Error('対象タブがありません');
        var lastRow = sheet.getLastRow(), lastColumn = sheet.getLastColumn();
        if (lastRow < 1 || lastColumn > 40 || lastRow > 5001) throw new Error('読取範囲を確認してください（上限5000明細）。分割送信しません');
        var range = sheet.getRange(1, 1, lastRow, lastColumn);
        // One read avoids mixing row order from two calls while another importer appends/sorts.
        var values = range.getValues();
        var indexes = [];
        var headers = [];
        values[0].forEach(function(h, i) {
          var name = String(h).normalize('NFKC').replace(/\s/g, '');
          if (IKEVEGE_SYNC_COLUMNS.some(function(c) { return c.normalize('NFKC').replace(/\s/g, '') === name; })) {
            headers.push(name); indexes.push(i);
          }
        });
        var rows = values.slice(1).map(function(row, rowIndex) {
          return indexes.map(function(i, columnIndex) {
            // Dates are sent in JST as calendar dates, never serial numbers or UTC-shifted dates.
            if (headers[columnIndex] === '日時' && row[i] instanceof Date) {
              return Utilities.formatDate(row[i], 'Asia/Tokyo', 'yyyy-MM-dd');
            }
            return String(row[i] == null ? '' : row[i]);
          });
        });
        var payload = JSON.stringify({ source: source.id, spreadsheetId: source.spreadsheetId,
          sheetId: source.sheetId, capturedAt: capturedAt, headers: headers, rows: rows, dryRun: dryRun });
        if (Utilities.newBlob(payload).getBytes().length > 2000000) throw new Error('送信サイズ超過。分割せず停止しました');
        var response = UrlFetchApp.fetch(origin + '/api/external-sheet-sync', {
          method: 'post', contentType: 'application/json', payload: payload,
          headers: { Authorization: 'Bearer ' + token, 'X-Sheet-Source': source.id },
          muteHttpExceptions: true, followRedirects: false
        });
        if (response.getResponseCode() !== 200) throw new Error('HTTP ' + response.getResponseCode());
        var result = JSON.parse(response.getContentText());
        if (result.source !== source.id || result.inventoryChanged !== false || (dryRun ? result.saved !== false : result.saved !== true)) {
          throw new Error('受信結果の確認に失敗しました');
        }
        // No customer details, mail IDs, tokens or response body in logs.
        console.log(source.id + ': ' + (dryRun ? '確認のみ' : '取込保存') + ' / 明細 ' + result.lines + ' / 要確認 ' + result.review);
      } catch (error) {
        // Do not log fetched content, underlying library errors or credentials.
        failures.push(source.id);
      }
    });
    if (failures.length) throw new Error('同期失敗：' + failures.join(', ') + '。他タブの成功分は保持。同じ関数を再実行できます');
  } finally {
    lock.releaseLock();
  }
}
