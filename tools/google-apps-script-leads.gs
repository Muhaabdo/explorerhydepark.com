/**
 * Explorer Hyde Park — lead capture → Google Sheet
 *
 * Setup (once):
 *   1. Extensions → Apps Script → paste this whole file → Save.
 *   2. Run ▶ setupSheet (creates/styles the "Leads" tab; grant permissions).
 *   3. Deploy → New deployment → Web app — Execute as: Me, Who has access: Anyone.
 *   4. Put the /exec URL in LEADS_ENDPOINT in assets/js/main.js and rebuild.
 *
 * After editing this script later: Deploy → Manage deployments → ✏️ edit the
 * SAME deployment → Version: New version → Deploy. (A "New deployment" gives a
 * new URL and the site would keep posting to the old one.)
 *
 * Kept in tools/ as a copy for the record — not served by the site.
 */

var SHEET_NAME = 'Leads';
var TIMEZONE = 'Africa/Cairo';
var MAX_ROWS = 5000; // rows pre-formatted (banding, dropdown, colors)

// Optional: an address that gets an email for every new lead. Empty = off.
var NOTIFY_EMAIL = '';

// Brand palette (explorerhydepark.com)
var C = {
  navy: '#040E33',
  blue: '#0D4088',
  sky: '#1E91CD',
  green: '#00D7A0',
  yellow: '#F7DB32',
  white: '#FFFFFF',
  rowAlt: '#F3F7FC',
  border: '#D9E2EF',
};

// [key, header, width px, group]. Order = column order in the sheet.
// Groups color the header: lead (navy) · answers (blue) · follow-up (green) · source (sky).
var COLUMNS = [
  ['timestamp', 'Date', 135, 'lead'],
  ['status', 'Status', 120, 'follow'],
  ['name', 'Name', 160, 'lead'],
  ['phone', 'Phone', 150, 'lead'],
  ['project', 'Project', 170, 'lead'],
  ['unit_type', 'Unit Type', 130, 'answers'],
  ['budget_range', 'Monthly Budget', 140, 'answers'],
  ['timing', 'Buying Timeline', 130, 'answers'],
  ['purpose', 'Purpose', 130, 'answers'],
  ['email', 'Email', 190, 'lead'],
  ['message', 'Message', 240, 'lead'],
  ['notes', 'Notes', 240, 'follow'],
  ['form', 'Form', 90, 'source'],
  ['source', 'Source', 120, 'source'],
  ['medium', 'Medium', 100, 'source'],
  ['campaign', 'Campaign', 150, 'source'],
  ['term', 'Keyword', 140, 'source'],
  ['content', 'Ad Content', 120, 'source'],
  ['gclid', 'GCLID', 140, 'source'],
  ['landing_page', 'Landing Page', 200, 'source'],
  ['page', 'Submitted From', 200, 'source'],
  ['referrer', 'Referrer', 200, 'source'],
];

var GROUP_STYLE = {
  lead: { bg: C.navy, fg: C.white },
  answers: { bg: C.blue, fg: C.white },
  follow: { bg: C.green, fg: C.navy },
  source: { bg: C.sky, fg: C.white },
};

// Status dropdown → row-cell colors.
var STATUSES = [
  ['New', '#FFF6C7', '#7A6200'],
  ['Contacted', '#DCEBFB', C.blue],
  ['Interested', '#D2F7EC', '#00664D'],
  ['Site Visit', '#E6DEFA', '#4B2A99'],
  ['Closed', C.green, C.navy],
  ['Not Interested', '#ECEFF3', '#5B6475'],
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
    data.timestamp = new Date();
    data.status = 'New';

    var row = COLUMNS.map(function (c) {
      var v = data[c[0]];
      if (v instanceof Date) return v;
      v = v == null ? '' : String(v).slice(0, 1000);
      // Leading apostrophe keeps "+20 10…" as text, and stops formula injection.
      if (c[0] === 'phone' || /^[=+\-@]/.test(v)) v = "'" + v;
      return v;
    });
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, 'New lead — ' + (data.project || data.form || 'Explorer Hyde Park'),
        COLUMNS.map(function (c, i) {
          var v = row[i] instanceof Date ? Utilities.formatDate(row[i], TIMEZONE, 'yyyy-MM-dd HH:mm') : row[i];
          return c[1] + ': ' + String(v).replace(/^'/, '');
        }).join('\n'));
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

/** The Leads tab — created and styled on first use. */
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME, 0);
    styleSheet_(sheet);
  }
  return sheet;
}

