// BEGIN GENERATED ROOM CONFIG
const ROOM_CONFIG = {
  "rannu-saal": {
    "houseId": "rannu",
    "house": "Rannu rahvamaja",
    "name": "Suur saal",
    "bufferBeforeMinutes": 60,
    "bufferAfterMinutes": 60
  },
  "rannu-vaike-saal": {
    "houseId": "rannu",
    "house": "Rannu rahvamaja",
    "name": "Väike saal / koosolekuruum",
    "bufferBeforeMinutes": 30,
    "bufferAfterMinutes": 30
  },
  "konguta-saal": {
    "houseId": "konguta",
    "house": "Konguta rahvamaja",
    "name": "Saal",
    "bufferBeforeMinutes": 60,
    "bufferAfterMinutes": 60
  },
  "konguta-valiala": {
    "houseId": "konguta",
    "house": "Konguta rahvamaja",
    "name": "Väliala / laululava ümbrus",
    "bufferBeforeMinutes": 120,
    "bufferAfterMinutes": 120
  }
}
// END GENERATED ROOM CONFIG

/**
 * Kultuuripesa broneeringute ja ruumikasutuste API.
 *
 * Töövoog:
 * - Avalik veeb saadab broneeringu Apps Scripti kaudu Google Sheeti.
 * - PIN-koodiga adminivaade loeb ootel/kinnitatud broneeringuid samast Sheetist.
 * - Admin kinnitab/tühistab broneeringu veebivaates.
 * - Kinnitatud broneering ilmub avalikku ruumikalendrisse, sest veeb loeb kinnitatud read Sheetist.
 */

const SHEET_ID = '15eeMfVjiQzbrEVTgstIcEykaj6sSy3f9-hnNAv6yx3I'
const SHEET_NAME = 'Broneeringud'

const DEFAULT_EMAIL = 'meeliskylaots@gmail.com'
const RANNU_EMAIL = 'meeliskylaots@gmail.com'
const KONGUTA_EMAIL = 'meeliskylaots@gmail.com'
const ORGANIZATION_NAME = 'Kultuuripesa'

const HEADERS = [
  'Sisestamise aeg',
  'Broneeringu ID',
  'Tüüp',
  'Staatus',
  'Kollektiiv',
  'Juhendaja ID',
  'Rahvamaja',
  'Ruum',
  'RoomID',
  'Kuupäev',
  'Algus',
  'Lõpp',
  'Ruum kinni alates',
  'Ruum kinni kuni',
  'Puhver enne (min)',
  'Puhver pärast (min)',
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
  'Avaliku kalendri tekst',
  'Kuvamise viis',
  'Kinnitamise aeg',
  'Kinnituskiri saadetud'
]

const INSTRUCTOR_SHEET_NAME = 'Juhendajad'
const INSTRUCTOR_HEADERS = ['Juhendaja ID', 'Nimi', 'E-post', 'PIN', 'Kollektiiv', 'Rahvamaja', 'Ruum', 'RoomID', 'Lubatud RoomID-d', 'Aktiivne']
const DEFAULT_INSTRUCTORS = []

function requireStaff_(pin) {
  const properties = PropertiesService.getScriptProperties()
  const directorPin = properties.getProperty('DIRECTOR_PIN')
  const adminPin = properties.getProperty('ADMIN_PIN')
  if (directorPin && String(pin || '') === directorPin) return 'director'
  if (adminPin && String(pin || '') === adminPin) return 'admin'
  throw new Error('Töötaja ligipääs puudub või PIN ei sobi.')
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {}
  const action = params.action || 'ping'
  const callback = params.callback

  let data
  try {
    if (action === 'list') {
      data = listBookings_(params.pin)
    } else if (action === 'adminAuth') {
      data = { ok: true, role: requireStaff_(params.pin) }
    } else if (action === 'authInstructor') {
      data = authInstructor_(params.pin)
    } else {
      data = { ok: true, message: 'Kultuuripesa Apps Script töötab.' }
    }
  } catch (error) {
    data = { ok: false, error: String(error) }
  }

  if (callback && !/^[$A-Z_][0-9A-Z_$]*$/i.test(callback)) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Vigane callback.' }))
      .setMimeType(ContentService.MimeType.JSON)
  }
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(data)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT)
  }

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  let lock
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Päringu sisu puudub.')
    }

    const payload = JSON.parse(e.postData.contents)
    lock = LockService.getScriptLock()
    if (!lock.tryLock(10000)) throw new Error('Teine salvestus on pooleli. Proovi uuesti.')

    if (payload.action === 'updateStatus') {
      requireStaff_(payload.adminPin)
      return jsonResponse_(updateStatus_(payload))
    }

    if (payload.action === 'createUsage') {
      return jsonResponse_(createUsage_(payload))
    }

    return jsonResponse_(createBooking_(payload))
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error) })
  } finally {
    if (lock && lock.hasLock()) {
      SpreadsheetApp.flush()
      lock.releaseLock()
    }
  }
}

