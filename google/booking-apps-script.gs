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
 * - Sessionipõhine töötajate töölaud loeb ootel/kinnitatud broneeringuid samast Sheetist.
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
  'Seeria ID',
  'Märkus hinna kohta',
  'Avaliku kalendri tekst',
  'Kuvamise viis',
  'Kinnitamise aeg',
  'Kinnituskiri saadetud'
]

const USER_SHEET_NAME = 'Kasutajad'
const USER_HEADERS = [
  'Kasutaja ID', 'Nimi', 'E-post', 'Roll', 'Parooli sool', 'Parooli tuletis',
  'Kollektiiv', 'Rahvamaja', 'Ruum', 'RoomID', 'Lubatud RoomID-d', 'Telefon', 'Koduleht', 'Sotsiaalmeedia', 'Aktiivne',
  'Loodud', 'Viimane sisselogimine', 'Ebaõnnestunud katsed', 'Blokeeritud kuni',
  'Parooli muutmise aeg'
]
const PASSWORD_ITERATIONS = 150000
const SESSION_TTL_SECONDS = 2 * 60 * 60
const CHALLENGE_TTL_SECONDS = 5 * 60
const LOCKOUT_THRESHOLD = 5
const LOCKOUT_SECONDS = 15 * 60

const COLLECTIVE_SHEET_NAME = 'Kollektiivid'
const COLLECTIVE_HEADERS = [
  'Kollektiivi ID', 'Nimi', 'Juhi kasutaja ID', 'Juhi e-post',
  'Rahvamaja', 'Ruum', 'Proovipäev', 'Algus', 'Lõpp', 'Kontakt e-post', 'Telefon', 'Koduleht', 'Sotsiaalmeedia', 'Kirjeldus', 'Aktiivne'
]

function normalizeEmail_(value) {
  return String(value || '').trim().toLowerCase()
}

function randomToken_() {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      Utilities.getUuid() + '|' + Utilities.getUuid() + '|' + new Date().getTime() + '|' + Math.random(),
      Utilities.Charset.UTF_8
    )
  ).replace(/=+$/, '')
}

function digestBase64_(value) {
  return Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || ''), Utilities.Charset.UTF_8)
  )
}

function constantTimeEqual_(left, right) {
  const a = String(left || '')
  const b = String(right || '')
  let result = a.length ^ b.length
  const length = Math.max(a.length, b.length)
  for (let i = 0; i < length; i += 1) {
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return result === 0
}

function usersSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID)
  let sheet = ss.getSheetByName(USER_SHEET_NAME)
  if (!sheet) sheet = ss.insertSheet(USER_SHEET_NAME)
  const lastColumn = Math.max(sheet.getLastColumn(), 1)
  const existing = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(String)
    : []
  if (existing.length === 0) {
    sheet.getRange(1, 1, 1, USER_HEADERS.length).setValues([USER_HEADERS])
    sheet.setFrozenRows(1)
    return sheet
  }
  const headers = existing.slice()
  USER_HEADERS.forEach((header) => { if (!headers.includes(header)) headers.push(header) })
  if (headers.length !== existing.length) sheet.getRange(1, 1, 1, headers.length).setValues([headers])
  sheet.setFrozenRows(1)
  return sheet
}

function userRows_() {
  const sheet = usersSheet_()
  const headers = ensureUsersHeader_(sheet)
  const values = sheet.getDataRange().getValues()
  return { sheet, headers, map: headerMap_(headers), values }
}

function ensureUsersHeader_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1)
  const existing = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(String)
    : []
  if (existing.length === 0) {
    sheet.getRange(1, 1, 1, USER_HEADERS.length).setValues([USER_HEADERS])
    sheet.setFrozenRows(1)
    return USER_HEADERS.slice()
  }
  const headers = existing.slice()
  USER_HEADERS.forEach((header) => { if (!headers.includes(header)) headers.push(header) })
  if (headers.length !== existing.length) sheet.getRange(1, 1, 1, headers.length).setValues([headers])
  sheet.setFrozenRows(1)
  return headers
}

function userFromRow_(headers, row, rowNumber) {
  const map = headerMap_(headers)
  const activeValue = String(row[map['Aktiivne']] === undefined ? 'jah' : row[map['Aktiivne']]).toLowerCase()
  const active = !['ei', 'false', '0', 'no'].includes(activeValue)
  return {
    rowNumber,
    id: String(row[map['Kasutaja ID']] || ''),
    name: String(row[map['Nimi']] || ''),
    email: normalizeEmail_(row[map['E-post']]),
    role: String(row[map['Roll']] || 'collective').toLowerCase(),
    salt: String(row[map['Parooli sool']] || ''),
    verifier: String(row[map['Parooli tuletis']] || ''),
    collective: String(row[map['Kollektiiv']] || ''),
    house: String(row[map['Rahvamaja']] || ''),
    room: String(row[map['Ruum']] || ''),
    roomId: String(row[map['RoomID']] || ''),
    phone: String(row[map['Telefon']] || ''),
    website: String(row[map['Koduleht']] || ''),
    socialMedia: String(row[map['Sotsiaalmeedia']] || ''),
    allowedRoomIds: String(row[map['Lubatud RoomID-d']] || row[map['RoomID']] || '').split(',').map((item) => item.trim()).filter(Boolean),
    active,
    createdAt: row[map['Loodud']] || '',
    lastLoginAt: row[map['Viimane sisselogimine']] || '',
    failedAttempts: Number(row[map['Ebaõnnestunud katsed']] || 0),
    lockedUntil: row[map['Blokeeritud kuni']] || '',
    passwordChangedAt: row[map['Parooli muutmise aeg']] || ''
  }
}

