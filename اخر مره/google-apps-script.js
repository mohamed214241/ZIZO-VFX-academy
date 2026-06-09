/**
 * ═══════════════════════════════════════════════════
 *  Zero To Hero — Google Apps Script (CORS + JSONP Fixed)
 * ═══════════════════════════════════════════════════
 *  تعليمات النشر (مرة واحدة بس):
 *  1. افتح Google Sheets جديد
 *  2. Extensions → Apps Script
 *  3. امسح كل الكود والصق هذا كاملاً
 *  4. اضغط Deploy → New Deployment
 *  5. Type: Web App
 *  6. Execute as: Me (حسابك)
 *  7. Who has access: Anyone
 *  8. Deploy ← انسخ الـ URL
 *  9. ضعه في admin.html و register.html في SHEETS_URL
 * ─────────────────────────────────────────────────
 *  أعمدة الـ Sheet:
 *  A=name B=first C=last D=email E=phone
 *  F=payMethod G=finalPrice H=discountCode I=status J=time
 * ═══════════════════════════════════════════════════
 */

const SHEET_NAME = 'Registrations';

// ── JSONP-aware GET ──────────────────────────────
function doGet(e) {
  const callback = e && e.parameter && e.parameter.callback;
  const data = getRegistrations();
  const json = JSON.stringify(data);
  // If JSONP requested (admin.html uses this to bypass CORS)
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ── POST (register + updateStatus) ──────────────
// Note: no-cors POST arrives here fine — response is opaque on client but that's OK
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'add';
    if (action === 'add')          return jsonOut(addRegistration(data));
    if (action === 'updateStatus') return jsonOut(updateStatus(data.rowIndex, data.status));
    return jsonOut({ error: 'unknown action' });
  } catch(err) {
    return jsonOut({ error: err.message });
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Sheet helper ─────────────────────────────────
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1,1,1,10).setValues([[
      'الاسم الكامل','الاسم الأول','اسم العائلة',
      'الإيميل','الواتساب','طريقة الدفع',
      'المبلغ','كود الخصم','الحالة','التوقيت'
    ]]);
    sh.getRange(1,1,1,10).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function getRegistrations() {
  const sh   = getSheet();
  const data = sh.getDataRange().getValues();
  return data.slice(1).map(row =>
    row.map(c => (c === null || c === undefined) ? '' : String(c))
  );
}

function addRegistration(d) {
  getSheet().appendRow([
    d.name||'', d.first||'', d.last||'',
    d.email||'', d.phone||'',
    d.payMethod||'', d.finalPrice||2500,
    d.discountCode||'', d.status||'pending',
    d.time||new Date().toISOString()
  ]);
  // Email notification (optional — won't fail if off)
  try {
    MailApp.sendEmail({
      to: Session.getActiveUser().getEmail(),
      subject: '🎬 تسجيل جديد: ' + (d.name||''),
      body: 'الاسم: '+(d.name||'')+'\nالواتساب: '+(d.phone||'')+
            '\nالإيميل: '+(d.email||'')+'\nالدفع: '+(d.payMethod||'')+
            ' — '+(d.finalPrice||2500)+' جنيه\nالكود: '+(d.discountCode||'لا يوجد')
    });
  } catch(_) {}
  return { success: true };
}

function updateStatus(rowIndex, status) {
  getSheet().getRange(rowIndex, 9).setValue(status);
  return { success: true };
}