function validateRoomTime_(payload) {
  const room = Object.prototype.hasOwnProperty.call(ROOM_CONFIG, payload.roomId) ? ROOM_CONFIG[payload.roomId] : null
  if (!room) throw new Error('Ruum ei ole broneerimiseks avatud.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(payload.date || ''))) throw new Error('Kuupäev ei sobi.')
  const parsed = new Date(payload.date + 'T12:00:00Z')
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== payload.date) throw new Error('Kuupäev ei sobi.')
  const today = Utilities.formatDate(new Date(), 'Europe/Tallinn', 'yyyy-MM-dd')
  if (payload.date < today) throw new Error('Minevikku ei saa broneeringut lisada.')
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/
  if (!timePattern.test(String(payload.startTime)) || !timePattern.test(String(payload.endTime))) throw new Error('Kellaaeg ei sobi.')
  const minutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
  const start = minutes(payload.startTime)
  const end = minutes(payload.endTime)
  if (end <= start) throw new Error('Lõpuaeg peab olema algusajast hilisem.')
  const format = (value) => String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0')
  payload.house = room.house
  payload.roomName = room.name
  payload.bufferBeforeMinutes = room.bufferBeforeMinutes
  payload.bufferAfterMinutes = room.bufferAfterMinutes
  payload.reservedStartTime = format(Math.max(0, start - room.bufferBeforeMinutes))
  payload.reservedEndTime = format(Math.min(1440, end + room.bufferAfterMinutes))
}

function assertRoomAvailable_(payload, excludeId) {
  const bookings = listBookings_().usages
  const conflict = bookings.some((item) => item.roomId === payload.roomId && item.date === payload.date &&
    String(item.bookingId) !== String(excludeId || '') &&
    (item.reservedStartTime || item.startTime) < payload.reservedEndTime &&
    (item.reservedEndTime || item.endTime) > payload.reservedStartTime)
  if (conflict) throw new Error('Valitud ruum on sellel ajal juba kasutuses või ootel. Vali teine aeg.')
}

function safeCell_(value) {
  return typeof value === 'string' && /^[=+@-]/.test(value) ? "'" + value : value
}

function testSetup() {
  const sheet = getOrCreateSheet_()
  ensureHeader_(sheet)
  ensureInstructorSheet_()
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: 'Kultuuripesa Apps Script töötab',
    htmlBody: '<h2>Test õnnestus</h2><p>Google Sheet on leitav ja e-kirjade saatmine töötab.</p>',
    name: ORGANIZATION_NAME
  })
}