function publicUser_(user) {
  return {
    id: user.id, name: user.name, email: user.email, role: user.role,
    collective: user.collective, house: user.house, room: user.room,
    roomId: user.roomId, allowedRoomIds: user.allowedRoomIds, active: user.active,
    phone: user.phone, website: user.website, socialMedia: user.socialMedia,
    lastLoginAt: user.lastLoginAt, passwordChangedAt: user.passwordChangedAt
  }
}

function findUserByEmail_(email) {
  const target = normalizeEmail_(email)
  const { headers, values } = userRows_()
  for (let i = 1; i < values.length; i += 1) {
    const user = userFromRow_(headers, values[i], i + 1)
    if (user.email === target) return user
  }
  return null
}

function findUserById_(id) {
  const target = String(id || '')
  const { headers, values } = userRows_()
  for (let i = 1; i < values.length; i += 1) {
    const user = userFromRow_(headers, values[i], i + 1)
    if (user.id === target) return user
  }
  return null
}

function userCount_() {
  const { headers, values } = userRows_()
  return values.slice(1).filter((row) => String(row[headerMap_(headers)['Kasutaja ID']] || '').trim()).length
}

function sessionCacheKey_(token) {
  return 'kp:session:' + String(token || '')
}

function challengeCacheKey_(id) {
  return 'kp:challenge:' + String(id || '')
}

function operationCacheKey_(id) {
  return 'kp:operation:' + String(id || '')
}

function sessionUser_(token) {
  const raw = token ? CacheService.getScriptCache().get(sessionCacheKey_(token)) : null
  if (!raw) return null
  try {
    const session = JSON.parse(raw)
    const user = findUserById_(session.userId)
    if (!user || !user.active) return null
    return { ...user, token: String(token) }
  } catch (error) {
    return null
  }
}

function requireSession_(token) {
  const user = sessionUser_(token)
  if (!user) throw new Error('Sisselogimine on aegunud. Logi uuesti sisse.')
  return user
}

function requireManager_(token) {
  const user = requireSession_(token)
  if (!['director', 'admin'].includes(user.role)) throw new Error('Selle toimingu jaoks puudub õigus.')
  return user
}

function requireCollectiveEditor_(token) {
  const user = requireSession_(token)
  if (!['director', 'admin', 'collective'].includes(user.role)) throw new Error('Selle toimingu jaoks puudub õigus.')
  return user
}

function authChallenge_(email) {
  const user = findUserByEmail_(email)
  if (!user || !user.active) return { ok: false, error: 'Kasutajat ei leitud või ligipääs on suletud.' }
  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
    return { ok: false, error: 'Liiga palju ebaõnnestunud katseid. Proovi hiljem uuesti.' }
  }
  if (!user.salt || !user.verifier) return { ok: false, error: 'Kasutaja parool vajab juhataja seadistust.' }
  const challengeId = randomToken_()
  const nonce = randomToken_()
  CacheService.getScriptCache().put(
    challengeCacheKey_(challengeId),
    JSON.stringify({ userId: user.id, email: user.email, nonce }),
    CHALLENGE_TTL_SECONDS
  )
  return { ok: true, challengeId, nonce, salt: user.salt, iterations: PASSWORD_ITERATIONS }
}

function updateUserSecurity_(user, map, sheet, changes) {
  const row = user.rowNumber
  Object.keys(changes).forEach((header) => {
    if (map[header] !== undefined) sheet.getRange(row, map[header] + 1).setValue(safeCell_(changes[header]))
  })
}

