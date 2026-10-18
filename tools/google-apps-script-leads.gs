/**
 * Explorer Hyde Park — lead capture → Google Sheet
 *
 * Paste this whole file into the Sheet's Apps Script editor
 * (Extensions → Apps Script), then Deploy → New deployment → Web app:
 *   Execute as: Me
 *   Who has access: Anyone
 * Copy the Web app URL (ends in /exec) into LEADS_ENDPOINT in
 * assets/js/main.js, then run `node tools/build-pages.js`.
 *
 * After editing this script later: Deploy → Manage deployments → edit the
 * SAME deployment → Version: New version. A "New deployment" gives a new
 * URL and the site would keep posting to the old one.
 *
 * This file lives in tools/ only as a copy for the record — it is not
 * served by the site (.htaccess blocks tools/).
 */

var SHEET_NAME = 'Leads';
var TIMEZONE = 'Africa/Cairo';

// Optional: an address that gets an email for every new lead. Empty = off.
var NOTIFY_EMAIL = '';

// Column order in the sheet. Change labels freely; keep the keys.
var COLUMNS = [
  ['timestamp', 'التاريخ'],
  ['form', 'الفورم'],
  ['project', 'المشروع'],
  ['name', 'الاسم'],
  ['phone', 'الموبايل'],
  ['email', 'الإيميل'],
  ['purpose', 'الغرض'],
  ['budget_range', 'القسط المريح'],
  ['unit_type', 'نوع الوحدة'],
  ['timing', 'ميعاد الشراء'],
  ['message', 'الرسالة'],
  ['source', 'المصدر'],
  ['medium', 'الوسيلة'],
  ['campaign', 'الحملة'],
  ['term', 'الكلمة'],
  ['content', 'الإعلان'],
  ['gclid', 'gclid'],
  ['landing_page', 'أول صفحة'],
  ['page', 'صفحة الإرسال'],
  ['referrer', 'جاي منين'],
  ['status', 'الحالة'],
  ['notes', 'ملاحظات'],
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var data = parseBody_(e);

    // Honeypot: real visitors never see or fill the "website" field.
    if (data.website) return ok_();
    // Minimum a sales call needs.
    if (!data.name || !data.phone || String(data.phone).replace(/\D/g, '').length < 7) return ok_();

    var sheet = getSheet_();
    data.timestamp = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm');
    data.status = data.status || 'جديد';

    var row = COLUMNS.map(function (c) {
      var v = data[c[0]] == null ? '' : String(data[c[0]]).slice(0, 1000);
      // Leading apostrophe keeps "+2010…" as text instead of a number/formula.
      if (c[0] === 'phone' || /^[=+\-@]/.test(v)) v = "'" + v;
      return v;
    });
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, 'Lead جديد — ' + (data.project || data.form || 'Explorer Hyde Park'),
        COLUMNS.map(function (c, i) { return c[1] + ': ' + row[i]; }).join('\n'));
    }
    return ok_();
  } catch (err) {
    console.error(err);
    return ok_();
  } finally {
    lock.releaseLock();
  }
}

// Opening the /exec URL in a browser should just confirm it is alive.
function doGet() {
  return ContentService.createTextOutput('Explorer Hyde Park leads endpoint is running.');
}

function parseBody_(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (ignore) {}
  }
  return (e && e.parameter) || {};
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS.map(function (c) { return c[1]; }));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    sheet.setRightToLeft(true);
  }
  return sheet;
}

function ok_() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor (▶ testSetup) to create the header row and grant permissions. */
function testSetup() {
  getSheet_();
}