function createBooking_(payload) {
  validatePayload_(payload)
  validateRoomTime_(payload)
  assertRoomAvailable_(payload)
  payload.status = 'ootel'

  const sheet = getOrCreateSheet_()
  const headers = ensureHeader_(sheet)
  const bookingId = payload.bookingId || createBookingId_()
  const selectedServicesText = formatSelectedServicesForSheet_(payload.selectedServices)

  const rowObject = {
    'Sisestamise aeg': new Date(),
    'Broneeringu ID': bookingId,
    'Tüüp': payload.type || 'broneering',
    'Staatus': payload.status || 'ootel',
    'Kollektiiv': payload.collective || '',
    'Juhendaja ID': payload.instructorId || '',
    'Rahvamaja': payload.house || '',
    'Ruum': payload.roomName || '',
    'RoomID': payload.roomId || '',
    'Kuupäev': payload.date || '',
    'Algus': payload.startTime || '',
    'Lõpp': payload.endTime || '',
    'Ruum kinni alates': payload.reservedStartTime || '',
    'Ruum kinni kuni': payload.reservedEndTime || '',
    'Puhver enne (min)': payload.bufferBeforeMinutes || '',
    'Puhver pärast (min)': payload.bufferAfterMinutes || '',
    'Tunnid': payload.hours || '',
    'Sündmuse liik': payload.eventType || '',
    'Osalejad': payload.participants || '',
    'Kasutus': payload.publicEvent ? 'avalik sündmus' : 'era- või kinnine sündmus',
    'Nimi': payload.name || '',
    'E-post': payload.email || '',
    'Telefon': payload.phone || '',
    'Valitud lisateenused': selectedServicesText,
    'Ruumi hind': Number(payload.roomCost || 0),
    'Koristus ja ettevalmistus': 'sisaldub ruumi rendihinnas',
    'Teenused kokku': Number(payload.servicesTotal || 0),
    'Orienteeruv koguhind': Number(payload.estimatedTotal || 0),
    'Lisainfo': payload.notes || '',
    'Märkus hinna kohta': payload.disclaimer || '',
    'Avaliku kalendri tekst': payload.publicTitle || (payload.publicEvent ? (payload.eventType || 'Avalik sündmus') : 'Ruum broneeritud'),
    'Kuvamise viis': payload.displayMode || (payload.publicEvent ? 'full' : 'neutral'),
    'Kinnitamise aeg': '',
    'Kinnituskiri saadetud': ''
  }

  sheet.appendRow(headers.map((header) => safeCell_(rowObject[header] !== undefined ? rowObject[header] : '')))

  const staffEmail = getStaffEmail_(payload.house)
  sendStaffEmail_(staffEmail, payload, bookingId)
  sendClientReceivedEmail_(payload, bookingId)

  return { ok: true, bookingId, message: 'Broneeringusoov saadeti edukalt.' }
}

function createUsage_(payload) {
  if (payload.instructorId === 'admin' || payload.instructorId === 'director') {
    payload.instructorId = requireStaff_(payload.adminPin)
  } else {
    const authenticated = authInstructor_(payload.instructorPin)
    if (!authenticated.ok || authenticated.instructor.id !== payload.instructorId ||
        !authenticated.instructor.allowedRoomIds.includes(payload.roomId)) {
      throw new Error('Juhendaja ligipääs puudub või ruum ei ole lubatud.')
    }
    payload.status = 'ootel'
    payload.name = authenticated.instructor.name
    payload.email = authenticated.instructor.email
    payload.collective = authenticated.instructor.collective
  }
  const requiredFields = ['house', 'roomName', 'roomId', 'date', 'startTime', 'endTime', 'name', 'email', 'publicTitle']
  const missing = requiredFields.filter(field => !payload[field])
  if (missing.length > 0) throw new Error('Puuduvad kohustuslikud väljad: ' + missing.join(', '))
  validateRoomTime_(payload)
  assertRoomAvailable_(payload)

  const sheet = getOrCreateSheet_()
  const headers = ensureHeader_(sheet)
  const usageId = payload.bookingId || payload.id || createUsageId_()

  const rowObject = {
    'Sisestamise aeg': new Date(),
    'Broneeringu ID': usageId,
    'Tüüp': payload.type || 'juhendaja sisestus',
    'Staatus': payload.status || 'ootel',
    'Kollektiiv': payload.collective || '',
    'Juhendaja ID': payload.instructorId || '',
    'Rahvamaja': payload.house || '',
    'Ruum': payload.roomName || '',
    'RoomID': payload.roomId || '',
    'Kuupäev': payload.date || '',
    'Algus': payload.startTime || '',
    'Lõpp': payload.endTime || '',
    'Ruum kinni alates': payload.reservedStartTime || payload.startTime || '',
    'Ruum kinni kuni': payload.reservedEndTime || payload.endTime || '',
    'Puhver enne (min)': payload.bufferBeforeMinutes || '',
    'Puhver pärast (min)': payload.bufferAfterMinutes || '',
    'Tunnid': payload.hours || '',
    'Sündmuse liik': payload.eventType || payload.type || '',
    'Osalejad': payload.participants || '',
    'Kasutus': payload.publicEvent ? 'avalik sündmus' : 'sisemine kasutus',
    'Nimi': payload.name || '',
    'E-post': payload.email || '',
    'Telefon': payload.phone || '',
    'Valitud lisateenused': '',
    'Ruumi hind': '',
    'Koristus ja ettevalmistus': '',
    'Teenused kokku': '',
    'Orienteeruv koguhind': '',
    'Lisainfo': payload.notes || '',
    'Märkus hinna kohta': payload.disclaimer || '',
    'Avaliku kalendri tekst': payload.publicTitle || 'Ringitegevus',
    'Kuvamise viis': payload.displayMode || 'category',
    'Kinnitamise aeg': '',
    'Kinnituskiri saadetud': ''
  }

  sheet.appendRow(headers.map((header) => safeCell_(rowObject[header] !== undefined ? rowObject[header] : '')))

  MailApp.sendEmail({
    to: DEFAULT_EMAIL,
    subject: `Uus juhendaja sisestus: ${payload.collective || payload.name || ''}`,
    htmlBody: `<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;"><h2>Uus juhendaja sisestus</h2><p><b>ID:</b> ${escapeHtml_(usageId)}</p><p><b>Kollektiiv:</b> ${escapeHtml_(payload.collective || '')}</p><p><b>Aeg:</b> ${escapeHtml_(payload.date || '')} ${escapeHtml_(payload.startTime || '')}–${escapeHtml_(payload.endTime || '')}</p><p><b>Ruum:</b> ${escapeHtml_(payload.house || '')} / ${escapeHtml_(payload.roomName || '')}</p><p><b>Avaliku kalendri tekst:</b> ${escapeHtml_(payload.publicTitle || '')}</p><p>Sisesta Kultuuripesa töölauda ja kinnita või muuda kirje.</p></div>`,
    name: ORGANIZATION_NAME
  })

  return { ok: true, bookingId: usageId, message: 'Sisestus saadeti kinnitamiseks.' }
}