function authLogin_(email, challengeId, proof) {
  const cache = CacheService.getScriptCache()
  const key = challengeCacheKey_(challengeId)
  const raw = cache.get(key)
  cache.remove(key)
  if (!raw) return { ok: false, error: 'Sisselogimine aegus. Proovi uuesti.' }
  const challenge = JSON.parse(raw)
  const user = findUserById_(challenge.userId)
  if (!user || user.email !== normalizeEmail_(email) || !user.active) return { ok: false, error: 'E-post või parool ei sobi.' }
  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) return { ok: false, error: 'Liiga palju ebaõnnestunud katseid. Proovi hiljem uuesti.' }
  const expected = digestBase64_(user.verifier + '|' + challenge.nonce)
  const { sheet, headers, map } = userRows_()
  if (!constantTimeEqual_(expected, proof)) {
    const nextFailed = user.failedAttempts + 1
    const lockedUntil = nextFailed >= LOCKOUT_THRESHOLD ? new Date(Date.now() + LOCKOUT_SECONDS * 1000) : ''
    updateUserSecurity_(user, map, sheet, { 'Ebaõnnestunud katsed': nextFailed, 'Blokeeritud kuni': lockedUntil })
    return { ok: false, error: lockedUntil ? 'Liiga palju ebaõnnestunud katseid. Proovi 15 minuti pärast uuesti.' : 'E-post või parool ei sobi.' }
  }
  const token = randomToken_()
  CacheService.getScriptCache().put(
    sessionCacheKey_(token),
    JSON.stringify({ userId: user.id }),
    SESSION_TTL_SECONDS
  )
  updateUserSecurity_(user, map, sheet, { 'Ebaõnnestunud katsed': 0, 'Blokeeritud kuni': '', 'Viimane sisselogimine': new Date() })
  const fresh = findUserById_(user.id)
  return { ok: true, sessionToken: token, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000, user: publicUser_(fresh) }
}

function bootstrapStatus_() {
  return { ok: true, needsSetup: userCount_() === 0 }
}

function bootstrapUser_(payload) {
  const setupToken = PropertiesService.getScriptProperties().getProperty('USER_SETUP_TOKEN')
  if (!setupToken || !constantTimeEqual_(setupToken, String(payload.setupToken || ''))) throw new Error('Kasutajate algseadistuse võti ei sobi.')
  if (userCount_() > 0) throw new Error('Esimene kasutaja on juba loodud.')
  validateUserPayload_(payload, true)
  const user = appendUser_(payload, 'director')
  PropertiesService.getScriptProperties().deleteProperty('USER_SETUP_TOKEN')
  return { ok: true, user: publicUser_(user) }
}

function validateUserPayload_(payload, isBootstrap) {
  const email = normalizeEmail_(payload.email)
  const name = String(payload.name || '').trim()
  if (!isValidEmail_(email)) throw new Error('Sisesta korrektne e-posti aadress.')
  if (name.length < 2 || name.length > 100) throw new Error('Sisesta kasutaja nimi.')
  if (!payload.passwordSalt || !payload.passwordVerifier) throw new Error('Parooli seadistus puudub.')
  if (String(payload.passwordVerifier).length < 40 || String(payload.passwordSalt).length < 16) throw new Error('Parooli tuletis ei sobi.')
  if (!isBootstrap && findUserByEmail_(email)) throw new Error('Selle e-postiga kasutaja on juba olemas.')
  const role = String(payload.role || 'collective').toLowerCase()
  if (!['director', 'admin', 'collective'].includes(role)) throw new Error('Roll ei sobi.')
  if (isBootstrap && role !== 'director') throw new Error('Esimene kasutaja peab olema juhataja.')
}

function roomIdsForUser_(payload) {
  const raw = Array.isArray(payload.allowedRoomIds)
    ? payload.allowedRoomIds
    : String(payload.allowedRoomIds || payload.roomId || '').split(',')
  const ids = raw.map((item) => String(item || '').trim()).filter(Boolean)
  const unique = ids.filter((id, index) => ids.indexOf(id) === index)
  const invalid = unique.filter((id) => !Object.prototype.hasOwnProperty.call(ROOM_CONFIG, id))
  if (invalid.length > 0) throw new Error('Kasutaja lubatud ruumide loendis on tundmatu RoomID: ' + invalid.join(', '))
  return unique
}

function appendUser_(payload, forcedRole) {
  const role = forcedRole || String(payload.role || 'collective').toLowerCase()
  const allowedRoomIds = roomIdsForUser_(payload)
  if (role === 'collective' && allowedRoomIds.length === 0) throw new Error('Kollektiivi juhile tuleb määrata vähemalt üks lubatud RoomID.')
  const sheet = usersSheet_()
  const headers = ensureUsersHeader_(sheet)
  const userId = 'USR-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 900 + 100)
  const values = {}
  values['Kasutaja ID'] = userId
  values['Nimi'] = String(payload.name || '').trim()
  values['E-post'] = normalizeEmail_(payload.email)
  values['Roll'] = role
  values['Parooli sool'] = payload.passwordSalt
  values['Parooli tuletis'] = payload.passwordVerifier
  values['Kollektiiv'] = payload.collective || ''
  values['Rahvamaja'] = payload.house || ''
  values['Ruum'] = payload.room || ''
  values['RoomID'] = payload.roomId || ''
  values['Lubatud RoomID-d'] = allowedRoomIds.join(',')
  values['Telefon'] = payload.phone || ''
  values['Koduleht'] = payload.website || ''
  values['Sotsiaalmeedia'] = payload.socialMedia || ''
  values['Aktiivne'] = 'jah'
  values['Loodud'] = new Date()
  values['Viimane sisselogimine'] = ''
  values['Ebaõnnestunud katsed'] = 0
  values['Blokeeritud kuni'] = ''
  values['Parooli muutmise aeg'] = new Date()
  sheet.appendRow(headers.map((header) => safeCell_(values[header] === undefined ? '' : values[header])))
  return findUserById_(userId)
}

