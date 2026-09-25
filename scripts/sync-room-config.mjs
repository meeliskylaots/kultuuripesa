import { readFileSync, writeFileSync } from 'node:fs'
import { rentalRooms } from '../src/data.js'

const path = new URL('../google/booking-apps-script.gs', import.meta.url)
const source = readFileSync(path, 'utf8')
const rooms = Object.fromEntries(rentalRooms.map(room => [room.id, {
  houseId: room.houseId, house: room.house, name: room.name,
  bufferBeforeMinutes: room.bufferBeforeMinutes, bufferAfterMinutes: room.bufferAfterMinutes
}]))
const generated = '// BEGIN GENERATED ROOM CONFIG\nconst ROOM_CONFIG = ' + JSON.stringify(rooms, null, 2) + '\n// END GENERATED ROOM CONFIG'
const next = source.includes('// BEGIN GENERATED ROOM CONFIG')
  ? source.replace(/\/\/ BEGIN GENERATED ROOM CONFIG[\s\S]*?\/\/ END GENERATED ROOM CONFIG/, generated)
  : generated + '\n\n' + source
writeFileSync(path, next)