function authInstructor_(pin) {
  const normalizedPin = String(pin || '').trim()
  if (!normalizedPin) return { ok: false, error: 'PIN puudub.' }

  const sheet = ensureInstructorSheet_()
  const values = sheet.getDataRange().getValues()
  const headers = values[0]
  const map = headerMap_(headers)

  for (let i = 1; i < values.length; i += 1) {
    const row = values[i]
    const active = String(row[map['Aktiivne']] || '').toLowerCase()
    const rowPin = String(row[map['PIN']] || '').trim()
    if (rowPin === normalizedPin && !['ei', 'false', '0'].includes(active)) {
      return {
        ok: true,
        instructor: {
          id: row[map['Juhendaja ID']] || '',
          name: row[map['Nimi']] || '',
          email: row[map['E-post']] || '',
          collective: row[map['Kollektiiv']] || '',
          house: row[map['Rahvamaja']] || '',
          room: row[map['Ruum']] || '',
          roomId: row[map['RoomID']] || '',
          allowedRoomIds: String(row[map['Lubatud RoomID-d']] || row[map['RoomID']] || '').split(',').map(function(item) { return item.trim() }).filter(Boolean),
          active: true
        }
      }
    }
  }

  return { ok: false, error: 'Juhendajat ei leitud või PIN ei sobi.' }
}

function ensureInstructorSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID)
  let sheet = ss.getSheetByName(INSTRUCTOR_SHEET_NAME)
  if (!sheet) sheet = ss.insertSheet(INSTRUCTOR_SHEET_NAME)

  const lastColumn = Math.max(sheet.getLastColumn(), 1)
  const existing = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(String) : []
  if (existing.length === 0) {
    sheet.getRange(1, 1, 1, INSTRUCTOR_HEADERS.length).setValues([INSTRUCTOR_HEADERS])
    if (DEFAULT_INSTRUCTORS.length) sheet.getRange(2, 1, DEFAULT_INSTRUCTORS.length, INSTRUCTOR_HEADERS.length).setValues(DEFAULT_INSTRUCTORS)
    sheet.setFrozenRows(1)
    return sheet
  }

  const headers = existing.slice()
  INSTRUCTOR_HEADERS.forEach((header) => { if (!headers.includes(header)) headers.push(header) })
  if (headers.length !== existing.length) sheet.getRange(1, 1, 1, headers.length).setValues([headers])
  sheet.setFrozenRows(1)
  return sheet
}

function createUsageId_() {
  const now = new Date()
  const datePart = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss')
  const randomPart = Math.floor(Math.random() * 900 + 100)
  return `JR-${datePart}-${randomPart}`
}