function createUser_(payload) {
  const actor = requireManager_(payload.sessionToken)
  validateUserPayload_(payload, false)
  const role = String(payload.role || 'collective').toLowerCase()
  if (actor.role !== 'director' && role !== 'collective') {
    throw new Error('Administraator saab lisada ainult kollektiivi juhte.')
  }
  const user = appendUser_(payload, role)
  return { ok: true, user: publicUser_(user) }
}

function listUsers_(token) {
  const actor = requireManager_(token)
  const { headers, values } = userRows_()
  return { ok: true, users: values.slice(1).map((row, index) => publicUser_(userFromRow_(headers, row, index + 2))).filter((user) => user.id) }
}

function collectivesSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID)
  let sheet = ss.getSheetByName(COLLECTIVE_SHEET_NAME)
  if (!sheet) sheet = ss.insertSheet(COLLECTIVE_SHEET_NAME)
  const lastColumn = Math.max(sheet.getLastColumn(), 1)
  const existing = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(String)
    : []
  if (existing.length === 0) {
    sheet.getRange(1, 1, 1, COLLECTIVE_HEADERS.length).setValues([COLLECTIVE_HEADERS])
    sheet.setFrozenRows(1)
    return sheet
  }
  const headers = existing.slice()
  COLLECTIVE_HEADERS.forEach((header) => { if (!headers.includes(header)) headers.push(header) })
  if (headers.length !== existing.length) sheet.getRange(1, 1, 1, headers.length).setValues([headers])
  sheet.setFrozenRows(1)
  return sheet
}

function collectiveRows_() {
  const sheet = collectivesSheet_()
  const headers = ensureCollectiveHeader_(sheet)
  const values = sheet.getDataRange().getValues()
  return { sheet, headers, map: headerMap_(headers), values }
}

function ensureCollectiveHeader_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1)
  const existing = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(String)
    : []
  if (existing.length === 0) {
    sheet.getRange(1, 1, 1, COLLECTIVE_HEADERS.length).setValues([COLLECTIVE_HEADERS])
    sheet.setFrozenRows(1)
    return COLLECTIVE_HEADERS.slice()
  }
  const headers = existing.slice()
  COLLECTIVE_HEADERS.forEach((header) => { if (!headers.includes(header)) headers.push(header) })
  if (headers.length !== existing.length) sheet.getRange(1, 1, 1, headers.length).setValues([headers])
  sheet.setFrozenRows(1)
  return headers
}

function collectiveFromRow_(headers, row, rowNumber) {
  const map = headerMap_(headers)
  const activeValue = String(row[map['Aktiivne']] === undefined ? 'jah' : row[map['Aktiivne']]).toLowerCase()
  return {
    rowNumber,
    id: String(row[map['Kollektiivi ID']] || ''),
    name: String(row[map['Nimi']] || ''),
    leaderUserId: String(row[map['Juhi kasutaja ID']] || ''),
    leaderEmail: normalizeEmail_(row[map['Juhi e-post']]),
    house: String(row[map['Rahvamaja']] || ''),
    roomId: String(row[map['Ruum']] || ''),
    weekday: String(row[map['Proovipäev']] || ''),
    startTime: String(row[map['Algus']] || ''),
    endTime: String(row[map['Lõpp']] || ''),
    contactEmail: normalizeEmail_(row[map['Kontakt e-post']]),
    phone: String(row[map['Telefon']] || ''),
    website: String(row[map['Koduleht']] || ''),
    socialMedia: String(row[map['Sotsiaalmeedia']] || ''),
    description: String(row[map['Kirjeldus']] || ''),
    active: !['ei', 'false', '0', 'no'].includes(activeValue)
  }
}

function listCollectives_(token) {
  const actor = requireCollectiveEditor_(token)
  const { headers, values } = collectiveRows_()
  const all = values.slice(1)
    .map((row, index) => collectiveFromRow_(headers, row, index + 2))
    .filter((collective) => collective.id)
  return {
    ok: true,
    collectives: actor.role === 'collective'
      ? all.filter((collective) => collective.leaderUserId === actor.id)
      : all
  }
}