/**
 * ▶ Run once from the editor. Builds (or rebuilds) the styled Leads tab.
 * If a Leads tab already exists with a different header (e.g. the earlier
 * Arabic version), it is kept as "Leads (old …)" and a fresh one is created,
 * so no row ever lands under the wrong column.
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TIMEZONE);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (sheet && sheet.getLastRow() > 0 && sheet.getRange(1, 1).getValue() !== COLUMNS[0][1]) {
    sheet.setName(SHEET_NAME + ' (old ' + Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH-mm') + ')');
    sheet = null;
  }
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME, 0);
  styleSheet_(sheet);
  ss.setActiveSheet(sheet);
}

function styleSheet_(sheet) {
  var n = COLUMNS.length;
  sheet.setRightToLeft(false);
  sheet.setTabColor(C.sky);

  // Make sure the sheet is big enough, then trim extra columns.
  if (sheet.getMaxRows() < MAX_ROWS) sheet.insertRowsAfter(sheet.getMaxRows(), MAX_ROWS - sheet.getMaxRows());
  if (sheet.getMaxColumns() < n) sheet.insertColumnsAfter(sheet.getMaxColumns(), n - sheet.getMaxColumns());
  if (sheet.getMaxColumns() > n) sheet.deleteColumns(n + 1, sheet.getMaxColumns() - n);

  // Header row
  var header = sheet.getRange(1, 1, 1, n);
  header.setValues([COLUMNS.map(function (c) { return c[1]; })])
    .setFontFamily('Roboto').setFontSize(10).setFontWeight('bold')
    .setVerticalAlignment('middle').setHorizontalAlignment('left').setWrap(false);
  COLUMNS.forEach(function (c, i) {
    var g = GROUP_STYLE[c[3]];
    sheet.getRange(1, i + 1).setBackground(g.bg).setFontColor(g.fg);
    sheet.setColumnWidth(i + 1, c[2]);
  });
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(4); // Date · Status · Name · Phone stay visible while scrolling

  // Body
  var body = sheet.getRange(2, 1, MAX_ROWS - 1, n);
  body.setFontFamily('Roboto').setFontSize(10).setFontColor(C.navy)
    .setVerticalAlignment('middle').setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  sheet.setRowHeightsForced(2, MAX_ROWS - 1, 28);

  // Alternating rows (remove old banding first)
  sheet.getBandings().forEach(function (b) { b.remove(); });
  body.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false)
    .setFirstRowColor(C.white).setSecondRowColor(C.rowAlt);

  // Column formats
  col_(sheet, 'timestamp').setNumberFormat('yyyy-mm-dd  hh:mm').setHorizontalAlignment('left');
  col_(sheet, 'phone').setNumberFormat('@').setFontFamily('Roboto Mono');
  col_(sheet, 'name').setFontWeight('bold');
  ['message', 'notes'].forEach(function (k) { col_(sheet, k).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP); });
  ['gclid', 'landing_page', 'page', 'referrer'].forEach(function (k) { col_(sheet, k).setFontColor('#5B6475'); });

  // Status dropdown + colored pills
  var status = col_(sheet, 'status');
  status.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUSES.map(function (s) { return s[0]; }), true)
    .setAllowInvalid(false).build())
    .setFontWeight('bold').setHorizontalAlignment('center');
  var rules = sheet.getConditionalFormatRules().filter(function (r) {
    return r.getRanges().every(function (rg) { return rg.getColumn() !== status.getColumn(); });
  });
  STATUSES.forEach(function (s) {
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(s[0]).setBackground(s[1]).setFontColor(s[2])
      .setRanges([status]).build());
  });
  sheet.setConditionalFormatRules(rules);

  // Thin border under the header
  header.setBorder(null, null, true, null, null, null, C.navy, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}

/** Body range (row 2 → MAX_ROWS) of the column with this key. */
function col_(sheet, key) {
  var i = COLUMNS.map(function (c) { return c[0]; }).indexOf(key);
  return sheet.getRange(2, i + 1, MAX_ROWS - 1, 1);
}

function ok_() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