function updateStatus_(payload) {
  if (!['kinnitatud', 'tühistatud'].includes(payload.status)) throw new Error('Staatus ei sobi.')
  const bookingId = payload.bookingId || payload.id
  if (!bookingId) throw new Error('Broneeringu ID puudub.')

  const sheet = getOrCreateSheet_()
  const headers = ensureHeader_(sheet)
  const map = headerMap_(headers)
  const values = sheet.getDataRange().getValues()
  const idCol = map['Broneeringu ID']
  if (idCol === undefined) throw new Error('Broneeringu ID veerg puudub.')

  for (let i = 1; i < values.length; i += 1) {
    if (String(values[i][idCol]) === String(bookingId)) {
      const rowNumber = i + 1
      if (payload.status === 'kinnitatud') {
        const booking = sheetRowToBooking_(rowToObject_(headers, values[i]), rowNumber)
        if (booking.status === 'tühistatud') throw new Error('Tühistatud kirjet ei saa uuesti kinnitada. Loo uus soov.')
        validateRoomTime_(booking)
        assertRoomAvailable_(booking, bookingId)
        setCell_(sheet, map, rowNumber, 'Ruum kinni alates', booking.reservedStartTime)
        setCell_(sheet, map, rowNumber, 'Ruum kinni kuni', booking.reservedEndTime)
      }
      setCell_(sheet, map, rowNumber, 'Staatus', payload.status || 'ootel')
      if (payload.publicTitle !== undefined) setCell_(sheet, map, rowNumber, 'Avaliku kalendri tekst', payload.publicTitle)
      if (payload.displayMode !== undefined) setCell_(sheet, map, rowNumber, 'Kuvamise viis', payload.displayMode)

      if (payload.status === 'kinnitatud') {
        setCell_(sheet, map, rowNumber, 'Kinnitamise aeg', new Date())
        const rowObj = rowToObject_(headers, sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0])
        const alreadySent = String(rowObj['Kinnituskiri saadetud'] || '').toLowerCase() === 'jah'
        if (!alreadySent && rowObj['E-post']) {
          sendClientConfirmedEmail_(rowObj)
          setCell_(sheet, map, rowNumber, 'Kinnituskiri saadetud', 'jah')
        }
      }

      return { ok: true, bookingId, status: payload.status || 'ootel' }
    }
  }

  throw new Error('Broneeringut ei leitud: ' + bookingId)
}

function listBookings_(pin) {
  const sheet = getOrCreateSheet_()
  const headers = ensureHeader_(sheet)
  const values = sheet.getDataRange().getValues()
  const bookings = []

  for (let i = 1; i < values.length; i += 1) {
    const row = rowToObject_(headers, values[i])
    if (!row['Broneeringu ID']) continue
    bookings.push(sheetRowToBooking_(row, i + 1))
  }

  const usages = bookings
    .filter((item) => !['tühistatud', 'tuhistatud', 'cancelled'].includes(String(item.status || '').toLowerCase()))
    .map((item) => ({
      id: item.id, bookingId: item.bookingId, type: item.type, status: item.status,
      house: item.house, roomName: item.roomName, roomId: item.roomId, date: item.date,
      dateISO: item.dateISO, startTime: item.startTime, endTime: item.endTime,
      reservedStartTime: item.reservedStartTime, reservedEndTime: item.reservedEndTime,
      eventType: item.eventType, publicEvent: item.publicEvent, publicTitle: item.publicTitle,
      displayMode: item.displayMode
    }))
  let staff = false
  try { staff = Boolean(requireStaff_(pin)) } catch (error) { /* Public calendar */ }
  return { ok: true, bookings: staff ? bookings : [], usages }
}