function validateCollectivePayload_(payload, existingId) {
  const name = String(payload.name || '').trim()
  if (name.length < 2 || name.length > 100) throw new Error('Sisesta kollektiivi nimi.')
  const leader = findUserById_(payload.leaderUserId)
  if (!leader || !leader.active || leader.role !== 'collective') throw new Error('Vali aktiivne kollektiivijuhi kasutaja.')
  if (!Object.prototype.hasOwnProperty.call(ROOM_CONFIG, String(payload.roomId || ''))) throw new Error('Vali kehtiv prooviruumi RoomID.')
  const weekday = Number(payload.weekday)
  if (weekday < 1 || weekday > 7) throw new Error('Proovipäev ei sobi.')
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/
  if (!timePattern.test(String(payload.startTime)) || !timePattern.test(String(payload.endTime))) throw new Error('Prooviaeg ei sobi.')
  const toMinutes = (value) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3))
  if (toMinutes(payload.endTime) <= toMinutes(payload.startTime)) throw new Error('Lõpuaeg peab olema algusajast hilisem.')
  if (existingId) {
    const { headers, values } = collectiveRows_()
    const idCol = headerMap_(headers)['Kollektiivi ID']
    if (!values.slice(1).some((row) => String(row[idCol]) === String(existingId))) throw new Error('Kollektiivi ei leitud.')
  }
  const contactEmail = normalizeEmail_(payload.contactEmail || '')
  if (contactEmail && !isValidEmail_(contactEmail)) throw new Error('Kollektiivi kontakt e-post ei sobi.')
  return {
    name, leader, weekday: String(weekday), roomId: String(payload.roomId),
    startTime: String(payload.startTime), endTime: String(payload.endTime),
    contactEmail, phone: String(payload.phone || '').trim(),
    website: String(payload.website || '').trim(),
    socialMedia: String(payload.socialMedia || '').trim(),
    description: String(payload.description || '').trim()
  }
}

function weeklyDates_(startISO, endISO, weekday) {
  const start = new Date(String(startISO) + 'T12:00:00Z')
  const end = new Date(String(endISO) + 'T12:00:00Z')
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) throw new Error('Proovigraafiku periood ei sobi.')
  const result = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const isoWeekday = ((cursor.getUTCDay() + 6) % 7) + 1
    if (isoWeekday === Number(weekday)) result.push(Utilities.formatDate(cursor, 'UTC', 'yyyy-MM-dd'))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return result
}

function createCollective_(payload) {
  const actor = requireCollectiveEditor_(payload.sessionToken)
  const validated = validateCollectivePayload_(payload)
  if (actor.role === 'collective' && validated.leader.id !== actor.id) {
    throw new Error('Kollektiivijuht saab luua ainult enda kollektiivi.')
  }
  const room = ROOM_CONFIG[validated.roomId]
  const dates = weeklyDates_(payload.scheduleStart, payload.scheduleEnd, validated.weekday)
  if (dates.length === 0) throw new Error('Valitud perioodis ei ole proovipäeva.')
  const seriesId = 'SEERIA-' + Date.now() + '-' + Math.floor(Math.random() * 900 + 100)
  dates.forEach((date) => {
    const usage = {
      roomId: validated.roomId, date, startTime: validated.startTime, endTime: validated.endTime,
      sessionToken: payload.sessionToken, collectiveLeaderId: validated.leader.id, seriesId,
      collective: validated.name, publicTitle: validated.name, type: 'Proov',
      house: room.house, roomName: room.name, displayMode: 'category',
      suppressStaffEmail: true, notes: 'Kollektiivi korduv proov: ' + validated.name
    }
    validateRoomTime_(usage)
    assertRoomAvailable_(usage)
  })
  const sheet = collectivesSheet_()
  const headers = ensureCollectiveHeader_(sheet)
  const id = 'KOL-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 900 + 100)
  sheet.appendRow(headers.map((header) => safeCell_({
    'Kollektiivi ID': id, 'Nimi': validated.name, 'Juhi kasutaja ID': validated.leader.id,
    'Juhi e-post': validated.leader.email, 'Rahvamaja': room.house, 'Ruum': validated.roomId,
    'Proovipäev': validated.weekday, 'Algus': validated.startTime, 'Lõpp': validated.endTime,
    'Kontakt e-post': validated.contactEmail, 'Telefon': validated.phone,
    'Koduleht': validated.website, 'Sotsiaalmeedia': validated.socialMedia,
    'Kirjeldus': validated.description, 'Aktiivne': 'jah'
  }[header] || '')))
  dates.forEach((date) => createUsage_({
    action: 'createUsage', sessionToken: payload.sessionToken, roomId: validated.roomId, date, seriesId,
    startTime: validated.startTime, endTime: validated.endTime, collectiveLeaderId: validated.leader.id,
    collective: validated.name, publicTitle: validated.name, type: 'Proov',
    house: room.house, roomName: room.name, displayMode: 'category',
    suppressStaffEmail: true, notes: 'Kollektiivi korduv proov: ' + validated.name
  }))
  return { ok: true, collective: collectiveFromRow_(headers, sheet.getRange(sheet.getLastRow(), 1, 1, headers.length).getValues()[0], sheet.getLastRow()) }
}

