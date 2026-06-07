import React, { useEffect, useMemo, useState } from 'react'
import {
  bookingSettings,
  filters,
  houses,
  initialActivities,
  initialEvents,
  instructors,
  rentalRooms,
  rentalServices,
  roles
} from './data.js'

const EVENT_TYPE_OPTIONS = ['Eraüritus', 'Koosolek', 'Koolitus', 'Töötuba', 'Kontsert', 'Kogukonnaüritus', 'Muu']

const WEEKDAY_OPTIONS = [
  { value: '1', label: 'esmaspäev' },
  { value: '2', label: 'teisipäev' },
  { value: '3', label: 'kolmapäev' },
  { value: '4', label: 'neljapäev' },
  { value: '5', label: 'reede' },
  { value: '6', label: 'laupäev' },
  { value: '7', label: 'pühapäev' }
]

function weekdayValue(dateISO) {
  if (!dateISO) return '1'
  const date = new Date(`${dateISO}T12:00:00`)
  if (Number.isNaN(date.getTime())) return '1'
  return String(((date.getDay() + 6) % 7) + 1)
}

function weeklyDates(startISO, endISO, weekday) {
  if (!startISO || !endISO || !weekday) return []
  const start = new Date(`${startISO}T12:00:00`)
  const end = new Date(`${endISO}T12:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return []
  const wanted = Number(weekday)
  const result = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const isoWeekday = ((cursor.getDay() + 6) % 7) + 1
    if (isoWeekday === wanted) {
      result.push(`${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`)
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
}

function usageDatesFromForm(form) {
  if (form.recurrence === 'weekly') return weeklyDates(form.recurrenceStart, form.recurrenceEnd, form.weekday)
  return form.date ? [form.date] : []
}

function recurrenceSummary(form) {
  if (form.recurrence !== 'weekly') return 'Ühekordne tegevus'
  const day = WEEKDAY_OPTIONS.find((item) => item.value === form.weekday)?.label || 'valitud nädalapäev'
  return `Iga ${day}, periood ${form.recurrenceStart || '...'}–${form.recurrenceEnd || '...'}`
}

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function timeToMinutes(time) {
  if (!time) return 0
  const [hours, minutes] = String(time).split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

function minutesToTime(minutes) {
  const safe = Math.max(0, Math.min(24 * 60, minutes))
  return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`
}

function displayDate(dateISO) {
  if (!dateISO) return ''
  const date = new Date(`${dateISO}T12:00:00`)
  if (Number.isNaN(date.getTime())) return dateISO
  return date.toLocaleDateString('et-EE', { day: 'numeric', month: 'long' })
}

function isoDate(year, monthIndex, day) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
}

function monthLabel(dateISO) {
  const base = dateISO ? new Date(`${dateISO.slice(0, 7)}-01T12:00:00`) : new Date('2026-06-01T12:00:00')
  return base.toLocaleDateString('et-EE', { month: 'long', year: 'numeric' })
}

function shiftMonth(dateISO, amount) {
  const base = dateISO ? new Date(`${dateISO.slice(0, 7)}-01T12:00:00`) : new Date('2026-06-01T12:00:00')
  base.setMonth(base.getMonth() + amount)
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-01`
}

function dateBadge(dateISO) {
  const date = new Date(`${dateISO}T12:00:00`)
  if (Number.isNaN(date.getTime())) return { day: '', month: '' }
  return {
    day: date.toLocaleDateString('et-EE', { day: 'numeric' }).replace('.', ''),
    month: date.toLocaleDateString('et-EE', { month: 'short' }).replace('.', '').toUpperCase()
  }
}

function formatEuro(value) {
  return `${Number(value || 0).toFixed(2).replace('.', ',')} €`
}

function getPublicTitle(item) {
  const status = normalizeStatusForCalendar(item.status)
  if (status === 'pending') {
    const base = item.publicTitle || item.calendarText || 'Broneeritud'
    return String(base).toLowerCase().includes('ootab') ? base : `${base} (ootab kinnitamist)`
  }
  if (item.displayMode === 'neutral') return item.publicTitle || 'Ruum broneeritud'
  if (item.displayMode === 'category') return item.publicTitle || item.category || 'Rahvamaja kasutuses'
  return item.publicTitle || item.title
}

function getRoomById(roomId) {
  return rentalRooms.find((room) => room.id === roomId) || rentalRooms[0]
}

function roomIdFromHouseAndRoom(house, roomName) {
  const normalizedHouse = String(house || '').toLowerCase()
  const normalizedRoom = String(roomName || '').toLowerCase()
  const found = rentalRooms.find((room) => {
    return room.house.toLowerCase().includes(normalizedHouse.split(' ')[0] || '') && room.name.toLowerCase() === normalizedRoom
  })
  if (found) return found.id
  const loose = rentalRooms.find((room) => room.house === house && room.name === roomName)
  return loose?.id || rentalRooms[0].id
}

function normalizeStatusForCalendar(status) {
  const value = String(status || '').toLowerCase().trim()
  if (['kinnitatud', 'published', 'avaldatud'].includes(value)) return 'published'
  if (['ootel', 'pending', 'küsitav', 'kusitav'].includes(value)) return 'pending'
  if (['tühistatud', 'tuhistatud', 'cancelled'].includes(value)) return 'cancelled'
  return value || 'pending'
}

function bookingToCalendarEvent(item) {
  const roomId = item.roomId || roomIdFromHouseAndRoom(item.house, item.roomName || item.room)
  const room = getRoomById(roomId)
  const normalizedStatus = normalizeStatusForCalendar(item.status)
  const publicTitle = item.publicTitle || item.calendarText || (normalizedStatus === 'pending' ? 'Broneeritud' : (item.publicEvent ? (item.eventType || 'Avalik sündmus') : 'Ruum broneeritud'))
  
  // Kind'i määramine. Kui andmebaasis on kind olemas, kasutame seda. Muul juhul tuletame.
  const kind = item.kind || (item.publicEvent ? 'event' : 'booking')

  return {
    id: item.id || item.bookingId || `sheet-${item.rowNumber || Math.random()}`,
    kind,
    title: item.internalTitle || item.eventType || 'Broneering',
    publicTitle,
    displayMode: item.publicEvent ? 'full' : 'neutral',
    house: item.house || room.house,
    roomId,
    room: item.roomName || item.room || room.name,
    dateISO: item.dateISO || item.date,
    date: displayDate(item.dateISO || item.date),
    weekday: new Date(`${item.dateISO || item.date}T12:00:00`).toLocaleDateString('et-EE', { weekday: 'long' }),
    startTime: item.startTime,
    endTime: item.endTime,
    reservedStartTime: item.reservedStartTime,
    reservedEndTime: item.reservedEndTime,
    audience: item.publicEvent ? 'Kõigile' : 'Kinnine kasutus',
    category: item.type || 'Broneering',
    price: '',
    registration: false,
    public: true,
    blocksRoom: true,
    status: normalizedStatus,
    tech: '',
    owner: item.name || 'Klient',
    description: item.publicEvent ? (item.notes || 'Avalik sündmus rahvamajas.') : 'Rahvamaja ruum on sel ajal broneeritud.',
    sourceType: 'booking'
  }
}

// Värvikoodide ja teemade määraja kalendri elementidele
function getCalendarItemTheme(item) {
  const status = normalizeStatusForCalendar(item.status);
  if (status === 'pending') return { bg: 'bg-yellow-50', ring: 'ring-yellow-300', text: 'text-yellow-900', badgeBg: 'bg-yellow-200', dot: 'bg-yellow-400', label: 'Ootel' };
  if (item.kind === 'event') return { bg: 'bg-green-50', ring: 'ring-green-300', text: 'text-green-900', badgeBg: 'bg-green-200', dot: 'bg-green-500', label: 'Sündmus' };
  if (item.kind === 'activity') return { bg: 'bg-purple-50', ring: 'ring-purple-300', text: 'text-purple-900', badgeBg: 'bg-purple-200', dot: 'bg-purple-500', label: 'Ringitegevus' };
  if (item.kind === 'internal') return { bg: 'bg-slate-100', ring: 'ring-slate-300', text: 'text-slate-900', badgeBg: 'bg-slate-300', dot: 'bg-slate-600', label: 'Sisemine' };
  return { bg: 'bg-blue-50', ring: 'ring-blue-300', text: 'text-blue-900', badgeBg: 'bg-blue-200', dot: 'bg-blue-500', label: 'Broneering' };
}

function jsonp(url, params = {}) {
  return new Promise((resolve, reject) => {
    if (!url) return resolve({ ok: false, usages: [], pending: [] })
    const callbackName = `kpJsonp_${Date.now()}_${Math.floor(Math.random() * 100000)}`
    const script = document.createElement('script')
    const search = new URLSearchParams({ ...params, callback: callbackName })
    window[callbackName] = (data) => {
      resolve(data)
      delete window[callbackName]
      script.remove()
    }
    script.onerror = () => {
      reject(new Error('Andmete laadimine ebaõnnestus.'))
      delete window[callbackName]
      script.remove()
    }
    script.src = `${url}${url.includes('?') ? '&' : '?'}${search.toString()}`
    document.body.appendChild(script)
  })
}

async function postToAppsScript(payload) {
  if (!bookingSettings.appsScriptUrl) return
  await fetch(bookingSettings.appsScriptUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
}

function getBlockingItems(events) {
  return events.filter((item) => item.blocksRoom && ['published', 'kinnitatud', 'pending', 'ootel'].includes(normalizeStatusForCalendar(item.status)))
}

function getRoomDayItems(roomId, dateISO, events) {
  return getBlockingItems(events)
    .filter((item) => item.roomId === roomId && item.dateISO === dateISO)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
}

function getBufferedRange(item) {
  const room = getRoomById(item.roomId)
  const start = timeToMinutes(item.startTime) - (room.bufferBeforeMinutes || 0)
  const end = timeToMinutes(item.endTime) + (room.bufferAfterMinutes || 0)
  return {
    start: Math.max(0, start),
    end: Math.min(24 * 60, end),
    before: room.bufferBeforeMinutes || 0,
    after: room.bufferAfterMinutes || 0
  }
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart
}

function getAvailability(roomId, dateISO, startTime, endTime, events) {
  const room = getRoomById(roomId)
  const items = getRoomDayItems(roomId, dateISO, events)
  const requestedStart = timeToMinutes(startTime)
  const requestedEnd = timeToMinutes(endTime)
  const reservedStart = requestedStart - (room.bufferBeforeMinutes || 0)
  const reservedEnd = requestedEnd + (room.bufferAfterMinutes || 0)

  if (!dateISO || !startTime || !endTime) {
    return { status: 'missing', items, conflicts: [], requestedStart, requestedEnd, reservedStart, reservedEnd }
  }

  if (requestedEnd <= requestedStart) {
    return { status: 'invalid', items, conflicts: [], requestedStart, requestedEnd, reservedStart, reservedEnd }
  }

  const conflicts = items.filter((item) => {
    const buffered = getBufferedRange(item)
    return rangesOverlap(reservedStart, reservedEnd, buffered.start, buffered.end)
  })

  return {
    status: conflicts.length ? 'busy' : 'free',
    items,
    conflicts,
    requestedStart,
    requestedEnd,
    reservedStart: Math.max(0, reservedStart),
    reservedEnd: Math.min(24 * 60, reservedEnd),
    room
  }
}

function getFreeSlots(items) {
  const ranges = items
    .map((item) => getBufferedRange(item))
    .sort((a, b) => a.start - b.start)

  const merged = []
  ranges.forEach((range) => {
    const last = merged[merged.length - 1]
    if (!last || range.start > last.end) merged.push({ start: range.start, end: range.end })
    else last.end = Math.max(last.end, range.end)
  })

  const free = []
  let cursor = 8 * 60
  const close = 23 * 60
  merged.forEach((range) => {
    if (range.start > cursor) free.push({ start: cursor, end: Math.min(range.start, close) })
    cursor = Math.max(cursor, range.end)
  })
  if (cursor < close) free.push({ start: cursor, end: close })
  return free.filter((slot) => slot.end - slot.start >= 30)
}

function Header({ view, setView }) {
  const nav = [
    ['events', 'Sündmused'],
    ['availability', 'Ruumid'],
    ['activities', 'Ringid'],
    ['contact', 'Kontakt']
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <button onClick={() => setView('home')} className="flex items-center gap-3 text-left">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-lg font-black text-white">RK</div>
          <div>
            <p className="font-black leading-tight text-slate-950">Rannu & Konguta</p>
            <p className="text-xs font-semibold text-slate-500">rahvamajad</p>
          </div>
        </button>
        <nav className="hidden items-center gap-5 text-sm font-bold text-slate-700 lg:flex">
          {nav.map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} className={cx('hover:text-emerald-700', (view === id || (id === 'availability' && ['roomDetail', 'booking'].includes(view))) && 'text-emerald-700')}>{label}</button>
          ))}
        </nav>
        <button onClick={() => setView('login')} className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-emerald-800 ring-1 ring-emerald-100 md:hidden">Töötajale</button>
        <div className="hidden gap-2 md:flex">
          <button onClick={() => setView('login')} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Töötajale</button>
          <button onClick={() => setView('events')} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-200">Vaata sündmusi</button>
          <button onClick={() => setView('availability')} className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">Broneeri ruum</button>
        </div>
      </div>
    </header>
  )
}

function MobileNav({ view, setView }) {
  const nav = [
    ['events', 'Sündmused', '📅'],
    ['availability', 'Ruumid', '🏠'],
    ['activities', 'Ringid', '🎭'],
    ['contact', 'Kontakt', '☎']
  ]
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {nav.map(([id, label, icon]) => (
          <button key={id} onClick={() => setView(id)} className={cx('rounded-2xl px-2 py-2 text-center text-xs font-black', view === id ? 'bg-emerald-700 text-white' : 'text-slate-700')}>
            <span className="block text-base leading-5">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Page({ children }) {
  return <main className="mx-auto max-w-7xl px-4 pb-28 pt-8 md:px-8 md:pb-14">{children}</main>
}

function SectionHeader({ eyebrow, title, text, compact = false }) {
  return (
    <div className={cx('max-w-3xl', compact ? 'mb-4' : 'mb-7')}>
      {eyebrow && <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>}
      <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{title}</h1>
      {text && <p className="mt-3 text-base leading-7 text-slate-600 md:text-lg">{text}</p>}
    </div>
  )
}

function HomeView({ setView, events, openEventDetails }) {
  const upcomingEvents = events.filter((event) => event.status === 'published' && event.kind === 'event' && event.displayMode === 'full').slice(0, 3)
  
  return (
    <Page>
      {/* Tulevad sündmused */}
      <section className="mb-12">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Avaleht</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Tulevad sündmused</h2>
          </div>
          <button onClick={() => setView('events')} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-200">Kõik sündmused</button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {upcomingEvents.map((event) => <EventCard key={event.id} event={event} compact onDetails={openEventDetails} />)}
          {upcomingEvents.length === 0 && <p className="text-slate-500">Lähiajal sündmusi pole.</p>}
        </div>
      </section>

      {/* Rahvamajade tutvustus */}
      <section className="mb-12">
        <SectionHeader title="Meie rahvamajad" text="Kaks maja, kaks kohalikku nägu. Rannu ja Konguta rahvamajad on piirkonna kultuurielu keskpunktid." compact />
        <div className="grid gap-5 md:grid-cols-2 mt-6">
          {houses.map((house) => (
            <article key={house.name} className="rounded-[1.7rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-2xl font-black text-slate-950">{house.name}</h3>
              <p className="mt-2 text-sm font-bold text-slate-500">📍 {house.location}</p>
              <p className="mt-4 leading-7 text-slate-600">{house.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">{house.tags.map(tag => <Pill key={tag}>{tag}</Pill>)}</div>
            </article>
          ))}
        </div>
      </section>

      {/* Ringidega liitumise kutse */}
      <section className="rounded-[2rem] bg-gradient-to-br from-purple-100 via-white to-emerald-50 p-8 shadow-sm ring-1 ring-slate-200 text-center">
        <h2 className="text-3xl font-black text-slate-950 mb-4">Tule osalema meie huviringides!</h2>
        <p className="text-lg text-slate-700 max-w-2xl mx-auto mb-6">
          Huviringid, kollektiivid ja proovid on mõeldud püsivaks tegevuseks. Vaata meie ringide nimekirja, leia endale sobiv tegevus ja liitu meiega.
        </p>
        <button onClick={() => setView('activities')} className="rounded-2xl bg-emerald-700 px-6 py-3 text-base font-black text-white hover:bg-emerald-800 transition">
          Vaata huviringe ja kollektiive
        </button>
      </section>
    </Page>
  )
}

function Pill({ children }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{children}</span>
}

function EventCard({ event, compact = false, onDetails }) {
  const badge = dateBadge(event.dateISO)
  return (
    <article className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-slate-200">
      <div className="h-24 bg-gradient-to-br from-emerald-100 via-sky-50 to-amber-50 p-4">
        <div className="flex items-start justify-between">
          <div className="rounded-2xl bg-white/85 px-4 py-3 text-center shadow-sm ring-1 ring-white">
            <p className="text-xl font-black text-slate-950">{badge.day}</p>
            <p className="text-xs font-black uppercase text-slate-500">{badge.month}</p>
          </div>
          {event.price && <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-white">{event.price}</span>}
        </div>
      </div>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2"><Pill>{event.house.replace(' rahvamaja', '')}</Pill><Pill>{event.audience}</Pill>{event.registration && <Pill>registreerimisega</Pill>}</div>
        <h3 className="text-xl font-black leading-tight text-slate-950">{getPublicTitle(event)}</h3>
        <p className="mt-2 text-sm font-bold text-slate-500">{event.weekday} · {event.startTime}–{event.endTime}</p>
        {!compact && <p className="mt-3 text-sm leading-6 text-slate-600">{event.description}</p>}
        <button onClick={() => onDetails?.(event)} className="mt-5 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">Vaata lähemalt</button>
      </div>
    </article>
  )
}

function EventsView({ events, openEventDetails }) {
  const [filter, setFilter] = useState('Kõik')
  const [query, setQuery] = useState('')
  // Kuvame ainult sündmused (kind === 'event')
  const publicEvents = events.filter((event) => event.status === 'published' && event.kind === 'event' && event.public && event.displayMode === 'full')
  
  const filtered = publicEvents.filter((event) => {
    const text = `${event.title} ${event.house} ${event.audience} ${event.category} ${event.description}`.toLowerCase()
    const q = text.includes(query.toLowerCase())
    const f = filter === 'Kõik' || event.house.includes(filter) || event.audience === filter || event.price === filter || (filter === 'Registreerimisega' && event.registration)
    return q && f
  })
  return (
    <Page>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeader eyebrow="Sündmused" title="Mis lähiajal toimub?" text="Avalikus sündmuste vaates on need tegevused, mis on suunatud publikule." />
        <div className="w-full rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 md:max-w-sm"><label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Otsi</label><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Näiteks peredele, kontsert, Rannu..." /></div>
      </div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={cx('rounded-full px-4 py-2 text-sm font-black ring-1', filter === item ? 'bg-emerald-700 text-white ring-emerald-700' : 'bg-white text-slate-700 ring-slate-200')}>{item}</button>)}</div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map((event) => <EventCard key={event.id} event={event} onDetails={openEventDetails} />)}</div>
    </Page>
  )
}


function EventDetailView({ event, setView, setSelectedRoomId }) {
  if (!event) {
    return (
      <Page>
        <SectionHeader eyebrow="Sündmus" title="Sündmust ei leitud" text="Valitud sündmuse infot ei õnnestunud kuvada." />
        <button onClick={() => setView('events')} className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-800">Tagasi sündmuste juurde</button>
      </Page>
    )
  }

  const room = getRoomById(event.roomId)
  const title = getPublicTitle(event)
  const canBookRoom = event.roomId && room

  return (
    <Page>
      <button onClick={() => setView('events')} className="mb-5 rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">← Tagasi sündmuste juurde</button>
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
          <div className="mb-5 flex flex-wrap gap-2">
            <Pill>{event.house?.replace(' rahvamaja', '')}</Pill>
            <Pill>{event.audience || 'Kõigile'}</Pill>
            {event.category && <Pill>{event.category}</Pill>}
            {event.price && <Pill>{event.price}</Pill>}
            {event.registration && <Pill>registreerimisega</Pill>}
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">{title}</h1>
          <p className="mt-4 text-lg font-bold text-slate-600">{event.weekday} · {event.date || event.dateISO} · {event.startTime}–{event.endTime}</p>
          <p className="mt-6 text-base leading-8 text-slate-700">{event.description || 'Lisainfo täpsustamisel.'}</p>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Koht</p>
              <p className="mt-1 text-lg font-black text-slate-950">{event.house}</p>
              <p className="text-sm font-bold text-slate-500">{event.room || room?.name}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Tehnika / vajadused</p>
              <p className="mt-1 text-sm font-bold text-slate-700">{event.tech || 'Ei ole märgitud'}</p>
            </div>
          </div>
        </div>

        <aside className="rounded-[2rem] bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-black text-slate-950">Sündmuse info</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <p><b>Aeg:</b> {event.startTime}–{event.endTime}</p>
            <p><b>Rahvamaja:</b> {event.house}</p>
            <p><b>Ruum:</b> {event.room || room?.name}</p>
            <p><b>Sihtrühm:</b> {event.audience || 'Kõigile'}</p>
            <p><b>Osalemine:</b> {event.price || 'Täpsustamisel'}</p>
            <p><b>Registreerimine:</b> {event.registration ? 'vajalik' : 'ei ole vajalik'}</p>
          </div>
          {event.registration && <button className="mt-6 w-full rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800">Registreeri / küsi lisa</button>}
          {canBookRoom && <button onClick={() => { setSelectedRoomId(event.roomId); setView('roomDetail') }} className="mt-3 w-full rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">Vaata selle ruumi kalendrit</button>}
        </aside>
      </section>
    </Page>
  )
}

function RoomCard({ room, onOpen }) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-emerald-100 via-sky-50 to-amber-50 text-sm font-black text-slate-500">Lisa ruumi foto</div>
      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{room.house}</p>
        <h3 className="mt-2 text-2xl font-black leading-tight text-slate-950">{room.name}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{room.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill>kuni {room.capacity} inimest</Pill>
          <Pill>{formatEuro(room.hourlyRate)} / h</Pill>
          <Pill>min {room.minimumHours} h</Pill>
        </div>
        <button onClick={onOpen} className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white hover:bg-emerald-800">Vaata ja broneeri</button>
      </div>
    </article>
  )
}

function MonthCalendar({ roomId, selectedDate, setSelectedDate, events }) {
  const current = selectedDate || '2026-06-01'
  const base = new Date(`${current.slice(0, 7)}-01T12:00:00`)
  const year = base.getFullYear()
  const month = base.getMonth()
  const firstWeekday = (base.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(isoDate(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button onClick={() => setSelectedDate(shiftMonth(current, -1))} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">‹</button>
        <h3 className="text-lg font-black capitalize text-slate-950">{monthLabel(current)}</h3>
        <button onClick={() => setSelectedDate(shiftMonth(current, 1))} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase text-slate-500">
        {['E', 'T', 'K', 'N', 'R', 'L', 'P'].map((day) => <div key={day} className="py-2">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((dateISO, index) => {
          if (!dateISO) return <div key={`empty-${index}`} className="min-h-16 rounded-xl bg-slate-50" />
          const items = getRoomDayItems(roomId, dateISO, events)
          const isSelected = dateISO === selectedDate
          const day = Number(dateISO.slice(-2))
          
          return (
            <button key={dateISO} onClick={() => setSelectedDate(dateISO)} className={cx('min-h-16 flex flex-col items-start rounded-xl p-2 text-left ring-1 transition', isSelected ? 'bg-emerald-700 text-white ring-emerald-700' : 'bg-white text-slate-900 ring-slate-200 hover:bg-emerald-50')}>
              <span className="text-sm font-black">{day}</span>
              <div className="mt-1 flex flex-wrap gap-0.5">
                {items.slice(0, 4).map(item => {
                  const theme = getCalendarItemTheme(item);
                  return <span key={item.id} className={cx('block h-2 w-2 rounded-full', isSelected ? 'bg-white' : theme.dot)} />
                })}
                {items.length > 4 && <span className="text-[8px] font-black leading-[8px]">+</span>}
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-white ring-1 ring-slate-200" /> vaba</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-yellow-400" /> ootel</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-500" /> sündmus</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-purple-500" /> ringitegevus</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-500" /> broneering</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-600" /> sisemine</span>
      </div>
    </div>
  )
}

function RoomDetailView({ selectedRoomId, setSelectedRoomId, events, setView, setBookingDraft }) {
  const [selectedDate, setSelectedDate] = useState('2026-06-20')
  const [startTime, setStartTime] = useState('18:00')
  const [endTime, setEndTime] = useState('22:00')
  const room = getRoomById(selectedRoomId)
  const availability = getAvailability(room.id, selectedDate, startTime, endTime, events)
  const canContinue = availability.status === 'free'

  function continueBooking() {
    setBookingDraft({ roomId: room.id, date: selectedDate, startTime, endTime })
    setView('booking')
  }

  return (
    <Page>
      <button onClick={() => setView('availability')} className="mb-5 rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">← Tagasi ruumide juurde</button>
      <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {rentalRooms.map((item) => (
              <button key={item.id} onClick={() => { setSelectedRoomId(item.id); setSelectedDate('2026-06-20') }} className={cx('rounded-full px-4 py-2 text-sm font-black ring-1', item.id === room.id ? 'bg-emerald-700 text-white ring-emerald-700' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50')}>{item.name}</button>
            ))}
          </div>
          <SectionHeader eyebrow={room.house} title={room.name} text={room.description} compact />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-black uppercase text-slate-500">Mahutavus</p><p className="mt-1 text-xl font-black">{room.capacity} inimest</p></div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-black uppercase text-slate-500">Hind</p><p className="mt-1 text-xl font-black">{formatEuro(room.hourlyRate)} / h</p></div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-black uppercase text-slate-500">Miinimum</p><p className="mt-1 text-xl font-black">{room.minimumHours} h</p></div>
          </div>
          <div className="mt-5 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Rendi hinna sees</p>
            <div className="flex flex-wrap gap-2">{room.included.map((item) => <Pill key={item}>{item}</Pill>)}</div>
            <p className="mb-3 mt-5 text-xs font-black uppercase tracking-wide text-slate-500">Eraldi kokkuleppel</p>
            <div className="flex flex-wrap gap-2">{room.agreement.map((item) => <Pill key={item}>{item}</Pill>)}</div>
          </div>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <MonthCalendar roomId={room.id} selectedDate={selectedDate} setSelectedDate={setSelectedDate} events={events} />
          <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black text-slate-950">Vali kasutusaeg</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Broneeringule lisatakse automaatselt {room.bufferBeforeMinutes} min enne ja {room.bufferAfterMinutes} min pärast.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Algusaeg" required><input type="time" className={inputClass} value={startTime} onChange={(e) => setStartTime(e.target.value)} /></Field>
              <Field label="Lõpuaeg" required><input type="time" className={inputClass} value={endTime} onChange={(e) => setEndTime(e.target.value)} /></Field>
            </div>
            <div className="mt-4"><AvailabilityPanel events={events} roomId={room.id} dateISO={selectedDate} /></div>
            {availability.status === 'free' && <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900 ring-1 ring-emerald-100">Valitud aeg on esialgu vaba. Ruum hoitakse puhvrit arvestades kinni {minutesToTime(availability.reservedStart)}–{minutesToTime(availability.reservedEnd)}.</div>}
            {availability.status === 'busy' && <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-900 ring-1 ring-rose-100"><b>Seda aega ei saa valida.</b><p className="mt-1">Puhvriga aeg {minutesToTime(availability.reservedStart)}–{minutesToTime(availability.reservedEnd)} kattub olemasoleva kasutusega.</p></div>}
            {availability.status === 'invalid' && <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-900 ring-1 ring-amber-100">Lõpuaeg peab olema algusajast hilisem.</div>}
            <button disabled={!canContinue} onClick={continueBooking} className="mt-5 w-full rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">Jätka broneeringuga</button>
          </div>
        </aside>
      </section>
    </Page>
  )
}

function AvailabilityPanel({ events, roomId, dateISO }) {
  const room = getRoomById(roomId)
  const items = getRoomDayItems(roomId, dateISO, events)
  const freeSlots = getFreeSlots(items)
  return (
    <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-xl font-black text-slate-950">{room.house} · {room.name}</h3><p className="mt-1 text-sm text-slate-600">{dateISO ? displayDate(dateISO) : 'Vali kuupäev'} · puhver {room.bufferBeforeMinutes} min enne ja {room.bufferAfterMinutes} min pärast.</p></div>
        <Pill>kalendrikontroll</Pill>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Ruumis toimub</h4>
          {items.length === 0 && <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900 ring-1 ring-emerald-100">Sellel päeval ei ole sündmusi ega broneeringuid.</p>}
          <div className="space-y-2">
            {items.map((item) => {
              const buffer = getBufferedRange(item)
              const theme = getCalendarItemTheme(item)
              return (
                <div key={`${item.sourceType}-${item.id}`} className={cx('rounded-2xl p-4 ring-1', theme.bg, theme.ring)}>
                  <div className="flex items-start justify-between gap-3">
                    <p className={cx("font-black", theme.text)}>{getPublicTitle(item)}</p>
                    <span className={cx('rounded-full px-2 py-1 text-[10px] font-black uppercase', theme.badgeBg, theme.text)}>{theme.label}</span>
                  </div>