function sheetRowToBooking_(row, rowNumber) {
  const useText = String(row['Kasutus'] || '').toLowerCase()
  const status = String(row['Staatus'] || 'ootel').toLowerCase()
  return {
    rowNumber,
    bookingId: row['Broneeringu ID'] || '',
    id: row['Broneeringu ID'] || '',
    type: row['Tüüp'] || 'broneering',
    status,
    collective: row['Kollektiiv'] || '',
    instructorId: row['Juhendaja ID'] || '',
    house: row['Rahvamaja'] || '',
    roomName: row['Ruum'] || '',
    room: row['Ruum'] || '',
    roomId: row['RoomID'] || '',
    date: toIsoDate_(row['Kuupäev']),
    dateISO: toIsoDate_(row['Kuupäev']),
    startTime: normalizeTime_(row['Algus']),
    endTime: normalizeTime_(row['Lõpp']),
    reservedStartTime: normalizeTime_(row['Ruum kinni alates']),
    reservedEndTime: normalizeTime_(row['Ruum kinni kuni']),
    bufferBeforeMinutes: row['Puhver enne (min)'] || '',
    bufferAfterMinutes: row['Puhver pärast (min)'] || '',
    hours: row['Tunnid'] || '',
    eventType: row['Sündmuse liik'] || '',
    participants: row['Osalejad'] || '',
    publicEvent: useText.includes('avalik'),
    name: row['Nimi'] || '',
    email: row['E-post'] || '',
    phone: row['Telefon'] || '',
    selectedServicesText: row['Valitud lisateenused'] || '',
    roomCost: row['Ruumi hind'] || 0,
    servicesTotal: row['Teenused kokku'] || 0,
    estimatedTotal: row['Orienteeruv koguhind'] || 0,
    notes: row['Lisainfo'] || '',
    disclaimer: row['Märkus hinna kohta'] || '',
    publicTitle: row['Avaliku kalendri tekst'] || (useText.includes('avalik') ? (row['Sündmuse liik'] || 'Avalik sündmus') : 'Ruum broneeritud'),
    calendarText: row['Avaliku kalendri tekst'] || '',
    displayMode: row['Kuvamise viis'] || (useText.includes('avalik') ? 'full' : 'neutral')
  }
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID)
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME)
  return sheet
}

function ensureHeader_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1)
  const existing = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(String) : []

  if (existing.length === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    sheet.setFrozenRows(1)
    return HEADERS.slice()
  }

  const headers = existing.slice()
  HEADERS.forEach((header) => {
    if (!headers.includes(header)) headers.push(header)
  })

  if (headers.length !== existing.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
  }
  sheet.setFrozenRows(1)
  return headers
}

function headerMap_(headers) {
  const map = {}
  headers.forEach((header, index) => { map[header] = index })
  return map
}

function rowToObject_(headers, row) {
  const obj = {}
  headers.forEach((header, index) => { obj[header] = row[index] })
  return obj
}

function setCell_(sheet, map, rowNumber, header, value) {
  if (map[header] === undefined) return
  sheet.getRange(rowNumber, map[header] + 1).setValue(safeCell_(value))
}

function validatePayload_(payload) {
  const requiredFields = ['house', 'roomName', 'date', 'startTime', 'endTime', 'eventType', 'name', 'email', 'phone']
  const missing = requiredFields.filter(field => !payload[field])
  if (missing.length > 0) throw new Error('Puuduvad kohustuslikud väljad: ' + missing.join(', '))
  if (!isValidEmail_(payload.email)) throw new Error('Kliendi e-posti aadress ei ole korrektne.')
}

function createBookingId_() {
  const now = new Date()
  const datePart = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss')
  const randomPart = Math.floor(Math.random() * 900 + 100)
  return `BR-${datePart}-${randomPart}`
}