function updateCollective_(payload) {
  const actor = requireCollectiveEditor_(payload.sessionToken)
  const validated = validateCollectivePayload_(payload, payload.collectiveId)
  const { sheet, headers, map, values } = collectiveRows_()
  const idCol = map['Kollektiivi ID']
  const index = values.findIndex((row, rowIndex) => rowIndex > 0 && String(row[idCol]) === String(payload.collectiveId))
  if (index < 1) throw new Error('Kollektiivi ei leitud.')
  const existing = collectiveFromRow_(headers, values[index], index + 1)
  if (actor.role === 'collective' && existing.leaderUserId !== actor.id) {
    throw new Error('Sul puudub selle kollektiivi muutmise õigus.')
  }
  const row = index + 1
  const changes = {
    'Nimi': validated.name, 'Juhi kasutaja ID': validated.leader.id, 'Juhi e-post': validated.leader.email,
    'Rahvamaja': ROOM_CONFIG[validated.roomId].house, 'Ruum': validated.roomId,
    'Proovipäev': validated.weekday, 'Algus': validated.startTime, 'Lõpp': validated.endTime,
    'Kontakt e-post': validated.contactEmail, 'Telefon': validated.phone,
    'Koduleht': validated.website, 'Sotsiaalmeedia': validated.socialMedia, 'Kirjeldus': validated.description,
    'Aktiivne': payload.active === false ? 'ei' : 'jah'
  }
  Object.keys(changes).forEach((header) => setCell_(sheet, map, row, header, changes[header]))
  return { ok: true, collective: collectiveFromRow_(headers, sheet.getRange(row, 1, 1, headers.length).getValues()[0], row) }
}

function manageUser_(payload) {
  const actor = requireManager_(payload.sessionToken)
  const target = findUserById_(payload.userId)
  if (!target) throw new Error('Kasutajat ei leitud.')
  if (actor.role !== 'director' && target.role !== 'collective') {
    throw new Error('Administraator saab hallata ainult kollektiivi juhte.')
  }
  const { sheet, map } = userRows_()
  const action = String(payload.userAction || '')
  if (action === 'setActive') {
    if (target.id === actor.id && String(payload.active) !== 'true') throw new Error('Oma kasutajat ei saa siit sulgeda.')
    const nextActive = String(payload.active) === 'true'
    if (!nextActive && target.role === 'director') {
      const directors = Object.values(getAllUsers_()).filter((user) => user.active && user.role === 'director' && user.id !== target.id)
      if (directors.length === 0) throw new Error('Vähemalt üks aktiivne juhataja peab alles jääma.')
    }
    updateUserSecurity_(target, map, sheet, { 'Aktiivne': nextActive ? 'jah' : 'ei' })
    return { ok: true, user: publicUser_(findUserById_(target.id)) }
  }
  if (action === 'setPassword') {
    if (!payload.passwordSalt || !payload.passwordVerifier) throw new Error('Uue parooli seadistus puudub.')
    updateUserSecurity_(target, map, sheet, {
      'Parooli sool': payload.passwordSalt,
      'Parooli tuletis': payload.passwordVerifier,
      'Parooli muutmise aeg': new Date(),
      'Ebaõnnestunud katsed': 0,
      'Blokeeritud kuni': ''
    })
    return { ok: true, user: publicUser_(findUserById_(target.id)) }
  }
  if (action === 'updateProfile') {
    const nextEmail = normalizeEmail_(payload.email || target.email)
    const duplicate = findUserByEmail_(nextEmail)
    if (duplicate && duplicate.id !== target.id) throw new Error('Selle e-postiga kasutaja on juba olemas.')
    if (!isValidEmail_(nextEmail)) throw new Error('Sisesta korrektne e-posti aadress.')
    const nextName = String(payload.name || target.name).trim()
    if (nextName.length < 2 || nextName.length > 100) throw new Error('Sisesta kasutaja nimi.')
    const nextRole = String(payload.role || target.role).toLowerCase()
    if (actor.role !== 'director' && nextRole !== target.role) throw new Error('Administraator ei saa kasutaja rolli muuta.')
    if (!['director', 'admin', 'collective'].includes(nextRole)) throw new Error('Roll ei sobi.')
    const allowedRoomIds = roomIdsForUser_({ ...target, ...payload })
    if (nextRole === 'collective' && allowedRoomIds.length === 0) throw new Error('Kollektiivi juhile tuleb määrata vähemalt üks lubatud RoomID.')
    if (target.role === 'director' && target.active && nextRole !== 'director') {
      const directors = Object.values(getAllUsers_()).filter((user) => user.active && user.role === 'director' && user.id !== target.id)
      if (directors.length === 0) throw new Error('Vähemalt üks aktiivne juhataja peab alles jääma.')
    }
    updateUserSecurity_(target, map, sheet, {
      'Nimi': nextName,
      'E-post': nextEmail,
      'Roll': nextRole,
      'Kollektiiv': payload.collective || '',
      'Rahvamaja': payload.house || '',
      'Ruum': payload.room || '',
      'RoomID': payload.roomId || '',
      'Telefon': payload.phone || target.phone || '',
      'Koduleht': payload.website || target.website || '',
      'Sotsiaalmeedia': payload.socialMedia || target.socialMedia || '',
      'Lubatud RoomID-d': allowedRoomIds.join(',')
    })
    return { ok: true, user: publicUser_(findUserById_(target.id)) }
  }
  throw new Error('Kasutaja toimingut ei tunta.')
}

