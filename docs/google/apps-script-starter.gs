/**
 * Digitaalne kultuuripesa: Google Sheets -> JSON starter
 *
 * Kuidas kasutada:
 * 1. Loo Google Sheet lehtedega: Sundmused, Ringid, Ruumid, Majad.
 * 2. Pane esimesele reale veerunimed samas loogikas nagu Reacti andmetes.
 * 3. Ava Extensions -> Apps Script ja kleebi see kood.
 * 4. Muuda SPREADSHEET_ID.
 * 5. Deploy -> New deployment -> Web app.
 * 6. Execute as: Me. Who has access: Anyone with the link.
 * 7. Lisa Reacti projekti hiljem endpoint, mis loeb seda JSON-i.
 */

const SPREADSHEET_ID = 'PASTEERI_SIIA_GOOGLE_SHEET_ID';

function doGet(e) {
  const type = (e.parameter.type || 'events').toLowerCase();
  const map = {
    events: 'Sundmused',
    activities: 'Ringid',
    rooms: 'Ruumid',
    houses: 'Majad'
  };
  const sheetName = map[type] || 'Sundmused';
  const data = readSheetAsObjects_(sheetName);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, type, count: data.length, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function readSheetAsObjects_(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(h => String(h).trim());
  return values.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = normalizeCell_(row[i]);
      });
      return obj;
    });
}

function normalizeCell_(value) {
  if (value === true || value === false) return value;
  if (value instanceof Date) return value.toISOString();
  const text = String(value || '').trim();
  if (text.toLowerCase() === 'true') return true;
  if (text.toLowerCase() === 'false') return false;
  return text;
}
