/**
 * Rannu ja Konguta rahvamajade ruumibroneeringu vastuvõtja.
 *
 * Kasutamine:
 * 1. Loo Google Sheet ja pane esimeseks leheks "Broneeringud".
 * 2. Ava Extensions → Apps Script.
 * 3. Kleebi see kood Apps Scripti.
 * 4. Muuda SHEET_ID, DEFAULT_EMAIL, RANNU_EMAIL ja KONGUTA_EMAIL.
 * 5. Deploy → New deployment → Web app.
 * 6. Execute as: Me. Who has access: Anyone.
 * 7. Kopeeri Web app URL ja pane Reacti failis src/data.js bookingSettings.appsScriptUrl väärtuseks.
 */

const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE'
const SHEET_NAME = 'Broneeringud'
const DEFAULT_EMAIL = 'kultuur@elva.ee'
const RANNU_EMAIL = 'rannu@elva.ee'
const KONGUTA_EMAIL = 'konguta@elva.ee'

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents)
    const sheet = getOrCreateSheet_()
    ensureHeader_(sheet)

    const staffEmail = getStaffEmail_(payload.house, payload.roomEmail)
    const selectedServices = (payload.selectedServices || []).map(item => `${item.label} (${formatEuro_(item.total)})`).join('; ')

    sheet.appendRow([
      new Date(),
      payload.house || '',
      payload.roomName || '',
      payload.date || '',
      payload.startTime || '',
      payload.endTime || '',
      payload.hours || '',
      payload.eventType || '',
      payload.participants || '',
      payload.publicEvent ? 'avalik' : 'kinnine/era',
      payload.name || '',
      payload.email || '',
      payload.phone || '',
      selectedServices,
      payload.roomCost || 0,
      payload.cleaningFee || 0,
      payload.servicesTotal || 0,
      payload.estimatedTotal || 0,
      payload.notes || '',
      'ootel'
    ])

    const subjectStaff = `Uus ruumi kasutamise soov: ${payload.house} / ${payload.roomName}`
    const subjectClient = 'Sinu ruumi kasutamise soov on vastu võetud'
    const body = buildEmailBody_(payload)

    MailApp.sendEmail({
      to: staffEmail,
      cc: DEFAULT_EMAIL,
      subject: subjectStaff,
      htmlBody: body,
      name: 'Digitaalne kultuuripesa'
    })

    if (payload.email) {
      MailApp.sendEmail({
        to: payload.email,
        subject: subjectClient,
        htmlBody: body + '<p><b>NB!</b> Tegemist on päringuga. Lõpliku broneeringu, hinna ja tingimused kinnitab rahvamaja töötaja.</p>',
        name: 'Rannu ja Konguta rahvamajad'
      })
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID)
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME)
  return sheet
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() > 0) return
  sheet.appendRow([
    'Aeg',
    'Rahvamaja',
    'Ruum',
    'Kuupäev',
    'Algus',
    'Lõpp',
    'Tunnid',
    'Sündmuse liik',
    'Osalejad',
    'Kasutus',
    'Nimi',
    'E-post',
    'Telefon',
    'Lisateenused',
    'Ruumi hind',
    'Koristus',
    'Teenused kokku',
    'Orienteeruv koguhind',
    'Lisainfo',
    'Staatus'
  ])
}

function getStaffEmail_(house, roomEmail) {
  if (roomEmail) return roomEmail
  if ((house || '').includes('Rannu')) return RANNU_EMAIL
  if ((house || '').includes('Konguta')) return KONGUTA_EMAIL
  return DEFAULT_EMAIL
}

function formatEuro_(value) {
  return `${Number(value || 0).toFixed(2).replace('.', ',')} €`
}

function buildEmailBody_(payload) {
  const services = (payload.selectedServices || []).length
    ? (payload.selectedServices || []).map(item => `<li>${escapeHtml_(item.label)}: ${formatEuro_(item.total)}</li>`).join('')
    : '<li>Lisateenuseid ei valitud</li>'

  return `
    <h2>Ruumi kasutamise soov</h2>
    <p><b>Rahvamaja:</b> ${escapeHtml_(payload.house || '')}</p>
    <p><b>Ruum:</b> ${escapeHtml_(payload.roomName || '')}</p>
    <p><b>Aeg:</b> ${escapeHtml_(payload.date || '')}, ${escapeHtml_(payload.startTime || '')}–${escapeHtml_(payload.endTime || '')}</p>
    <p><b>Arvestuslik kestus:</b> ${escapeHtml_(String(payload.hours || ''))} h</p>
    <p><b>Sündmuse liik:</b> ${escapeHtml_(payload.eventType || '')}</p>
    <p><b>Osalejate arv:</b> ${escapeHtml_(String(payload.participants || ''))}</p>
    <p><b>Kasutus:</b> ${payload.publicEvent ? 'avalik sündmus' : 'era- või kinnine sündmus'}</p>

    <h3>Klient</h3>
    <p><b>Nimi:</b> ${escapeHtml_(payload.name || '')}</p>
    <p><b>E-post:</b> ${escapeHtml_(payload.email || '')}</p>
    <p><b>Telefon:</b> ${escapeHtml_(payload.phone || '')}</p>

    <h3>Valitud teenused</h3>
    <ul>${services}</ul>

    <h3>Orienteeruv hind</h3>
    <p>Ruumi kasutus: ${formatEuro_(payload.roomCost)}</p>
    <p>Koristus / ettevalmistus: ${formatEuro_(payload.cleaningFee)}</p>
    <p>Lisateenused: ${formatEuro_(payload.servicesTotal)}</p>
    <p><b>Kokku: ${formatEuro_(payload.estimatedTotal)}</b></p>

    <h3>Lisainfo</h3>
    <p>${escapeHtml_(payload.notes || '-')}</p>

    <p><i>${escapeHtml_(payload.disclaimer || '')}</i></p>
  `
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