function getAllUsers_() {
  const { headers, values } = userRows_()
  const result = {}
  values.slice(1).forEach((row, index) => {
    const user = userFromRow_(headers, row, index + 2)
    if (user.id) result[user.id] = user
  })
  return result
}

function operationResult_(payload, result) {
  if (payload && payload.requestId) {
    const actor = payload.sessionToken ? sessionUser_(payload.sessionToken) : null
    CacheService.getScriptCache().put(
      operationCacheKey_(payload.requestId),
      JSON.stringify({ actorId: actor?.id || '', result }),
      120
    )
  }
  return result
}

function operationStatus_(requestId, token) {
  const raw = CacheService.getScriptCache().get(operationCacheKey_(requestId))
  if (!raw) return { ok: false, pending: true }
  const operation = JSON.parse(raw)
  if (operation.actorId && (!token || sessionUser_(token)?.id !== operation.actorId)) {
    return { ok: false, pending: false, error: 'Selle toimingu vaatamiseks puudub õigus.' }
  }
  CacheService.getScriptCache().remove(operationCacheKey_(requestId))
  return operation.result
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {}
  const action = params.action || 'ping'
  const callback = params.callback
  let data
  try {
    if (action === 'authChallenge') data = authChallenge_(params.email)
    else if (action === 'authLogin') data = authLogin_(params.email, params.challengeId, params.proof)
    else if (action === 'bootstrapStatus') data = bootstrapStatus_()
    else if (action === 'list') data = listBookings_(params.session)
    else if (action === 'listUsers') data = listUsers_(params.session)
    else if (action === 'listCollectives') data = listCollectives_(params.session)
    else if (action === 'operationStatus') data = operationStatus_(params.requestId, params.session)
    else data = { ok: true, message: 'Kultuuripesa Apps Script töötab.' }
  } catch (error) { data = { ok: false, error: String(error) } }
  if (callback && !/^[$A-Z_][0-9A-Z_$]*$/i.test(callback)) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Vigane callback.' })).setMimeType(ContentService.MimeType.JSON)
  }
  if (callback) return ContentService.createTextOutput(`${callback}(${JSON.stringify(data)})`).setMimeType(ContentService.MimeType.JAVASCRIPT)
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  let lock
  let payload = {}
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error('Päringu sisu puudub.')
    payload = JSON.parse(e.postData.contents)
    lock = LockService.getScriptLock()
    if (!lock.tryLock(10000)) throw new Error('Teine salvestus on pooleli. Proovi uuesti.')
    let result
    if (payload.action === 'updateStatus') {
      requireManager_(payload.sessionToken)
      result = updateStatus_(payload)
    } else if (payload.action === 'cancelSeries') {
      result = cancelSeries_(payload)
    } else if (payload.action === 'createUsage') {
      result = createUsage_(payload)
    } else if (payload.action === 'createUser') {
      result = createUser_(payload)
    } else if (payload.action === 'createCollective') {
      result = createCollective_(payload)
    } else if (payload.action === 'updateCollective') {
      result = updateCollective_(payload)
    } else if (payload.action === 'manageUser') {
      result = manageUser_(payload)
    } else if (payload.action === 'logout') {
      const user = sessionUser_(payload.sessionToken)
      if (payload.sessionToken) CacheService.getScriptCache().remove(sessionCacheKey_(payload.sessionToken))
      result = { ok: true, userId: user?.id || '' }
    } else if (payload.action === 'bootstrapUser') {
      result = bootstrapUser_(payload)
    } else {
      result = createBooking_(payload)
    }
    return jsonResponse_(operationResult_(payload, result))
  } catch (error) {
    return jsonResponse_(operationResult_(payload, { ok: false, error: String(error) }))
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
  usersSheet_()
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: 'Kultuuripesa Apps Script töötab',
    htmlBody: '<h2>Test õnnestus</h2><p>Google Sheet ja kasutajate leht on leitavad ning e-kirjade saatmine töötab.</p>',
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
    'Seeria ID': payload.seriesId || '',
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
  const actor = requireSession_(payload.sessionToken)
  if (actor.role === 'collective') {
    if (!actor.allowedRoomIds.includes(String(payload.roomId || ''))) throw new Error('Selle ruumi kasutamiseks puudub õigus.')
    payload.instructorId = actor.id
    payload.status = 'ootel'
    payload.name = actor.name
    payload.email = actor.email
    payload.collective = actor.collective
  } else if (['director', 'admin'].includes(actor.role)) {
    payload.instructorId = actor.id
    payload.status = payload.status === 'kinnitatud' ? 'kinnitatud' : 'ootel'
    payload.name = actor.name
    payload.email = actor.email
    if (payload.collectiveLeaderId) {
      const leader = findUserById_(payload.collectiveLeaderId)
      if (!leader || !leader.active || leader.role !== 'collective') throw new Error('Kollektiivijuhi kasutaja ei sobi.')
      payload.instructorId = leader.id
      payload.name = leader.name
      payload.email = leader.email
      payload.collective = payload.collective || leader.collective
    }
  } else {
    throw new Error('Selle toimingu jaoks puudub õigus.')
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
    'Seeria ID': payload.seriesId || '',
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


function createUsageId_() {
  const now = new Date()
  const datePart = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss')
  const randomPart = Math.floor(Math.random() * 900 + 100)
  return `JR-${datePart}-${randomPart}`
}

function updateStatus_(payload) {
  const nextStatus = String(payload.status || '').trim().toLowerCase()
  if (!['kinnitatud', 'tühistatud'].includes(nextStatus)) throw new Error('Staatus ei sobi.')
  const bookingId = String(payload.bookingId || payload.id || '').trim()
  if (!bookingId) throw new Error('Broneeringu ID puudub.')

  const sheet = getOrCreateSheet_()
  const headers = ensureHeader_(sheet)
  const map = headerMap_(headers)
  const values = sheet.getDataRange().getValues()
  const idCol = map['Broneeringu ID']
  if (idCol === undefined) throw new Error('Broneeringu ID veerg puudub.')

  for (let i = 1; i < values.length; i += 1) {
    if (String(values[i][idCol] || '').trim() === bookingId) {
      const rowNumber = i + 1
      if (nextStatus === 'kinnitatud') {
        const booking = sheetRowToBooking_(rowToObject_(headers, values[i]), rowNumber)
        if (booking.status === 'tühistatud') throw new Error('Tühistatud kirjet ei saa uuesti kinnitada. Loo uus soov.')
        validateRoomTime_(booking)
        assertRoomAvailable_(booking, bookingId)
        setCell_(sheet, map, rowNumber, 'Ruum kinni alates', booking.reservedStartTime)
        setCell_(sheet, map, rowNumber, 'Ruum kinni kuni', booking.reservedEndTime)
      }

      setCell_(sheet, map, rowNumber, 'Staatus', nextStatus)
      if (payload.publicTitle !== undefined) setCell_(sheet, map, rowNumber, 'Avaliku kalendri tekst', payload.publicTitle)
      if (payload.displayMode !== undefined) setCell_(sheet, map, rowNumber, 'Kuvamise viis', payload.displayMode)

      if (nextStatus === 'kinnitatud') {
        setCell_(sheet, map, rowNumber, 'Kinnitamise aeg', new Date())
        const rowObj = rowToObject_(headers, sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0])
        const alreadySent = String(rowObj['Kinnituskiri saadetud'] || '').toLowerCase() === 'jah'
        if (!alreadySent && rowObj['E-post']) {
          sendClientConfirmedEmail_(rowObj)
          setCell_(sheet, map, rowNumber, 'Kinnituskiri saadetud', 'jah')
        }
      }

      return { ok: true, bookingId, status: nextStatus }
    }
  }

  throw new Error('Broneeringut ei leitud: ' + bookingId)
}

function cancelSeries_(payload) {
  requireManager_(payload.sessionToken)
  const seriesId = String(payload.seriesId || '').trim()
  if (!seriesId) throw new Error('Seeria ID puudub.')
  const sheet = getOrCreateSheet_()
  const headers = ensureHeader_(sheet)
  const map = headerMap_(headers)
  const values = sheet.getDataRange().getValues()
  const statusCol = map['Staatus']
  const seriesCol = map['Seeria ID']
  const notesCol = map['Lisainfo']
  if (statusCol === undefined) throw new Error('Staatus veerg puudub.')
  let updated = 0
  for (let i = 1; i < values.length; i += 1) {
    const storedSeriesId = seriesCol === undefined ? '' : String(values[i][seriesCol] || '').trim()
    const notes = notesCol === undefined ? '' : String(values[i][notesCol] || '')
    if (storedSeriesId !== seriesId && !notes.includes(`Seeria ID: ${seriesId}`)) continue
    const currentStatus = String(values[i][statusCol] || '').trim().toLowerCase()
    if (currentStatus === 'tühistatud' || currentStatus === 'cancelled') continue
    setCell_(sheet, map, i + 1, 'Staatus', 'tühistatud')
    updated += 1
  }
  if (!updated) throw new Error('Aktiivseid selle seeria kirjeid ei leitud.')
  return { ok: true, seriesId, updated }
}

function listBookings_(sessionToken) {
  const actor = sessionUser_(sessionToken)
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
  const isManager = actor && ['director', 'admin'].includes(actor.role)
  return { ok: true, bookings: isManager ? bookings : [], usages }
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
    seriesId: row['Seeria ID'] || '',
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
