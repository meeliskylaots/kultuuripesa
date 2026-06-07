import React, { useEffect, useMemo, useState } from 'react'
import {
  bookingSettings,
  filters,
  houses,
  initialActivities,
  initialEvents,
  initialRequests,
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
                  <p className={cx("mt-1 text-sm", theme.text)}>Tegelik aeg: {item.startTime}–{item.endTime}</p>
                  <p className={cx("mt-1 text-sm font-bold", theme.text)}>Broneerimiseks suletud: {minutesToTime(buffer.start)}–{minutesToTime(buffer.end)}</p>
                </div>
              )
            })}
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Vabad ajavahemikud</h4>
          <div className="space-y-2">
            {freeSlots.map((slot, index) => <div key={index} className="rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-900 ring-1 ring-slate-200">{minutesToTime(slot.start)}–{minutesToTime(slot.end)}</div>)}
          </div>
        </div>
      </div>
    </div>
  )
}

function AvailabilityView({ events, setView, setSelectedRoomId }) {
  return (
    <Page>
      <SectionHeader eyebrow="Ruumide kasutus ja vabad ajad" title="Vali ruum ja vaata kalendrit" text="Vali ruum, vaata kalendrist vabu ja hõivatud aegu ning jätka broneeringuga." />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {rentalRooms.map((room) => (
          <RoomCard key={room.id} room={room} onOpen={() => { setSelectedRoomId(room.id); setView('roomDetail') }} />
        ))}
      </div>
    </Page>
  )
}

function StepBadge({ step, current, label }) {
  return <div className={cx('rounded-2xl px-3 py-2 text-xs font-black ring-1', step === current ? 'bg-emerald-700 text-white ring-emerald-700' : step < current ? 'bg-emerald-50 text-emerald-800 ring-emerald-100' : 'bg-white text-slate-500 ring-slate-200')}>{step}. {label}</div>
}

