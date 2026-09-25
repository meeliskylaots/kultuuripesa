import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { activeHouses, houses, rentalRooms } from '../src/data.js'

const source = readFileSync(new URL('../google/booking-apps-script.gs', import.meta.url), 'utf8')
function api() {
  const context = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => ({ ADMIN_PIN: 'admin-test-only', DIRECTOR_PIN: 'director-test-only' })[key] }) },
    Utilities: { formatDate: () => '2026-09-25' }
  })
  vm.runInContext(source, context)
  return context
}
const booking = (changes = {}) => ({ roomId: 'konguta-saal', date: '2030-10-02', startTime: '12:00', endTime: '14:00', ...changes })

test('Only Konguta and Rannu are active; future houses have stable IDs', () => {
  assert.deepEqual(activeHouses.map(h => h.id).sort(), ['konguta', 'rannu'])
  assert.deepEqual(houses.filter(h => !h.active).map(h => h.id).sort(), ['puhja', 'rongu'])
  assert.ok(rentalRooms.every(r => activeHouses.some(h => h.id === r.houseId)))
})
test('Staff role comes from server credentials and invalid access is rejected', () => {
  const a = api()
  assert.equal(a.requireStaff_('director-test-only'), 'director')
  assert.equal(a.requireStaff_('admin-test-only'), 'admin')
  assert.throws(() => a.requireStaff_('2026'))
  assert.throws(() => a.requireStaff_(''))
})
test('Server rejects inactive rooms, invalid dates, past dates, and backwards times', () => {
  const a = api()
  for (const changes of [{roomId:'rongu-saal'}, {roomId:'toString'}, {date:'2030-02-30'}, {date:'2020-01-01'}, {endTime:'11:00'}, {startTime:'25:00'}]) {
    assert.throws(() => a.validateRoomTime_(booking(changes)))
  }
})
test('Room and preparation buffers cannot be overridden by client input', () => {
  const a = api(), p = booking({house:'Another house', bufferBeforeMinutes:0, reservedStartTime:'12:00'})
  a.validateRoomTime_(p)
  assert.equal(p.house, 'Konguta rahvamaja')
  assert.equal(p.reservedStartTime, '11:00')
  assert.equal(p.reservedEndTime, '15:00')
})
test('Overlap is rejected; adjacent use and another room are allowed; self excluded during approval', () => {
  const a = api(), p = booking()
  a.validateRoomTime_(p)
  a.listBookings_ = () => ({usages:[{...p, bookingId:'existing'}]})
  assert.throws(() => a.assertRoomAvailable_(p))
  assert.doesNotThrow(() => a.assertRoomAvailable_(p, 'existing'))
  assert.doesNotThrow(() => a.assertRoomAvailable_({...p, roomId:'rannu-saal'}))
  assert.doesNotThrow(() => a.assertRoomAvailable_({...p, reservedStartTime:'15:00', reservedEndTime:'17:00'}))
})
test('Public calendar excludes private fields; staff sees full booking', () => {
  const a = api()
  const headers = vm.runInContext('HEADERS', a)
  const row = {'Broneeringu ID':'test', 'Staatus':'ootel', 'Nimi':'PRIVATE NAME', 'E-post':'private@example.com', 'Telefon':'PRIVATE PHONE', 'Lisainfo':'PRIVATE NOTES', 'RoomID':'konguta-saal', 'Kuupäev':'2030-10-02', 'Algus':'12:00', 'Lõpp':'14:00'}
  a.getOrCreateSheet_ = () => ({getDataRange:() => ({getValues:() => [headers, headers.map(h => row[h] || '')]})})
  a.ensureHeader_ = () => headers
  const publicResult = a.listBookings_()
  assert.equal(publicResult.bookings.length, 0)
  assert.equal(publicResult.usages.length, 1)
  assert.ok(!JSON.stringify(publicResult).includes('PRIVATE'))
  assert.ok(!JSON.stringify(publicResult).includes('private@example.com'))
  assert.equal(a.listBookings_('director-test-only').bookings[0].email, 'private@example.com')
})
test('Sheet inputs cannot become formulas', () => {
  const a = api()
  assert.equal(a.safeCell_('=IMPORTDATA("https://example.com")'), '\'=IMPORTDATA("https://example.com")')
  assert.equal(a.safeCell_('Ordinary note'), 'Ordinary note')
})