function getStaffEmail_(house) {
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

function sendClientReceivedEmail_(payload, bookingId) {
  if (!payload.email || !isValidEmail_(payload.email)) return
  MailApp.sendEmail({
    to: payload.email,
    subject: 'Sinu ruumi kasutamise soov on kätte saadud.',
    htmlBody: buildClientReceivedEmailBody_(payload, bookingId),
    name: ORGANIZATION_NAME
  })
}

function sendClientConfirmedEmail_(row) {
  const email = row['E-post']
  if (!email || !isValidEmail_(email)) return
  MailApp.sendEmail({
    to: email,
    subject: 'Sinu ruumi kasutamise soov on kinnitatud.',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2>Sinu ruumi kasutamise soov on kinnitatud.</h2>
        <p>Tere, ${escapeHtml_(row['Nimi'] || '')}!</p>
        <p>Kinnitame ruumi kasutamise järgmiste andmetega:</p>
        <p><b>Broneeringu ID:</b> ${escapeHtml_(row['Broneeringu ID'] || '')}</p>
        <p><b>Rahvamaja:</b> ${escapeHtml_(row['Rahvamaja'] || '')}</p>
        <p><b>Ruum:</b> ${escapeHtml_(row['Ruum'] || '')}</p>
        <p><b>Kuupäev:</b> ${escapeHtml_(toIsoDate_(row['Kuupäev']))}</p>
        <p><b>Kellaaeg:</b> ${escapeHtml_(normalizeTime_(row['Algus']))}–${escapeHtml_(normalizeTime_(row['Lõpp']))}</p>
        <p><b>Ruum on broneerimiseks suletud:</b> ${escapeHtml_(normalizeTime_(row['Ruum kinni alates']))}–${escapeHtml_(normalizeTime_(row['Ruum kinni kuni']))}</p>
        <p><b>Orienteeruv hind:</b> ${escapeHtml_(String(row['Orienteeruv koguhind'] || ''))} €</p>
        <p>Arve ja lepingu täpsemad sammud kinnitab rahvamaja töötaja.</p>
        <p style="margin-top: 24px;">Heade soovidega<br>${ORGANIZATION_NAME}</p>
      </div>
    `,
    name: ORGANIZATION_NAME
  })
}

function buildStaffEmailBody_(payload, bookingId) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>Uus ruumi kasutamise soov</h2>
      <p><b>Broneeringu ID:</b> ${escapeHtml_(bookingId)}</p>
      <p><b>Staatus:</b> ootel</p>
      <p><b>Rahvamaja:</b> ${escapeHtml_(payload.house || '')}</p>
      <p><b>Ruum:</b> ${escapeHtml_(payload.roomName || '')}</p>
      <p><b>Kuupäev:</b> ${escapeHtml_(payload.date || '')}</p>
      <p><b>Kellaaeg:</b> ${escapeHtml_(payload.startTime || '')}–${escapeHtml_(payload.endTime || '')}</p>
      <p><b>Broneerimiseks suletud:</b> ${escapeHtml_(payload.reservedStartTime || payload.startTime || '')}–${escapeHtml_(payload.reservedEndTime || payload.endTime || '')}</p>
      <p><b>Klient:</b> ${escapeHtml_(payload.name || '')}, ${escapeHtml_(payload.email || '')}, ${escapeHtml_(payload.phone || '')}</p>
      <p><b>Orienteeruv hind:</b> ${formatEuro_(payload.estimatedTotal)}</p>
      <p><b>Lisainfo:</b> ${escapeHtml_(payload.notes || '-')}</p>
      <p>Broneeringut saab kinnitada Kultuuripesa töötaja vaates.</p>
    </div>
  `
}

function buildClientReceivedEmailBody_(payload, bookingId) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>Sinu ruumi kasutamise soov on kätte saadud.</h2>
      <p>Tere, ${escapeHtml_(payload.name || '')}!</p>
      <p>Aitäh. Sinu ruumi kasutamise soov on kätte saadud ja ootab rahvamaja kinnitust.</p>
      <p><b>Broneeringu ID:</b> ${escapeHtml_(bookingId)}</p>
      <p><b>Rahvamaja:</b> ${escapeHtml_(payload.house || '')}</p>
      <p><b>Ruum:</b> ${escapeHtml_(payload.roomName || '')}</p>
      <p><b>Kuupäev:</b> ${escapeHtml_(payload.date || '')}</p>
      <p><b>Kellaaeg:</b> ${escapeHtml_(payload.startTime || '')}–${escapeHtml_(payload.endTime || '')}</p>
      <p><b>Orienteeruv hind:</b> ${formatEuro_(payload.estimatedTotal)}</p>
      <p><b>NB!</b> See ei ole veel lõplik kinnitatud broneering. Rahvamaja töötaja vaatab soovi üle ja saadab kinnituse.</p>
      <p style="margin-top: 24px;">Heade soovidega<br>${ORGANIZATION_NAME}</p>
    </div>
  `
}

function formatSelectedServicesForSheet_(selectedServices) {
  if (!selectedServices || selectedServices.length === 0) return 'Lisateenuseid ei valitud'
  return selectedServices.map(item => `${item.label || ''} (${formatEuro_(item.total)})`).join('; ')
}

function formatEuro_(value) {
  return `${Number(value || 0).toFixed(2).replace('.', ',')} €`
}

function toIsoDate_(value) {
  if (!value) return ''
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  }
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const date = new Date(text)
  if (!Number.isNaN(date.getTime())) return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  return text
}

function normalizeTime_(value) {
  if (!value && value !== 0) return ''
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm')
  }
  const text = String(value)
  const match = text.match(/(\d{1,2}):(\d{2})/)
  if (match) return `${String(match[1]).padStart(2, '0')}:${match[2]}`
  return text
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
