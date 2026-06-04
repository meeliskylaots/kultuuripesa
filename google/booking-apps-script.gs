/**
 * Rannu ja Konguta rahvamajade ruumibroneeringu vastuvõtja.
 *
 * Mida teeb:
 * 1. Võtab veebilehe broneeringuvormist päringu vastu.
 * 2. Salvestab päringu Google Sheeti lehele "Broneeringud".
 * 3. Saadab e-kirja rahvamaja e-postile.
 * 4. Saadab kinnituskirja kliendile.
 */

const SHEET_ID = '15eeMfVjiQzbrEVTgstIcEykaj6sSy3f9-hnNAv6yx3I'
const SHEET_NAME = 'Broneeringud'

// Testimiseks võivad need olla alguses sinu enda e-postid.
// Hiljem asenda Rannu ja Konguta päris e-postidega.
const DEFAULT_EMAIL = 'meeliskylaots@gmail.com'
const RANNU_EMAIL = 'meeliskylaots@gmail.com'
const KONGUTA_EMAIL = 'meeliskylaots@gmail.com'

const ORGANIZATION_NAME = 'Rannu ja Konguta rahvamajad'

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Päringu sisu puudub.')
    }

    const payload = JSON.parse(e.postData.contents)
    validatePayload_(payload)

    const sheet = getOrCreateSheet_()
    ensureHeader_(sheet)

    const bookingId = createBookingId_()
    const staffEmail = getStaffEmail_(payload.house, payload.roomEmail)
    const selectedServicesText = formatSelectedServicesForSheet_(payload.selectedServices)

    sheet.appendRow([
      new Date(),
      bookingId,
      payload.house || '',
      payload.roomName || '',
      payload.date || '',
      payload.startTime || '',
      payload.endTime || '',
      payload.hours || '',
      payload.eventType || '',
      payload.participants || '',
      payload.publicEvent ? 'avalik sündmus' : 'era- või kinnine sündmus',
      payload.name || '',
      payload.email || '',
      payload.phone || '',
      selectedServicesText,
      Number(payload.roomCost || 0),
      'sisaldub ruumi rendihinnas',
      Number(payload.servicesTotal || 0),
      Number(payload.estimatedTotal || 0),
      payload.notes || '',
      payload.disclaimer || '',
      'ootel'
    ])

    sendStaffEmail_(staffEmail, payload, bookingId)
    sendClientEmail_(payload, bookingId)

    return jsonResponse_({
      ok: true,
      bookingId: bookingId,
      message: 'Broneeringusoov saadeti edukalt.'
    })
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: String(error)
    })
  }
}

function doGet() {
  return ContentService
    .createTextOutput('Rannu ja Konguta ruumibroneeringu Apps Script töötab.')
    .setMimeType(ContentService.MimeType.TEXT)
}

function testSetup() {
  const sheet = getOrCreateSheet_()
  ensureHeader_(sheet)

  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: 'Ruumibroneeringu Apps Script töötab',
    htmlBody: '<h2>Test õnnestus</h2><p>Google Sheet on leitav ja e-kirjade saatmine töötab.</p>',
    name: ORGANIZATION_NAME
  })
}

function validatePayload_(payload) {
  const requiredFields = [
    'house',
    'roomName',
    'date',
    'startTime',
    'endTime',
    'eventType',
    'name',
    'email',
    'phone'
  ]

  const missing = requiredFields.filter(field => !payload[field])
  if (missing.length > 0) {
    throw new Error('Puuduvad kohustuslikud väljad: ' + missing.join(', '))
  }

  if (!isValidEmail_(payload.email)) {
    throw new Error('Kliendi e-posti aadress ei ole korrektne.')
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
    'Sisestamise aeg',
    'Broneeringu ID',
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
    'Valitud lisateenused',
    'Ruumi hind',
    'Koristus ja ettevalmistus',
    'Teenused kokku',
    'Orienteeruv koguhind',
    'Lisainfo',
    'Märkus hinna kohta',
    'Staatus'
  ])

  sheet.setFrozenRows(1)
}

function createBookingId_() {
  const now = new Date()
  const datePart = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss')
  const randomPart = Math.floor(Math.random() * 900 + 100)
  return `BR-${datePart}-${randomPart}`
}

