/**
 * Mộc Quả — ghi mỗi đơn thành một dòng trên Google Sheet.
 *
 * Dán file này vào Apps Script gắn với chính Sheet đơn hàng
 * (trong Sheet: Tiện ích → Apps Script). Không chạy script tách rời.
 *
 * Bí mật: Project Settings → Script properties → thêm
 *   GOOGLE_SHEETS_SECRET = cùng chuỗi với biến GOOGLE_SHEETS_SECRET trên Render.
 * Để trống property thì script không chặn (chỉ dùng lúc thử). Nên đặt bí mật trước khi mở web cho Anyone.
 *
 * Cột: Thời gian, Mã đơn, Khách, Điện thoại, Địa chỉ, Ghi chú, Món,
 * Tạm tính, Giảm, Phí giao, Tổng, Thanh toán, Trạng thái, Đánh dấu.
 * Dòng thử từ /admin có Đánh dấu = TEST và mã TEST. Không phải đơn hàng.
 */

var COLUMNS = [
  ['time', 'Thời gian'],
  ['code', 'Mã đơn'],
  ['name', 'Khách'],
  ['phone', 'Điện thoại'],
  ['address', 'Địa chỉ'],
  ['note', 'Ghi chú'],
  ['items', 'Món'],
  ['subtotal', 'Tạm tính'],
  ['discount', 'Giảm'],
  ['ship', 'Phí giao'],
  ['total', 'Tổng'],
  ['pay', 'Thanh toán'],
  ['status', 'Trạng thái'],
  ['mark', 'Đánh dấu'],
];

var TEXT_KEYS = { time: true, code: true, phone: true };

function doGet() {
  return json_({ ok: true, service: 'mocqua-sheets' });
}

function doPost(e) {
  try {
    var body = JSON.parse((e.postData && e.postData.contents) || '{}');
    var expected = PropertiesService.getScriptProperties().getProperty('GOOGLE_SHEETS_SECRET') || '';
    if (expected && String(body.secret || '') !== expected) {
      return json_({ ok: false, error: 'secret' });
    }
    var row = body.row;
    if (!row || typeof row !== 'object') return json_({ ok: false, error: 'missing' });

    var lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(COLUMNS.map(function (col) { return col[1]; }));
      }
      sheet.appendRow(COLUMNS.map(function (col) {
        var key = col[0];
        var value = row[key];
        if (value == null) return '';
        var text = String(value);
        if (TEXT_KEYS[key]) return "'" + text;
        if (typeof value === 'number' && isFinite(value)) return value;
        return text;
      }));
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'failed' });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
