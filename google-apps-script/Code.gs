// ============================================================
//  Code.gs — Google Apps Script backend
//  Deploy as: Web App → Execute as: Me → Who has access: Anyone
// ============================================================

const SHEET_NAME = 'Workstation_Audit';

const HEADERS = [
  'Timestamp',
  'Employee Name',
  'Role / Designation',
  'Department / Team',
  'Software Used',
  'Project Types',
  'Current Project',
  'Future Projects',
  'PC Handles Work?',
  'Hardware Issues',
  'Additional Notes'
];

// ── POST — save a new submission ───────────────────────────────────────────
function doPost(e) {
  try {
    const data  = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    sheet.appendRow([
      data.timestamp       || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      data.employeeName    || '',
      data.role            || '',
      data.department      || '',
      data.software        || '',
      data.projectTypes    || '',
      data.currentProject  || '',
      data.futureProjects  || '',
      data.hardwareHandles || '',
      data.hardwareIssues  || '',
      data.additionalNotes || ''
    ]);

    styleNewRow(sheet);

    return jsonResponse({ success: true, message: 'Saved successfully.' });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ── GET — return all rows for admin dashboard ──────────────────────────────
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || '';

    if (action === 'getData') {
      const sheet = getOrCreateSheet();
      const data  = sheet.getDataRange().getValues();
      return jsonResponse({ success: true, data: data });
    }

    return jsonResponse({ success: true, message: 'Artist Workstation Audit API v1' });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getOrCreateSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    setupSheet(sheet);
  }

  return sheet;
}

function setupSheet(sheet) {
  sheet.appendRow(HEADERS);

  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setBackground('#1a0a2e');
  headerRange.setFontColor('#a78bfa');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment('left');

  sheet.setFrozenRows(1);

  const widths = [185, 150, 150, 130, 200, 200, 200, 200, 120, 200, 260];
  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  sheet.setRowHeight(1, 32);
}

function styleNewRow(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const range = sheet.getRange(lastRow, 1, 1, HEADERS.length);
  const bg    = lastRow % 2 === 0 ? '#0d0d1a' : '#111120';
  range.setBackground(bg);
  range.setFontColor('#e2e8f0');
  range.setFontSize(10);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Manual test — run from Apps Script editor to verify ───────────────────
function testSetup() {
  const sheet = getOrCreateSheet();
  sheet.appendRow([
    new Date().toLocaleString(),
    'Test User', 'QA Tester', 'IT Department',
    'Blender, Maya', 'Modelling, Texturing',
    'Test project', 'Future test', 'Yes', '', 'Test note'
  ]);
  Logger.log('Test row appended successfully.');
}