function getStaffEmail_(house, roomEmail) {
  if (roomEmail && isValidEmail_(roomEmail)) return roomEmail

  const houseText = String(house || '').toLowerCase()
  if (houseText.includes('rannu')) return RANNU_EMAIL
  if (houseText.includes('konguta')) return KONGUTA_EMAIL
  return DEFAULT_EMAIL
}

function sendStaffEmail_(staffEmail, payload, bookingId) {
  MailApp.sendEmail({
    to: staffEmail,
    cc: DEFAULT_EMAIL,
    subject: `Uus ruumi kasutamise soov: ${payload.house} / ${payload.roomName}`,
    htmlBody: buildStaffEmailBody_(payload, bookingId),
    name: ORGANIZATION_NAME
  })
}

function sendClientEmail_(payload, bookingId) {
  if (!payload.email || !isValidEmail_(payload.email)) return

  MailApp.sendEmail({
    to: payload.email,
    subject: 'Sinu ruumi kasutamise soov on kätte saadud.',
    htmlBody: buildClientEmailBody_(payload, bookingId),
    name: ORGANIZATION_NAME
  })
}

function buildStaffEmailBody_(payload, bookingId) {
  const services = buildServicesHtml_(payload.selectedServices)
  const included = buildListHtml_(payload.includedItems, 'Info puudub.')
  const agreement = buildListHtml_(payload.agreementItems, 'Eraldi kokkuleppeid ei märgitud.')

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>Uus ruumi kasutamise soov</h2>
      <p><b>Broneeringu ID:</b> ${escapeHtml_(bookingId)}</p>
      <p><b>Staatus:</b> ootel</p>

      <h3>Ruum ja aeg</h3>
      <p><b>Rahvamaja:</b> ${escapeHtml_(payload.house || '')}</p>
      <p><b>Ruum:</b> ${escapeHtml_(payload.roomName || '')}</p>
      <p><b>Kuupäev:</b> ${escapeHtml_(payload.date || '')}</p>
      <p><b>Kellaaeg:</b> ${escapeHtml_(payload.startTime || '')}–${escapeHtml_(payload.endTime || '')}</p>
      <p><b>Arvestuslik kestus:</b> ${escapeHtml_(String(payload.hours || ''))} h</p>

      <h3>Sündmuse info</h3>
      <p><b>Sündmuse liik:</b> ${escapeHtml_(payload.eventType || '')}</p>
      <p><b>Osalejate arv:</b> ${escapeHtml_(String(payload.participants || ''))}</p>
      <p><b>Kasutus:</b> ${payload.publicEvent ? 'avalik sündmus' : 'era- või kinnine sündmus'}</p>

      <h3>Klient</h3>
      <p><b>Nimi:</b> ${escapeHtml_(payload.name || '')}</p>
      <p><b>E-post:</b> ${escapeHtml_(payload.email || '')}</p>
      <p><b>Telefon:</b> ${escapeHtml_(payload.phone || '')}</p>

      <h3>Rendi hinna sees</h3>
      ${included}

      <h3>Eraldi kokkuleppel</h3>
      ${agreement}

      <h3>Rendi hinna sees</h3>
      ${included}

      <h3>Eraldi kokkuleppel</h3>
      ${agreement}

      <h3>Valitud lisateenused</h3>
      ${services}

      <h3>Orienteeruv hind</h3>
      <table style="border-collapse: collapse;">
        <tr><td style="padding: 4px 12px 4px 0;">Ruumi kasutus:</td><td style="padding: 4px 0;"><b>${formatEuro_(payload.roomCost)}</b></td></tr>
        <tr><td style="padding: 4px 12px 4px 0;">Koristus ja ettevalmistus:</td><td style="padding: 4px 0;"><b>sisaldub ruumi rendihinnas</b></td></tr>
        <tr><td style="padding: 4px 12px 4px 0;">Valitud lisateenused:</td><td style="padding: 4px 0;"><b>${formatEuro_(payload.servicesTotal)}</b></td></tr>
        <tr><td style="padding: 8px 12px 4px 0; border-top: 1px solid #e5e7eb;">Kokku:</td><td style="padding: 8px 0 4px 0; border-top: 1px solid #e5e7eb;"><b>${formatEuro_(payload.estimatedTotal)}</b></td></tr>
      </table>

      <h3>Lisainfo</h3>
      <p>${escapeHtml_(payload.notes || '-')}</p>
      <p style="margin-top: 24px; color: #6b7280;"><i>${escapeHtml_(payload.disclaimer || '')}</i></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p><b>Järgmine samm:</b> kontrolli ruumi saadavust, kinnita tingimused ja vasta kliendile.</p>
    </div>
  `
}

function buildClientEmailBody_(payload, bookingId) {
  const services = buildServicesHtml_(payload.selectedServices)
  const included = buildListHtml_(payload.includedItems, 'Info puudub.')
  const agreement = buildListHtml_(payload.agreementItems, 'Eraldi kokkuleppeid ei märgitud.')

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>Sinu ruumi kasutamise soov on kätte saadud.</h2>
      <p>Tere, ${escapeHtml_(payload.name || '')}!</p>
      <p>Aitäh. Sinu ruumi kasutamise soov on kätte saadud.</p>
      <p><b>Broneeringu ID:</b> ${escapeHtml_(bookingId)}</p>

      <h3>Sinu päringu kokkuvõte</h3>
      <p><b>Rahvamaja:</b> ${escapeHtml_(payload.house || '')}</p>
      <p><b>Ruum:</b> ${escapeHtml_(payload.roomName || '')}</p>
      <p><b>Kuupäev:</b> ${escapeHtml_(payload.date || '')}</p>
      <p><b>Kellaaeg:</b> ${escapeHtml_(payload.startTime || '')}–${escapeHtml_(payload.endTime || '')}</p>
      <p><b>Sündmuse liik:</b> ${escapeHtml_(payload.eventType || '')}</p>
      <p><b>Osalejate arv:</b> ${escapeHtml_(String(payload.participants || ''))}</p>

      <h3>Rendi hinna sees</h3>
      ${included}

      <h3>Eraldi kokkuleppel</h3>
      ${agreement}

      <h3>Rendi hinna sees</h3>
      ${included}

      <h3>Eraldi kokkuleppel</h3>
      ${agreement}

      <h3>Valitud lisateenused</h3>
      ${services}

      <h3>Orienteeruv hind</h3>
      <p><b>${formatEuro_(payload.estimatedTotal)}</b></p>
      <p>Koristus ja ettevalmistus sisaldub ruumi rendihinnas.</p>
      <p style="margin-top: 20px;"><b>NB!</b> See ei ole veel lõplik kinnitatud broneering. Rahvamaja töötaja kontrollib ruumi saadavust, täpsustab vajadused ning kinnitab lõpliku hinna ja tingimused.</p>
      <p style="margin-top: 24px; color: #6b7280;"><i>${escapeHtml_(payload.disclaimer || '')}</i></p>
      <p style="margin-top: 24px;">Heade soovidega<br>${ORGANIZATION_NAME}</p>
    </div>
  `
}

function buildListHtml_(items, emptyText) {
  if (!items || items.length === 0) {
    return `<p>${escapeHtml_(emptyText || '-')}</p>`
  }

  const listItems = items
    .map(item => `<li>${escapeHtml_(item)}</li>`)
    .join('')

  return `<ul>${listItems}</ul>`
}

function buildServicesHtml_(selectedServices) {
  if (!selectedServices || selectedServices.length === 0) {
    return '<p>Lisateenuseid ei valitud.</p>'
  }

  const items = selectedServices
    .map(item => `<li>${escapeHtml_(item.label || '')}: ${formatEuro_(item.total)}</li>`)
    .join('')

  return `<ul>${items}</ul>`
}

function formatSelectedServicesForSheet_(selectedServices) {
  if (!selectedServices || selectedServices.length === 0) return 'Lisateenuseid ei valitud'
  return selectedServices.map(item => `${item.label || ''} (${formatEuro_(item.total)})`).join('; ')
}

function formatEuro_(value) {
  return `${Number(value || 0).toFixed(2).replace('.', ',')} €`
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}