function BookingView({ events, initialDraft, onBookingCreated }) {
  const [step, setStep] = useState(initialDraft ? 2 : 1)
  const [form, setForm] = useState({
    roomId: initialDraft?.roomId || rentalRooms[0].id,
    date: initialDraft?.date || '2026-06-20',
    startTime: initialDraft?.startTime || '18:00',
    endTime: initialDraft?.endTime || '22:00',
    eventType: '',
    participants: '',
    publicEvent: false,
    services: [],
    name: '',
    email: '',
    phone: '',
    notes: '',
    accepted: false
  })
  const [submitMessage, setSubmitMessage] = useState('')
  const room = getRoomById(form.roomId)
  const availability = getAvailability(form.roomId, form.date, form.startTime, form.endTime, events)
  const requestedHours = Math.max(0, (timeToMinutes(form.endTime) - timeToMinutes(form.startTime)) / 60)
  const billableHours = Math.max(requestedHours, room.minimumHours || 1)
  const selectedServices = rentalServices.filter((service) => form.services.includes(service.id)).map((service) => ({ ...service, total: service.pricing === 'hourly' ? service.price * billableHours : service.price }))
  const roomCost = billableHours * room.hourlyRate
  const servicesTotal = selectedServices.reduce((sum, service) => sum + service.total, 0)
  const estimatedTotal = roomCost + servicesTotal
  const canContinueFromStep1 = availability.status === 'free'

  function toggleService(id) {
    setForm((current) => ({ ...current, services: current.services.includes(id) ? current.services.filter((item) => item !== id) : [...current.services, id] }))
  }

  async function submitBooking() {
    const clientBookingId = `BR-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`
    const payload = {
      action: 'createBooking',
      bookingId: clientBookingId,
      roomId: room.id,
      kind: 'booking',
      type: 'broneering',
      status: 'ootel',
      publicTitle: form.publicEvent ? (form.eventType || 'Avalik sündmus') : 'Ruum broneeritud',
      displayMode: form.publicEvent ? 'full' : 'neutral',
      house: room.house,
      roomName: room.name,
      roomEmail: room.email,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      reservedStartTime: minutesToTime(availability.reservedStart),
      reservedEndTime: minutesToTime(availability.reservedEnd),
      bufferBeforeMinutes: room.bufferBeforeMinutes,
      bufferAfterMinutes: room.bufferAfterMinutes,
      hours: billableHours,
      eventType: form.eventType,
      participants: form.participants,
      publicEvent: form.publicEvent,
      name: form.name,
      email: form.email,
      phone: form.phone,
      selectedServices: selectedServices.map((service) => ({ label: service.label, total: service.total })),
      includedItems: room.included,
      agreementItems: room.agreement,
      roomCost,
      servicesTotal,
      estimatedTotal,
      notes: form.notes,
      disclaimer: bookingSettings.priceDisclaimer
    }

    if (bookingSettings.appsScriptUrl) {
      try {
        await postToAppsScript(payload)
        onBookingCreated?.({ ...payload, id: clientBookingId, bookingId: clientBookingId, status: 'ootel', calendarText: payload.publicTitle })
        setSubmitMessage('Broneeringusoov saadeti. See on avalikus kalendris märgitud kui “ootab kinnitamist” ja töötaja vaates ootel.')
      } catch (error) {
        setSubmitMessage('Saatmine ei õnnestunud. Palun proovi uuesti või võta rahvamajaga ühendust.')
      }
    } else {
      const subject = encodeURIComponent('Ruumi kasutamise soov')
      const body = encodeURIComponent(JSON.stringify(payload, null, 2))
      window.location.href = `mailto:${bookingSettings.defaultEmail}?subject=${subject}&body=${body}`
      setSubmitMessage('Avati e-kirja mustand, sest Apps Scripti URL puudub.')
    }
  }

  return (
    <Page>
      <SectionHeader eyebrow="Broneeringusoov" title="Täienda andmed ja saada soov" text="Ruum ja aeg on valitud kalendrivaates. Nüüd lisa sündmuse, teenuste ja kontaktide info." />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2"><StepBadge step={1} current={step} label="Ruum ja aeg" /><StepBadge step={2} current={step} label="Sündmus" /><StepBadge step={3} current={step} label="Teenused" /><StepBadge step={4} current={step} label="Kontakt" /></div>
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="sticky top-2 z-20 rounded-[1.25rem] bg-slate-950 p-4 text-white shadow-xl lg:top-24 lg:self-start lg:rounded-[1.5rem] lg:p-6">
          <div className="flex items-end justify-between gap-4 lg:block">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-white/50 lg:text-sm">Orienteeruv hind</p>
              <p className="mt-1 text-3xl font-black lg:mt-3 lg:text-4xl">{formatEuro(estimatedTotal)}</p>
            </div>
            <p className="mb-1 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/75 lg:hidden">kokku</p>
          </div>
          <div className="mt-4 space-y-2 text-sm text-white/75 lg:mt-5">
            <div className="flex justify-between gap-3"><span>Ruum {billableHours} h × {formatEuro(room.hourlyRate)}</span><b>{formatEuro(roomCost)}</b></div>
            <div className="flex justify-between gap-3"><span>Koristus ja ettevalmistus</span><b>hinnas</b></div>
            {selectedServices.length ? selectedServices.map((s) => <div key={s.id} className="flex justify-between gap-3"><span>{s.label}</span><b>{formatEuro(s.total)}</b></div>) : <div className="flex justify-between gap-3"><span>Lisateenuseid ei ole valitud</span><b>{formatEuro(0)}</b></div>}
            <div className="mt-3 border-t border-white/15 pt-3">
              <div className="flex justify-between gap-3"><span>Teenused kokku</span><b>{formatEuro(servicesTotal)}</b></div>
              <div className="mt-2 flex justify-between gap-3 text-base text-white"><span className="font-black">Kogusumma</span><b>{formatEuro(estimatedTotal)}</b></div>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-white/55 lg:mt-5">{bookingSettings.priceDisclaimer}</p>
        </aside>
        <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          {step === 1 && <BookingStepRoom form={form} setForm={setForm} availability={availability} room={room} events={events} onNext={() => setStep(2)} canNext={canContinueFromStep1} />}
          {step === 2 && <BookingStepEvent form={form} setForm={setForm} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
          {step === 3 && <BookingStepServices form={form} room={room} toggleService={toggleService} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
          {step === 4 && <BookingStepContact form={form} setForm={setForm} onBack={() => setStep(3)} onSubmit={submitBooking} submitMessage={submitMessage} />}
        </section>
      </div>
    </Page>
  )
}

function Field({ label, required, children }) {
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label} {required && <span className="text-rose-600">*</span>}</span>{children}</label>
}
const inputClass = 'w-full rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500'

function BookingStepRoom({ form, setForm, availability, room, events, onNext, canNext }) {
  return <div><h2 className="text-2xl font-black">1. Vali ruum ja aeg</h2><p className="mt-2 text-sm leading-6 text-slate-600">Broneeringule lisatakse automaatselt ruumi puhver: {room.bufferBeforeMinutes} min enne ja {room.bufferAfterMinutes} min pärast.</p><div className="mt-5 grid gap-3 md:grid-cols-2"><Field label="Ruum" required><select className={inputClass} value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>{rentalRooms.map((room) => <option key={room.id} value={room.id}>{room.house} · {room.name}</option>)}</select></Field><Field label="Kuupäev" required><input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field><Field label="Algusaeg" required><input type="time" className={inputClass} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Field><Field label="Lõpuaeg" required><input type="time" className={inputClass} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Field></div><div className="mt-5"><AvailabilityPanel events={events} roomId={form.roomId} dateISO={form.date} /></div>{availability.status === 'free' && <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900 ring-1 ring-emerald-100">Valitud aeg on kalendri ja puhvri põhjal esialgu vaba. Ruum hoitakse arvestuslikult kinni {minutesToTime(availability.reservedStart)}–{minutesToTime(availability.reservedEnd)}.</div>}{availability.status === 'busy' && <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-900 ring-1 ring-rose-100"><b>Valitud aeg ei ole saadaval.</b><p className="mt-1">Puhvriga aeg {minutesToTime(availability.reservedStart)}–{minutesToTime(availability.reservedEnd)} kattub olemasoleva kasutusega.</p></div>}{availability.status === 'invalid' && <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-900 ring-1 ring-amber-100">Lõpuaeg peab olema algusajast hilisem.</div>}<div className="mt-5 flex justify-end"><button disabled={!canNext} onClick={onNext} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">Jätka</button></div></div>
}

function BookingStepEvent({ form, setForm, onBack, onNext }) {
  const canNext = form.eventType && form.participants
  return <div><h2 className="text-2xl font-black">2. Sündmuse info</h2><div className="mt-5 grid gap-3 md:grid-cols-2"><Field label="Sündmuse liik" required><select className={inputClass} value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}><option value="">Vali liik</option>{EVENT_TYPE_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Osalejate arv" required><input className={inputClass} value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} placeholder="nt 40" /></Field><label className="md:col-span-2 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><input type="checkbox" checked={form.publicEvent} onChange={(e) => setForm({ ...form, publicEvent: e.target.checked })} className="mt-1" /><span><b>Soovin, et sündmus oleks avalikus kalendris detailidega nähtav.</b><span className="block text-sm text-slate-600">Kui mitte, kuvatakse kasutuskalendris neutraalne tekst, näiteks “Ruum broneeritud”.</span></span></label><Field label="Lisainfo"><textarea className={`${inputClass} min-h-[110px] md:col-span-2`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Kirjelda lisasoove, tehnilisi vajadusi või muid olulisi asjaolusid." /></Field></div><div className="mt-5 flex justify-between"><button onClick={onBack} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-800">Tagasi</button><button disabled={!canNext} onClick={onNext} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:bg-slate-300">Jätka</button></div></div>
}

function BookingStepServices({ form, room, toggleService, onBack, onNext }) {
  return (
    <div>
      <h2 className="text-2xl font-black">3. Teenused ja hind</h2>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <h3 className="font-black">{room.house} · {room.name}</h3>
        <p className="mt-1 text-sm text-slate-600">{room.description}</p>
        <div className="mt-4">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Rendi hinna sees</p>
          <div className="flex flex-wrap gap-2">{room.included.map((item) => <Pill key={item}>{item}</Pill>)}</div>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Eraldi kokkuleppel</p>
          <div className="flex flex-wrap gap-2">{room.agreement.map((item) => <Pill key={item}>{item}</Pill>)}</div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {rentalServices.map((service) => <label key={service.id} className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 hover:bg-slate-50"><input type="checkbox" checked={form.services.includes(service.id)} onChange={() => toggleService(service.id)} className="mt-1" /><span><b>{service.label}</b><span className="block text-sm text-slate-600">{service.description}</span><span className="mt-2 block text-sm font-black text-emerald-700">{service.pricing === 'hourly' ? `${formatEuro(service.price)} / h` : formatEuro(service.price)}</span></span></label>)}
      </div>
      <div className="mt-5 flex justify-between"><button onClick={onBack} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-800">Tagasi</button><button onClick={onNext} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white">Jätka</button></div>
    </div>
  )
}

function BookingStepContact({ form, setForm, onBack, onSubmit, submitMessage }) {
  const canSubmit = form.name && form.email && form.phone && form.accepted
  return <div><h2 className="text-2xl font-black">4. Kontakt, tingimused ja saatmine</h2><div className="mt-5 grid gap-3 md:grid-cols-2"><Field label="Nimi" required><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="E-post" required><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Telefon" required><input type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field><Field label="Allkirjastamise viis" required><select className={inputClass}><option>Allkirjastan lepingu kohapeal rahvamajas</option><option>Soovin lepingu allkirjastada digitaalselt</option></select></Field></div><details className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><summary className="cursor-pointer font-black">Ruumide kasutamise tingimused, hinnainfo ja isikuandmed</summary><p className="mt-3 text-sm leading-6 text-slate-600">Broneering jõustub pärast rahvamaja kinnitust. Hind on orienteeruv ja kinnitatakse lõplikult pärast ruumi saadavuse ning vajaduste ülevaatamist. Isikuandmeid kasutatakse broneeringu, lepingu ja arve menetlemiseks.</p></details><label className="mt-4 flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200"><input type="checkbox" checked={form.accepted} onChange={(e) => setForm({ ...form, accepted: e.target.checked })} className="mt-1" /><span className="text-sm"><b>Olen tutvunud ruumi kasutamise tingimuste, hinnainfo ja isikuandmete töötlemise põhimõtetega ning nõustun nendega. <span className="text-rose-600">*</span></b></span></label>{submitMessage && <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900 ring-1 ring-emerald-100">{submitMessage}</div>}<div className="mt-5 flex justify-between"><button onClick={onBack} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-800">Tagasi</button><button disabled={!canSubmit} onClick={onSubmit} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:bg-slate-300">Saada broneeringusoov</button></div></div>
}

function ActivitiesView({ activities }) {
  const onlyActivities = activities.filter((a) => a.kind === 'activity' && a.status === 'published')
  return (
    <Page>
      <SectionHeader eyebrow="Ringid ja tegevused" title="Leia endale sobiv tegevus" text="Siit leiad huviringid ja kollektiivid. Liitumise või lisainfo saamiseks võta juhendaja või rahvamajaga ühendust." />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {onlyActivities.map((act) => (
          <div key={act.id} className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 flex flex-col justify-between border-t-4 border-purple-500">
            <div>
              <p className="text-xs font-black uppercase text-purple-700 mb-1">{act.house}</p>
              <h3 className="font-bold text-2xl text-slate-900 mb-4">{act.title || act.name}</h3>
              <div className="space-y-2 text-sm text-slate-700">
                <p><strong>📅 Aeg:</strong> {act.time || 'Kokkuleppel'}</p>
                <p><strong>👤 Juhendaja:</strong> {act.instructor || 'Määramata'}</p>
                <p><strong>🎯 Kellele:</strong> {act.audience || 'Kõigile'}</p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 text-sm text-slate-600">
              <strong>Liitumise info:</strong> {act.joinInfo || 'Küsi täpsemalt rahvamajast.'}
            </div>
          </div>
        ))}
        {onlyActivities.length === 0 && <p className="text-slate-500">Ringitegevusi ei leitud.</p>}
      </div>
    </Page>
  )
}

function HousesView() {
  return <Page><SectionHeader eyebrow="Rahvamajad" title="Kaks maja, kaks kohalikku nägu" text="Siia saab hiljem lisada päris fotod rahvamajadest ja ruumidest. Praegu on pildialad fotode kohahoidjad." /><div className="grid gap-5 md:grid-cols-2">{houses.map((house) => <article key={house.name} className="rounded-[1.7rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="mb-5 flex h-52 items-center justify-center rounded-[1.3rem] bg-gradient-to-br from-emerald-100 via-sky-50 to-amber-50 text-sm font-black text-slate-500">Lisa siia päris foto</div><h3 className="text-2xl font-black">{house.name}</h3><p className="mt-2 text-sm font-bold text-slate-500">📍 {house.location}</p><p className="mt-4 leading-7 text-slate-600">{house.description}</p><div className="mt-5 flex flex-wrap gap-2">{house.tags.map(tag => <Pill key={tag}>{tag}</Pill>)}</div></article>)}</div></Page>
}

function ContactView() {
  return <Page><SectionHeader eyebrow="Kontakt" title="Võta ühendust" text="Kirjuta või helista, kui soovid küsida sündmuse, ringi või ruumi kasutamise kohta." /><div className="grid gap-5 md:grid-cols-3">{['Üldkontakt', 'Rannu rahvamaja', 'Konguta rahvamaja'].map((title, index) => <div key={title} className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-black">{title}</h3><p className="mt-3 text-slate-600">{index === 0 ? 'kultuur@elva.ee' : index === 1 ? 'Rannu alevik' : 'Annikoru küla'}</p><p className="mt-1 text-slate-600">+372 0000 0000</p><div className="mt-5 flex flex-wrap gap-2"><a href="tel:+37200000000" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white">Helista</a><a href="mailto:kultuur@elva.ee" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-800">Kirjuta</a></div></div>)}</div></Page>
}

function LoginView({ setView, selectedRole, setSelectedRole, adminPin, setAdminPin, isAdminUnlocked, setIsAdminUnlocked, setInstructorSession }) {
  const [error, setError] = useState('')
  const [instructorPin, setInstructorPin] = useState('')
  const isInstructorRole = selectedRole === 'collective'

  function enterAdmin() {
    if (adminPin === bookingSettings.adminPin) {
      setIsAdminUnlocked(true)
      setError('')
      setView('admin')
    } else {
      setError('PIN-kood ei sobi.')
    }
  }

  async function enterInstructor() {
    setError('')
    const normalizedPin = String(instructorPin || '').trim()
    if (!normalizedPin) {
      setError('Sisesta juhendaja PIN-kood.')
      return
    }
    try {
      if (bookingSettings.appsScriptUrl) {
        const data = await jsonp(bookingSettings.appsScriptUrl, { action: 'authInstructor', pin: normalizedPin })
        if (data?.ok && data.instructor) {
          setInstructorSession(data.instructor)
          setView('instructor')
          return
        }
      }
    } catch (error) {
      // Vaikne prototüübi fallback
    }

    const local = instructors.find((item) => item.active && String(item.pin) === normalizedPin)
    if (local) {
      setInstructorSession(local)
      setView('instructor')
    } else {
      setError('PIN-kood ei sobi aktiivse juhendaja andmetega.')
    }
  }

  return (
    <Page>
      <SectionHeader eyebrow="Töötajale" title="Vali roll ja sisene töövaatesse" text="Vali kõigepealt oma roll. Juhataja ja administraator sisenevad üldise PIN-koodiga. Ringijuht või juhendaja sisestab oma isikliku PIN-koodi." />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black">1. Vali roll</h2>
          <div className="mt-4 grid gap-3">
            {roles.filter(role => ['director', 'admin', 'collective'].includes(role.id)).map(role => (
              <button key={role.id} onClick={() => { setSelectedRole(role.id); setError('') }} className={cx('rounded-2xl p-5 text-left ring-1', selectedRole === role.id ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-200')}>
                <h3 className="font-black">{role.id === 'collective' ? 'Ringijuht / kollektiivijuht' : role.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{role.id === 'collective' ? 'Esitab proovide, lisaproovide või sündmuste muudatusi juhatajale kinnitamiseks.' : role.description}</p>
              </button>
            ))}
          </div>
        </section>
        <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black">2. Sisene</h2>
          {!isInstructorRole ? (
            <>
              <p className="mt-2 text-sm leading-6 text-slate-600">Juhataja ja administraator sisenevad PIN-koodiga. Vaikimisi PIN on prototüübis <b>2026</b>.</p>
              <input value={adminPin} onChange={(e) => setAdminPin(e.target.value)} type="password" className="mt-4 w-full rounded-xl bg-slate-50 px-4 py-3 text-lg font-black tracking-widest outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500" placeholder="PIN" />
              {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-800 ring-1 ring-rose-100">{error}</p>}
              <button onClick={enterAdmin} className="mt-5 w-full rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800">Ava töölaud</button>
              {isAdminUnlocked && <button onClick={() => setView('admin')} className="mt-3 w-full rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-800">Mine tagasi töölauda</button>}
            </>
          ) : (
            <>
              <p className="mt-2 text-sm leading-6 text-slate-600">Ringijuht või juhendaja sisestab oma isikliku PIN-koodi. Vorm avaneb ainult tema lubatud majade ja ruumide jaoks.</p>
              <Field label="Isiklik PIN" required><input type="password" className={inputClass} value={instructorPin} onChange={(e) => setInstructorPin(e.target.value)} placeholder="PIN" /></Field>
              {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-800 ring-1 ring-rose-100">{error}</p>}
              <button onClick={enterInstructor} className="mt-5 w-full rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800">Ava juhendaja vorm</button>
              <p className="mt-4 text-xs leading-5 text-slate-500">Prototüübi näidis-PIN-id: 4821 või 7394.</p>
            </>
          )}
        </section>
      </div>
    </Page>
  )
}

function InstructorView({ events, onUsageCreated, initialInstructor, clearInstructorSession }) {
  const [pin, setPin] = useState('')
  const [authError, setAuthError] = useState('')
  const [instructor, setInstructor] = useState(null)
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    requestType: 'Proov',
    recurrence: 'single',
    date: '',
    recurrenceStart: '',
    recurrenceEnd: '',
    weekday: '1',
    startTime: '18:00',
    endTime: '20:00',
    publicTitle: '',
    displayMode: 'category',
    notes: ''
  })

  async function authenticate() {
    setAuthError('')
    const normalizedPin = String(pin || '').trim()
    if (!normalizedPin) {
      setAuthError('Sisesta juhendaja PIN-kood.')
      return
    }
    try {
      if (bookingSettings.appsScriptUrl) {
        const data = await jsonp(bookingSettings.appsScriptUrl, { action: 'authInstructor', pin: normalizedPin })
        if (data?.ok && data.instructor) {
          enterInstructor(data.instructor)
          return
        }
      }
    } catch (error) {}

    const local = instructors.find((item) => item.active && String(item.pin) === normalizedPin)
    if (local) {
      enterInstructor(local)
    } else {
      setAuthError('PIN-kood ei sobi aktiivse juhendaja andmetega.')
    }
  }

  function logout() {
    setInstructor(null)
    setSelectedRoomId('')
    setPin('')
    setMessage('')
    clearInstructorSession?.()
  }

  function allowedRoomsFor(activeInstructor) {
    const ids = activeInstructor?.allowedRoomIds?.length ? activeInstructor.allowedRoomIds : [activeInstructor?.roomId].filter(Boolean)
    return rentalRooms.filter((room) => ids.includes(room.id))
  }

  function enterInstructor(activeInstructor) {
    const allowed = allowedRoomsFor(activeInstructor)
    const firstRoom = allowed[0] || getRoomById(activeInstructor.roomId)
    setInstructor(activeInstructor)
    setSelectedRoomId(firstRoom.id)
    setForm((current) => {
      const date = current.date || '2026-06-09'
      return { ...current, publicTitle: activeInstructor.collective || '', date, recurrenceStart: current.recurrenceStart || date, recurrenceEnd: current.recurrenceEnd || date, weekday: current.weekday || weekdayValue(date) }
    })
  }

  useEffect(() => {
    if (initialInstructor && !instructor) {
      enterInstructor(initialInstructor)
    }
  }, [initialInstructor?.id])

  if (!instructor) {
    return (
      <Page>
        <SectionHeader eyebrow="Juhendajale" title="Sisesta kollektiivi tegevus või prooviaja muudatus" text="Juhendaja ei avalda infot otse. Sisestus liigub juhatajale või administraatorile kinnitamiseks ning alles pärast kinnitamist ilmub see avalikku kalendrisse ja hakkab ruumi blokeerima." />
        <section className="max-w-xl rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <Field label="Isiklik PIN" required><input type="password" className={inputClass} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" /></Field>
          {authError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-800 ring-1 ring-rose-100">{authError}</p>}
          <button onClick={authenticate} className="mt-5 w-full rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800">Ava vorm</button>
          <p className="mt-4 text-xs leading-5 text-slate-500">Prototüübi näidis-PIN-id: 4821 või 7394. Päris kasutuses määrab PIN-id juhataja.</p>
        </section>
      </Page>
    )
  }

  const allowedRooms = allowedRoomsFor(instructor)
  const selectedRoom = getRoomById(selectedRoomId || instructor.roomId)
  const allowedHouses = [...new Set(allowedRooms.map((room) => room.house))]
  const usageDates = usageDatesFromForm(form)
  const availabilityChecks = usageDates.map((date) => ({ date, availability: getAvailability(selectedRoom.id, date, form.startTime, form.endTime, events) }))
  const conflictCount = availabilityChecks.filter((item) => item.availability.status !== 'free').length
  const previewCount = usageDates.length
  const selectedDateForPanel = form.recurrence === 'weekly' ? (form.recurrenceStart || form.date) : form.date
  const availability = getAvailability(selectedRoom.id, selectedDateForPanel, form.startTime, form.endTime, events)
  const canSubmit = usageDates.length > 0 && form.startTime && form.endTime && form.publicTitle && conflictCount === 0

  async function submitInstructorRequest() {
    if (!canSubmit) return
    const seriesId = form.recurrence === 'weekly' ? `SEERIA-${Date.now()}` : ''
    const created = []

    for (let index = 0; index < usageDates.length; index += 1) {
      const date = usageDates[index]
      const itemAvailability = getAvailability(selectedRoom.id, date, form.startTime, form.endTime, events)
      const usageId = `${form.recurrence === 'weekly' ? 'KR' : 'JR'}-${Date.now()}-${index + 1}`
      const payload = {
        action: 'createUsage',
        bookingId: usageId,
        kind: 'activity', 
        type: form.requestType,
        status: 'ootel',
        instructorId: instructor.id,
        collective: instructor.collective,
        house: selectedRoom.house,
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        date,
        startTime: form.startTime,
        endTime: form.endTime,
        reservedStartTime: minutesToTime(itemAvailability.reservedStart),
        reservedEndTime: minutesToTime(itemAvailability.reservedEnd),
        bufferBeforeMinutes: selectedRoom.bufferBeforeMinutes || 0,
        bufferAfterMinutes: selectedRoom.bufferAfterMinutes || 0,
        hours: Math.max(0, (timeToMinutes(form.endTime) - timeToMinutes(form.startTime)) / 60),
        eventType: form.requestType,
        participants: '',
        publicEvent: form.displayMode !== 'neutral',
        name: instructor.name,
        email: instructor.email,
        phone: '',
        publicTitle: form.publicTitle,
        displayMode: form.displayMode,
        notes: [form.notes, seriesId ? `Korduv tegevus: ${recurrenceSummary(form)}. Seeria ID: ${seriesId}. Kord ${index + 1}/${usageDates.length}.` : ''].filter(Boolean).join('\n'),
        disclaimer: 'Juhendaja sisestus ootab juhataja või administraatori kinnitust.',
        suppressStaffEmail: form.recurrence === 'weekly' && index > 0
      }

      await postToAppsScript(payload)
      created.push({ ...payload, id: usageId, status: 'ootel', calendarText: payload.publicTitle })
      onUsageCreated?.({ ...payload, id: usageId, status: 'ootel', calendarText: payload.publicTitle })
    }

    setMessage(form.recurrence === 'weekly' ? `Korduv sisestus saadeti kinnitamiseks. Loodi ${created.length} ootel kalendrikirjet.` : 'Sisestus saadeti juhatajale kinnitamiseks. Kui see kinnitatakse, ilmub see avalikku kalendrisse ja blokeerib ruumi.')
    setForm((current) => ({ ...current, notes: '' }))
  }

  return (
    <Page>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionHeader eyebrow="Juhendajale" title={`${instructor.collective} · ${allowedHouses.join(' / ')}`} text="Vali rahvamaja ja ruum, vaata kalendrist olemasolevat kasutust ning esita proov, lisaproov või sündmus juhatajale kinnitamiseks." />
        <button onClick={logout} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-200">Välju</button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black">Sisestuse andmed</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Tegevuse liik" required><select className={inputClass} value={form.requestType} onChange={(e) => setForm({ ...form, requestType: e.target.value })}><option>Proov</option><option>Lisaproov</option><option>Sündmus</option><option>Prooviaja muudatus</option><option>Proovi tühistamine</option></select></Field>
            <Field label="Rahvamaja" required><select className={inputClass} value={selectedRoom.house} onChange={(e) => { const nextRoom = allowedRooms.find((room) => room.house === e.target.value) || allowedRooms[0]; setSelectedRoomId(nextRoom.id) }}>{allowedHouses.map((house) => <option key={house}>{house}</option>)}</select></Field>
            <Field label="Ruum" required><select className={inputClass} value={selectedRoom.id} onChange={(e) => setSelectedRoomId(e.target.value)}>{allowedRooms.filter((room) => room.house === selectedRoom.house).map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></Field>
            <Field label="Kordus" required><select className={inputClass} value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}><option value="single">Ühekordne tegevus</option><option value="weekly">Kordub iga nädal</option></select></Field>
            {form.recurrence === 'single' ? (
              <Field label="Kuupäev" required><input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value, recurrenceStart: e.target.value, recurrenceEnd: e.target.value, weekday: weekdayValue(e.target.value) })} /></Field>
            ) : (
              <>
                <Field label="Nädalapäev" required><select className={inputClass} value={form.weekday} onChange={(e) => setForm({ ...form, weekday: e.target.value })}>{WEEKDAY_OPTIONS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></Field>
                <Field label="Perioodi algus" required><input type="date" className={inputClass} value={form.recurrenceStart} onChange={(e) => setForm({ ...form, recurrenceStart: e.target.value, date: e.target.value })} /></Field>
                <Field label="Perioodi lõpp" required><input type="date" className={inputClass} value={form.recurrenceEnd} onChange={(e) => setForm({ ...form, recurrenceEnd: e.target.value })} /></Field>
              </>
            )}
            <Field label="Algus" required><input type="time" className={inputClass} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Field>
            <Field label="Lõpp" required><input type="time" className={inputClass} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Field>
            <Field label="Avaliku kalendri tekst" required><input className={inputClass} value={form.publicTitle} onChange={(e) => setForm({ ...form, publicTitle: e.target.value })} placeholder="nt Rahvatantsu proov või Ringitegevus" /></Field>
            <Field label="Kuvamise viis"><select className={inputClass} value={form.displayMode} onChange={(e) => setForm({ ...form, displayMode: e.target.value })}><option value="category">Üldise kategooriana</option><option value="full">Täpse tekstina</option><option value="neutral">Neutraalselt: ruum kasutuses</option></select></Field>
            <Field label="Lisainfo juhatajale"><textarea className={`${inputClass} min-h-[110px] md:col-span-2`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Lisa selgitus, miks muudatus vajalik on või mida juhataja peaks teadma." /></Field>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
            <b>Eelvaade:</b> {form.recurrence === 'weekly' ? `luuakse ${previewCount} korduvat kirjet. ${recurrenceSummary(form)}.` : 'luuakse 1 ühekordne kirje.'}
            {conflictCount > 0 && <span className="mt-1 block font-bold text-rose-800">{conflictCount} kordust kattub olemasoleva ruumikasutusega. Muuda aega või perioodi.</span>}
          </div>
          {availability.status === 'free' && <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900 ring-1 ring-emerald-100">Valitud päeva aeg on kalendri ja puhvri järgi esialgu vaba. Broneerimiseks suletakse {minutesToTime(availability.reservedStart)}–{minutesToTime(availability.reservedEnd)}.</p>}
          {availability.status === 'busy' && <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-900 ring-1 ring-rose-100">Valitud päeva aeg kattub olemasoleva kasutusega. Vali teine aeg või kirjuta juhatajale lisainfo väljale.</p>}
          {message && <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900 ring-1 ring-emerald-100">{message}</p>}
          <button disabled={!canSubmit} onClick={submitInstructorRequest} className="mt-5 w-full rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">Saada kinnitamiseks</button>
        </section>
        <section className="space-y-5">
          <MonthCalendar roomId={selectedRoom.id} selectedDate={selectedDateForPanel || '2026-06-09'} setSelectedDate={(date) => setForm({ ...form, date, recurrenceStart: form.recurrence === 'weekly' ? date : form.recurrenceStart, weekday: weekdayValue(date) })} events={events} />
          <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black">Valitud ruumi kasutus</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Kalender näitab valitud rahvamaja ja ruumi kinnitatud ning ootel kasutusi. Päeva valimisel näed täpseid aegu ja vabu vahemikke.</p>
            <div className="mt-4"><AvailabilityPanel events={events} roomId={selectedRoom.id} dateISO={selectedDateForPanel} /></div>
          </div>
        </section>
      </div>
    </Page>
  )
}

function AdminUsageForm({ selectedRole, events, onCreated, refreshData }) {
  const [selectedRoomId, setSelectedRoomId] = useState(rentalRooms[0].id)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    requestType: 'Proov',
    recurrence: 'single',
    date: '2026-06-09',
    recurrenceStart: '2026-06-09',
    recurrenceEnd: '2026-06-09',
    weekday: '1',
    startTime: '19:00',
    endTime: '21:00',
    publicTitle: 'Ringitegevus',
    displayMode: 'category',
    notes: ''
  })

  const selectedRoom = getRoomById(selectedRoomId)
  const usageDates = usageDatesFromForm(form)
  const availabilityChecks = usageDates.map((date) => ({ date, availability: getAvailability(selectedRoom.id, date, form.startTime, form.endTime, events) }))
  const conflictCount = availabilityChecks.filter((item) => item.availability.status !== 'free').length
  const selectedDateForPanel = form.recurrence === 'weekly' ? (form.recurrenceStart || form.date) : form.date
  const canSubmit = usageDates.length > 0 && form.startTime && form.endTime && form.publicTitle && conflictCount === 0

  async function createAdminUsage(status) {
    if (!canSubmit) return

    let kind = 'booking';
    if (form.requestType === 'Sündmus') kind = 'event';
    else if (form.requestType === 'Proov' || form.requestType === 'Lisaproov') kind = 'activity';
    else if (form.requestType === 'Sisemine kasutus' || form.requestType === 'Koosolek') kind = 'internal';

    const seriesId = form.recurrence === 'weekly' ? `SEERIA-${Date.now()}` : ''
    const created = []
    
    for (let index = 0; index < usageDates.length; index += 1) {
      const date = usageDates[index]
      const availability = getAvailability(selectedRoom.id, date, form.startTime, form.endTime, events)
      const usageId = `${status === 'kinnitatud' ? 'KT' : 'OT'}-${Date.now()}-${index + 1}`
      const payload = {
        action: 'createUsage',
        bookingId: usageId,
        kind,
        type: form.requestType,
        status,
        instructorId: selectedRole || 'admin',
        collective: form.publicTitle,
        house: selectedRoom.house,
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        date,
        startTime: form.startTime,
        endTime: form.endTime,
        reservedStartTime: minutesToTime(availability.reservedStart),
        reservedEndTime: minutesToTime(availability.reservedEnd),
        bufferBeforeMinutes: selectedRoom.bufferBeforeMinutes || 0,
        bufferAfterMinutes: selectedRoom.bufferAfterMinutes || 0,
        hours: Math.max(0, (timeToMinutes(form.endTime) - timeToMinutes(form.startTime)) / 60),
        eventType: form.requestType,
        participants: '',
        publicEvent: form.displayMode !== 'neutral',
        name: selectedRole === 'admin' ? 'Administraator / kunstiline juht' : 'Rahvamaja juht',
        email: bookingSettings.defaultEmail,
        phone: '',
        publicTitle: form.displayMode === 'neutral' ? 'Rahvamaja kasutuses' : form.publicTitle,
        displayMode: form.displayMode,
        notes: [form.notes, seriesId ? `Korduv tegevus: ${recurrenceSummary(form)}. Seeria ID: ${seriesId}. Kord ${index + 1}/${usageDates.length}.` : ''].filter(Boolean).join('\n'),
        disclaimer: status === 'kinnitatud' ? 'Sisestatud ja kinnitatud töötaja vaates.' : 'Sisestatud töötaja vaates ja jäetud ootele.',
        suppressStaffEmail: (form.recurrence === 'weekly' && index > 0) || status === 'kinnitatud'
      }
      await postToAppsScript(payload)
      const item = { ...payload, id: usageId, status, calendarText: payload.publicTitle }
      created.push(item)
      onCreated?.(item)
    }
    setMessage(status === 'kinnitatud' ? `Loodi ja kinnitati ${created.length} kalendrikirjet.` : `Loodi ${created.length} ootel kalendrikirjet.`)
    setForm((current) => ({ ...current, notes: '' }))
    setTimeout(refreshData, 900)
  }

  return (
    <section className="mt-6 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-black">Lisa tegevus või korduv proov</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Juhataja ja administraator saavad sisestada ühekordse või korduva tegevuse ning salvestada selle ootele või kohe kinnitada.</p>
        </div>
        <Pill>{usageDates.length || 0} kirjet</Pill>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Field label="Tegevuse liik" required><select className={inputClass} value={form.requestType} onChange={(e) => setForm({ ...form, requestType: e.target.value })}><option>Proov</option><option>Lisaproov</option><option>Sündmus</option><option>Sisemine kasutus</option><option>Koosolek</option></select></Field>
        <Field label="Ruum" required><select className={inputClass} value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)}>{rentalRooms.map((room) => <option key={room.id} value={room.id}>{room.house} · {room.name}</option>)}</select></Field>
        <Field label="Kordus" required><select className={inputClass} value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}><option value="single">Ühekordne tegevus</option><option value="weekly">Kordub iga nädal</option></select></Field>
        <Field label="Avaliku kalendri tekst" required><input className={inputClass} value={form.publicTitle} onChange={(e) => setForm({ ...form, publicTitle: e.target.value })} placeholder="nt Segakoori proov või Ringitegevus" /></Field>
        {form.recurrence === 'single' ? (
          <Field label="Kuupäev" required><input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value, recurrenceStart: e.target.value, recurrenceEnd: e.target.value, weekday: weekdayValue(e.target.value) })} /></Field>
        ) : (
          <>
            <Field label="Nädalapäev" required><select className={inputClass} value={form.weekday} onChange={(e) => setForm({ ...form, weekday: e.target.value })}>{WEEKDAY_OPTIONS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></Field>
            <Field label="Perioodi algus" required><input type="date" className={inputClass} value={form.recurrenceStart} onChange={(e) => setForm({ ...form, recurrenceStart: e.target.value, date: e.target.value })} /></Field>
            <Field label="Perioodi lõpp" required><input type="date" className={inputClass} value={form.recurrenceEnd} onChange={(e) => setForm({ ...form, recurrenceEnd: e.target.value })} /></Field>
          </>
        )}
        <Field label="Algus" required><input type="time" className={inputClass} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Field>
        <Field label="Lõpp" required><input type="time" className={inputClass} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Field>
        <Field label="Kuvamise viis"><select className={inputClass} value={form.displayMode} onChange={(e) => setForm({ ...form, displayMode: e.target.value })}><option value="category">Üldise kategooriana</option><option value="full">Täpse tekstina</option><option value="neutral">Neutraalselt: rahvamaja kasutuses</option></select></Field>
        <Field label="Lisainfo"><textarea className={`${inputClass} min-h-[90px] lg:col-span-4`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Sisemine märkus, erandid või korralduslik info." /></Field>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
        <b>Eelvaade:</b> {form.recurrence === 'weekly' ? `${recurrenceSummary(form)}. Luuakse ${usageDates.length} kirjet.` : 'Ühekordne tegevus.'}
        {conflictCount > 0 && <span className="mt-1 block font-bold text-rose-800">{conflictCount} kirjet kattub olemasoleva ruumikasutusega. Muuda aega, ruumi või perioodi.</span>}
      </div>
      <div className="mt-4"><AvailabilityPanel events={events} roomId={selectedRoom.id} dateISO={selectedDateForPanel} /></div>
      {message && <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900 ring-1 ring-emerald-100">{message}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        <button disabled={!canSubmit} onClick={() => createAdminUsage('ootel')} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-800 hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300">Salvesta ootele</button>
        <button disabled={!canSubmit} onClick={() => createAdminUsage('kinnitatud')} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">Salvesta ja kinnita</button>
      </div>
    </section>
  )
}

function AdminBookingCard({ booking, onApprove, onCancel, onUpdatePublicTitle }) {
  const room = getRoomById(booking.roomId || roomIdFromHouseAndRoom(booking.house, booking.roomName || booking.room))
  return (
    <article className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{booking.type || 'broneering'} · {booking.status}</p>
          <h3 className="mt-1 text-lg font-black">{booking.house || room.house} · {booking.roomName || booking.room || room.name}</h3>
          <p className="mt-1 text-sm font-bold text-slate-600">{booking.dateISO || booking.date} · {booking.startTime}–{booking.endTime}</p>
          <p className="mt-1 text-sm text-slate-500">Broneerimiseks suletud: <b>{booking.reservedStartTime || booking.startTime}–{booking.reservedEndTime || booking.endTime}</b></p>
          <p className="mt-2 text-sm text-slate-600">{booking.name || booking.submittedBy || 'Klient'} · {booking.email || ''} · {booking.phone || ''}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">{booking.bookingId || booking.id}</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <Field label="Avaliku kalendri tekst">
          <input className={inputClass} value={booking.publicTitle || 'Ruum broneeritud'} onChange={(e) => onUpdatePublicTitle(booking.bookingId || booking.id, e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          {normalizeStatusForCalendar(booking.status) === 'pending' && <button onClick={() => onApprove(booking)} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white hover:bg-emerald-800">Kinnita</button>}
          <button onClick={() => onCancel(booking)} className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-800 ring-1 ring-rose-100 hover:bg-rose-100">Tühista</button>
        </div>
      </div>
      {booking.notes && <p className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">{booking.notes}</p>}
    </article>
  )
}

function AdminView({ setView, selectedRole, events, activities, bookings, setBookings, refreshData, setSheetUsages }) {
  const role = roles.find((r) => r.id === selectedRole)
  const pending = bookings.filter((item) => normalizeStatusForCalendar(item.status) === 'pending')
  const confirmed = bookings.filter((item) => normalizeStatusForCalendar(item.status) === 'published')
  const [tab, setTab] = useState('pending')
  const visible = tab === 'pending' ? pending : confirmed

  function updateLocalBooking(id, changes) {
    setBookings((current) => current.map((item) => (String(item.bookingId || item.id) === String(id) ? { ...item, ...changes } : item)))
  }

  async function approve(booking) {
    const id = booking.bookingId || booking.id
    const updated = { ...booking, status: 'kinnitatud', publicTitle: booking.publicTitle || 'Ruum broneeritud' }
    updateLocalBooking(id, updated)
    setSheetUsages((current) => {
      const exists = current.some((item) => String(item.bookingId || item.id) === String(id))
      return exists ? current.map((item) => String(item.bookingId || item.id) === String(id) ? updated : item) : [...current, updated]
    })
    await postToAppsScript({ action: 'updateStatus', bookingId: id, status: 'kinnitatud', publicTitle: updated.publicTitle })
    setTimeout(refreshData, 900)
  }

  async function cancel(booking) {
    const id = booking.bookingId || booking.id
    updateLocalBooking(id, { status: 'tühistatud' })
    await postToAppsScript({ action: 'updateStatus', bookingId: id, status: 'tühistatud', publicTitle: booking.publicTitle || 'Ruum broneeritud' })
    setTimeout(refreshData, 900)
  }

  function updatePublicTitle(id, value) {
    updateLocalBooking(id, { publicTitle: value })
  }

  function handleAdminUsageCreated(item) {
    setBookings((current) => {
      const exists = current.some((booking) => String(booking.bookingId || booking.id) === String(item.bookingId || item.id))
      return exists ? current : [...current, item]
    })
    setSheetUsages((current) => {
      const exists = current.some((usage) => String(usage.bookingId || usage.id) === String(item.bookingId || item.id))
      return exists ? current : [...current, item]
    })
  }

  return (
    <Page>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionHeader eyebrow="Sisuhaldus" title={`Töölaud: ${role?.label || ''}`} text="PIN-koodiga vaates saab broneeringuid kinnitada. Kinnitamisel muutub kirje avalikus ruumikalendris kohe nähtavaks." />
        <button onClick={refreshData} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-200">Värskenda andmeid</button>
      </div>
      <div className="grid gap-5 md:grid-cols-4">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Ootel</p><p className="mt-2 text-4xl font-black">{pending.length}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Kinnitatud</p><p className="mt-2 text-4xl font-black">{confirmed.length}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Avalikke sündmusi</p><p className="mt-2 text-4xl font-black">{events.filter(e => e.displayMode === 'full').length}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Ringe</p><p className="mt-2 text-4xl font-black">{activities.length}</p></div>
      </div>
      <AdminUsageForm selectedRole={selectedRole} events={events} onCreated={handleAdminUsageCreated} refreshData={refreshData} />
      <section className="mt-6 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">Broneeringud</h2>
          <div className="flex gap-2">
            <button onClick={() => setTab('pending')} className={cx('rounded-xl px-4 py-2 text-sm font-black ring-1', tab === 'pending' ? 'bg-emerald-700 text-white ring-emerald-700' : 'bg-white text-slate-700 ring-slate-200')}>Ootel</button>
            <button onClick={() => setTab('confirmed')} className={cx('rounded-xl px-4 py-2 text-sm font-black ring-1', tab === 'confirmed' ? 'bg-emerald-700 text-white ring-emerald-700' : 'bg-white text-slate-700 ring-slate-200')}>Kinnitatud</button>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {visible.length ? visible.map((booking) => <AdminBookingCard key={booking.bookingId || booking.id} booking={booking} onApprove={approve} onCancel={cancel} onUpdatePublicTitle={updatePublicTitle} />) : <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600 ring-1 ring-slate-200">Selles vaates ei ole kirjeid.</p>}
        </div>
      </section>
      <button onClick={() => setView('home')} className="mt-5 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-800">Tagasi avalehele</button>
    </Page>
  )
}

export default function App() {
  const [view, setView] = useState('home')
  const [selectedRole, setSelectedRole] = useState('director')
  const [selectedRoomId, setSelectedRoomId] = useState(rentalRooms[0].id)
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [bookingDraft, setBookingDraft] = useState(null)
  const [adminPin, setAdminPin] = useState('')
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false)
  const [sheetUsages, setSheetUsages] = useState([])
  const [bookings, setBookings] = useState([])
  const [instructorSession, setInstructorSession] = useState(null)
  const [dataStatus, setDataStatus] = useState('Andmeid ei ole veel laaditud.')

  async function refreshData() {
    if (!bookingSettings.appsScriptUrl) {
      setDataStatus('Apps Scripti URL puudub, kasutatakse näidisandmeid.')
      return
    }
    try {
      setDataStatus('Laen Google Sheetist andmeid...')
      const data = await jsonp(bookingSettings.appsScriptUrl, { action: 'list' })
      if (data?.ok) {
        setBookings(data.bookings || [])
        setSheetUsages(data.usages || [])
        setDataStatus(`Andmed laaditud: ${(data.usages || []).filter(item => normalizeStatusForCalendar(item.status) === 'published').length} kinnitatud ja ${(data.bookings || []).filter(item => normalizeStatusForCalendar(item.status) === 'pending').length} ootel broneeringut.`)
      } else {
        setDataStatus('Google Sheetist andmete laadimine ei õnnestunud, kasutatakse näidisandmeid.')
      }
    } catch (error) {
      setDataStatus('Andmete laadimine ebaõnnestus, kasutatakse näidisandmeid.')
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  useEffect(() => {
    if (view === 'admin' && isAdminUnlocked) refreshData()
  }, [view, isAdminUnlocked])

  function handleBookingCreated(booking) {
    setBookings((current) => {
      const exists = current.some((item) => String(item.bookingId || item.id) === String(booking.bookingId || booking.id))
      return exists ? current : [{ ...booking, publicTitle: booking.publicTitle || 'Broneeritud (ootab kinnitamist)' }, ...current]
    })
    setSheetUsages((current) => {
      const exists = current.some((item) => String(item.bookingId || item.id) === String(booking.bookingId || booking.id))
      return exists ? current : [{ ...booking, publicTitle: booking.publicTitle || 'Broneeritud (ootab kinnitamist)' }, ...current]
    })
  }

  function handleUsageCreated(usage) {
    setBookings((current) => {
      const exists = current.some((item) => String(item.bookingId || item.id) === String(usage.bookingId || usage.id))
      return exists ? current : [{ ...usage, publicTitle: usage.publicTitle || 'Kasutus ootab kinnitamist' }, ...current]
    })
    setSheetUsages((current) => {
      const exists = current.some((item) => String(item.bookingId || item.id) === String(usage.bookingId || usage.id))
      return exists ? current : [{ ...usage, publicTitle: usage.publicTitle || 'Kasutus ootab kinnitamist' }, ...current]
    })
  }

  const combinedSheetUsages = useMemo(() => {
    const map = new Map()
    ;[...sheetUsages, ...bookings.filter((item) => ['ootel', 'pending', 'kinnitatud', 'published'].includes(String(item.status || '').toLowerCase()))].forEach((item) => {
      const key = String(item.bookingId || item.id || `${item.roomId}-${item.dateISO || item.date}-${item.startTime}-${item.endTime}`)
      if (!map.has(key)) map.set(key, item)
      else map.set(key, { ...map.get(key), ...item })
    })
    return Array.from(map.values())
  }, [sheetUsages, bookings])
  
  const sheetEvents = useMemo(() => combinedSheetUsages.map(bookingToCalendarEvent).filter((item) => ['published', 'pending'].includes(item.status)), [combinedSheetUsages])
  const events = useMemo(() => [...initialEvents, ...sheetEvents], [sheetEvents])
  const activities = initialActivities
  const selectedEvent = useMemo(() => events.find((event) => String(event.id) === String(selectedEventId)), [events, selectedEventId])

  function openEventDetails(event) {
    setSelectedEventId(event.id)
    setView('eventDetail')
  }

  return (
    <div className="min-h-screen bg-[#f8faf7] font-sans text-slate-900">
      <Header view={view} setView={setView} />
      <div className="mx-auto max-w-7xl px-4 pt-3 text-xs font-bold text-slate-500 md:px-8">{dataStatus}</div>
      {view === 'home' && <HomeView setView={setView} events={events} openEventDetails={openEventDetails} />}
      {view === 'events' && <EventsView events={events} openEventDetails={openEventDetails} />}
      {view === 'eventDetail' && <EventDetailView event={selectedEvent} setView={setView} setSelectedRoomId={setSelectedRoomId} />}
      {view === 'availability' && <AvailabilityView events={events} setView={setView} setSelectedRoomId={setSelectedRoomId} />}
      {view === 'roomDetail' && <RoomDetailView selectedRoomId={selectedRoomId} setSelectedRoomId={setSelectedRoomId} events={events} setView={setView} setBookingDraft={setBookingDraft} />}
      {view === 'booking' && <BookingView key={`${bookingDraft?.roomId || 'default'}-${bookingDraft?.date || 'date'}-${bookingDraft?.startTime || 'start'}-${bookingDraft?.endTime || 'end'}`} events={events} initialDraft={bookingDraft} onBookingCreated={handleBookingCreated} />}
      {view === 'activities' && <ActivitiesView activities={activities} />}
      {view === 'houses' && <HousesView />}
      {view === 'contact' && <ContactView />}
      {view === 'instructor' && <InstructorView events={events} onUsageCreated={handleUsageCreated} initialInstructor={instructorSession} clearInstructorSession={() => setInstructorSession(null)} />}
      {view === 'login' && <LoginView setView={setView} selectedRole={selectedRole} setSelectedRole={setSelectedRole} adminPin={adminPin} setAdminPin={setAdminPin} isAdminUnlocked={isAdminUnlocked} setIsAdminUnlocked={setIsAdminUnlocked} setInstructorSession={setInstructorSession} />}
      {view === 'admin' && (isAdminUnlocked ? <AdminView setView={setView} selectedRole={selectedRole} events={events} activities={activities} bookings={bookings} setBookings={setBookings} refreshData={refreshData} setSheetUsages={setSheetUsages} /> : <LoginView setView={setView} selectedRole={selectedRole} setSelectedRole={setSelectedRole} adminPin={adminPin} setAdminPin={setAdminPin} isAdminUnlocked={isAdminUnlocked} setIsAdminUnlocked={setIsAdminUnlocked} setInstructorSession={setInstructorSession} />)}
      <MobileNav view={view} setView={setView} />
    </div>
  )
}
