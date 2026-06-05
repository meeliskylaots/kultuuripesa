import React, { useMemo, useState } from 'react'
import {
  bookingSettings,
  filters,
  houses,
  initialActivities,
  initialEvents,
  initialRequests,
  rentalRooms,
  rentalServices,
  roles
} from './data.js'

const VIEW_LABELS = {
  home: 'Avaleht',
  events: 'Sündmused',
  availability: 'Vabad ajad',
  booking: 'Broneeri',
  activities: 'Ringid',
  houses: 'Rahvamajad',
  contact: 'Kontakt',
  login: 'Töötajale',
  admin: 'Sisuhaldus'
}

const EVENT_TYPE_OPTIONS = ['Eraüritus', 'Koosolek', 'Koolitus', 'Töötuba', 'Kontsert', 'Kogukonnaüritus', 'Muu']

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
  if (item.displayMode === 'neutral') return item.publicTitle || 'Ruum broneeritud'
  if (item.displayMode === 'category') return item.publicTitle || item.category || 'Rahvamaja kasutuses'
  return item.publicTitle || item.title
}

function getRoomById(roomId) {
  return rentalRooms.find((room) => room.id === roomId) || rentalRooms[0]
}

function getBlockingItems(events, activities) {
  const eventItems = events
    .filter((item) => item.blocksRoom && item.status === 'published')
    .map((item) => ({ ...item, sourceType: 'event' }))
  const activityItems = activities
    .filter((item) => item.blocksRoom && item.status === 'published')
    .map((item) => ({ ...item, sourceType: 'activity', category: 'Ringitegevus', price: '' }))
  return [...eventItems, ...activityItems]
}

function getRoomDayItems(roomId, dateISO, events, activities) {
  return getBlockingItems(events, activities)
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

function getAvailability(roomId, dateISO, startTime, endTime, events, activities) {
  const room = getRoomById(roomId)
  const items = getRoomDayItems(roomId, dateISO, events, activities)
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
    ['availability', 'Vabad ajad'],
    ['booking', 'Ruumide rent'],
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
            <button key={id} onClick={() => setView(id)} className={cx('hover:text-emerald-700', view === id && 'text-emerald-700')}>{label}</button>
          ))}
        </nav>
        <div className="hidden gap-2 md:flex">
          <button onClick={() => setView('login')} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Töötajale</button>
          <button onClick={() => setView('events')} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-200">Vaata sündmusi</button>
          <button onClick={() => setView('booking')} className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">Broneeri ruum</button>
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

function ActionCard({ title, text, icon, onClick }) {
  return (
    <button onClick={onClick} className="group rounded-[1.5rem] bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl ring-1 ring-emerald-100">{icon}</div>
      <h3 className="text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      <p className="mt-4 text-sm font-black text-emerald-700">Ava →</p>
    </button>
  )
}

function HomeView({ setView, events }) {
  const upcoming = events.filter((event) => event.status === 'published' && event.public && event.displayMode === 'full').slice(0, 3)
  return (
    <Page>
      <section className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 ring-1 ring-emerald-100">Rannu ja Konguta kultuurielu ühest kohast</p>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Leia sündmused, vabad ajad ja ruumid kiiresti.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Avaleht on lühike teejuht. Vali, kas soovid tulla sündmusele, kontrollida ruumi vaba aega või saata broneeringusoovi.</p>
        </div>
        <div className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="rounded-[1.5rem] bg-gradient-to-br from-emerald-100 via-white to-amber-50 p-5">
            <h2 className="mb-4 text-xl font-black">Mida soovid teha?</h2>
            <div className="grid gap-3">
              <button onClick={() => setView('events')} className="flex items-center justify-between rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-white hover:bg-slate-50"><span><b>Vaadata sündmusi</b><span className="block text-sm text-slate-500">Kontserdid, töötoad ja kogukonnaüritused</span></span><span>→</span></button>
              <button onClick={() => setView('availability')} className="flex items-center justify-between rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-white hover:bg-slate-50"><span><b>Kontrollida ruumi vaba aega</b><span className="block text-sm text-slate-500">Näed hõivatud ja vabu aegu</span></span><span>→</span></button>
              <button onClick={() => setView('booking')} className="flex items-center justify-between rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-white hover:bg-slate-50"><span><b>Broneerida ruum</b><span className="block text-sm text-slate-500">Vali aeg, teenused ja saada soov</span></span><span>→</span></button>
            </div>
          </div>
        </div>
      </section>
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <ActionCard icon="📅" title="Sündmused" text="Vaata lähiaja avalikke sündmusi ja registreerimisinfot." onClick={() => setView('events')} />
        <ActionCard icon="🏠" title="Vabad ajad" text="Kontrolli ruumipõhiselt, millal rahvamaja on kasutuses või vaba." onClick={() => setView('availability')} />
        <ActionCard icon="✍️" title="Broneeri ruum" text="Saada broneeringusoov alles pärast vaba aja kontrolli." onClick={() => setView('booking')} />
      </section>
      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Tulekul</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Lähimad sündmused</h2>
          </div>
          <button onClick={() => setView('events')} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-200">Vaata kõiki</button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {upcoming.map((event) => <EventCard key={event.id} event={event} compact />)}
        </div>
      </section>
    </Page>
  )
}

function Pill({ children }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{children}</span>
}

function EventCard({ event, compact = false }) {
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
        <button className="mt-5 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">Vaata lähemalt</button>
      </div>
    </article>
  )
}

function EventsView({ events }) {
  const [filter, setFilter] = useState('Kõik')
  const [query, setQuery] = useState('')
  const publicEvents = events.filter((event) => event.status === 'published' && event.public && event.displayMode === 'full')
  const filtered = publicEvents.filter((event) => {
    const text = `${event.title} ${event.house} ${event.audience} ${event.category} ${event.description}`.toLowerCase()
    const q = text.includes(query.toLowerCase())
    const f = filter === 'Kõik' || event.house.includes(filter) || event.audience === filter || event.price === filter || (filter === 'Registreerimisega' && event.registration)
    return q && f
  })
  return (
    <Page>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeader eyebrow="Sündmused" title="Mis lähiajal toimub?" text="Avalikus sündmuste vaates on need tegevused, mille detailid on mõeldud osalejale." />
        <div className="w-full rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 md:max-w-sm"><label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Otsi</label><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Näiteks peredele, kontsert, Rannu..." /></div>
      </div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={cx('rounded-full px-4 py-2 text-sm font-black ring-1', filter === item ? 'bg-emerald-700 text-white ring-emerald-700' : 'bg-white text-slate-700 ring-slate-200')}>{item}</button>)}</div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map((event) => <EventCard key={event.id} event={event} />)}</div>
    </Page>
  )
}

function AvailabilityPanel({ events, activities, roomId, dateISO }) {
  const room = getRoomById(roomId)
  const items = getRoomDayItems(roomId, dateISO, events, activities)
  const freeSlots = getFreeSlots(items)
  return (
    <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-xl font-black text-slate-950">{room.house} · {room.name}</h3><p className="mt-1 text-sm text-slate-600">{dateISO ? displayDate(dateISO) : 'Vali kuupäev'} · puhver {room.bufferBeforeMinutes} min enne ja {room.bufferAfterMinutes} min pärast.</p></div>
        <Pill>broneeringukontroll</Pill>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Ruum on kasutuses</h4>
          {items.length === 0 && <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900 ring-1 ring-emerald-100">Sellel päeval ei ole kinnitatud kasutusi.</p>}
          <div className="space-y-2">
            {items.map((item) => {
              const buffer = getBufferedRange(item)
              return <div key={`${item.sourceType}-${item.id}`} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><p className="font-black">{getPublicTitle(item)}</p><p className="mt-1 text-sm text-slate-600">Tegelik aeg: {item.startTime}–{item.endTime}</p><p className="mt-1 text-sm font-bold text-slate-900">Broneerimiseks suletud: {minutesToTime(buffer.start)}–{minutesToTime(buffer.end)}</p></div>
            })}
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Vabad ajavahemikud</h4>
          <div className="space-y-2">
            {freeSlots.map((slot, index) => <div key={index} className="rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-900 ring-1 ring-emerald-100">{minutesToTime(slot.start)}–{minutesToTime(slot.end)}</div>)}
          </div>
        </div>
      </div>
    </div>
  )
}

function AvailabilityView({ events, activities, setView }) {
  const [roomId, setRoomId] = useState(rentalRooms[0].id)
  const [dateISO, setDateISO] = useState('2026-06-20')
  return (
    <Page>
      <SectionHeader eyebrow="Ruumide kasutus ja vabad ajad" title="Kontrolli ruumi vaba aega" text="Avalik vaade näitab kõiki ruumi kasutusi vähemalt hõivatuse tasemel. Eraürituse detailid ei ole avalikud, kuid aeg on nähtav kui ruumi kasutus." />
      <div className="mb-5 grid gap-3 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-3">
        <label><span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Ruum</span><select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-slate-200">{rentalRooms.map((room) => <option key={room.id} value={room.id}>{room.house} · {room.name}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Kuupäev</span><input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-slate-200" /></label>
        <div className="flex items-end"><button onClick={() => setView('booking')} className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white hover:bg-emerald-800">Jätka broneerima</button></div>
      </div>
      <AvailabilityPanel events={events} activities={activities} roomId={roomId} dateISO={dateISO} />
    </Page>
  )
}

function StepBadge({ step, current, label }) {
  return <div className={cx('rounded-2xl px-3 py-2 text-xs font-black ring-1', step === current ? 'bg-emerald-700 text-white ring-emerald-700' : step < current ? 'bg-emerald-50 text-emerald-800 ring-emerald-100' : 'bg-white text-slate-500 ring-slate-200')}>{step}. {label}</div>
}

function BookingView({ events, activities }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    roomId: rentalRooms[0].id,
    date: '2026-06-20',
    startTime: '18:00',
    endTime: '22:00',
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
  const availability = getAvailability(form.roomId, form.date, form.startTime, form.endTime, events, activities)
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
    const payload = {
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
        await fetch(bookingSettings.appsScriptUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
        setSubmitMessage('Broneeringusoov saadeti. Kontrolli ka e-posti kinnitust.')
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
      <SectionHeader eyebrow="Ruumide rent" title="Broneeri ruum samm-sammult" text="Kõigepealt kontrollime ruumi ja aja sobivust. Alles pärast seda küsime sündmuse, teenuste ja kontaktide infot." />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2"><StepBadge step={1} current={step} label="Ruum ja aeg" /><StepBadge step={2} current={step} label="Sündmus" /><StepBadge step={3} current={step} label="Teenused" /><StepBadge step={4} current={step} label="Kontakt" /></div>
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="rounded-[1.5rem] bg-slate-950 p-6 text-white lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm font-black uppercase tracking-wide text-white/50">Orienteeruv hind</p>
          <p className="mt-3 text-4xl font-black">{formatEuro(estimatedTotal)}</p>
          <div className="mt-5 space-y-2 text-sm text-white/75"><div className="flex justify-between"><span>Ruum {billableHours} h × {formatEuro(room.hourlyRate)}</span><b>{formatEuro(roomCost)}</b></div><div className="flex justify-between"><span>Koristus ja ettevalmistus</span><b>hinnas</b></div>{selectedServices.length ? selectedServices.map((s) => <div key={s.id} className="flex justify-between"><span>{s.label}</span><b>{formatEuro(s.total)}</b></div>) : <div className="flex justify-between"><span>Lisateenuseid ei ole valitud</span><b>{formatEuro(0)}</b></div>}</div>
          <p className="mt-5 text-xs leading-5 text-white/55">{bookingSettings.priceDisclaimer}</p>
        </aside>
        <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          {step === 1 && <BookingStepRoom form={form} setForm={setForm} availability={availability} room={room} events={events} activities={activities} onNext={() => setStep(2)} canNext={canContinueFromStep1} />}
          {step === 2 && <BookingStepEvent form={form} setForm={setForm} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
          {step === 3 && <BookingStepServices form={form} room={room} toggleService={toggleService} selectedServices={selectedServices} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
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

function BookingStepRoom({ form, setForm, availability, room, events, activities, onNext, canNext }) {
  return <div><h2 className="text-2xl font-black">1. Vali ruum ja aeg</h2><p className="mt-2 text-sm leading-6 text-slate-600">Broneeringule lisatakse automaatselt ruumi puhver: {room.bufferBeforeMinutes} min enne ja {room.bufferAfterMinutes} min pärast.</p><div className="mt-5 grid gap-3 md:grid-cols-2"><Field label="Ruum" required><select className={inputClass} value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>{rentalRooms.map((room) => <option key={room.id} value={room.id}>{room.house} · {room.name}</option>)}</select></Field><Field label="Kuupäev" required><input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field><Field label="Algusaeg" required><input type="time" className={inputClass} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Field><Field label="Lõpuaeg" required><input type="time" className={inputClass} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Field></div><div className="mt-5"><AvailabilityPanel events={events} activities={activities} roomId={form.roomId} dateISO={form.date} /></div>{availability.status === 'free' && <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900 ring-1 ring-emerald-100">Valitud aeg on kalendri ja puhvri põhjal esialgu vaba. Ruum hoitakse arvestuslikult kinni {minutesToTime(availability.reservedStart)}–{minutesToTime(availability.reservedEnd)}.</div>}{availability.status === 'busy' && <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-900 ring-1 ring-rose-100"><b>Valitud aeg ei ole saadaval.</b><p className="mt-1">Puhvriga aeg {minutesToTime(availability.reservedStart)}–{minutesToTime(availability.reservedEnd)} kattub olemasoleva kasutusega.</p></div>}{availability.status === 'invalid' && <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-900 ring-1 ring-amber-100">Lõpuaeg peab olema algusajast hilisem.</div>}<div className="mt-5 flex justify-end"><button disabled={!canNext} onClick={onNext} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">Jätka</button></div></div>
}

function BookingStepEvent({ form, setForm, onBack, onNext }) {
  const canNext = form.eventType && form.participants
  return <div><h2 className="text-2xl font-black">2. Sündmuse info</h2><div className="mt-5 grid gap-3 md:grid-cols-2"><Field label="Sündmuse liik" required><select className={inputClass} value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}><option value="">Vali liik</option>{EVENT_TYPE_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Osalejate arv" required><input className={inputClass} value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} placeholder="nt 40" /></Field><label className="md:col-span-2 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><input type="checkbox" checked={form.publicEvent} onChange={(e) => setForm({ ...form, publicEvent: e.target.checked })} className="mt-1" /><span><b>Soovin, et sündmus oleks avalikus kalendris detailidega nähtav.</b><span className="block text-sm text-slate-600">Kui mitte, kuvatakse kasutuskalendris neutraalne tekst, näiteks “Ruum broneeritud”.</span></span></label><Field label="Lisainfo"><textarea className={`${inputClass} min-h-[110px] md:col-span-2`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Kirjelda lisasoove, tehnilisi vajadusi või muid olulisi asjaolusid." /></Field></div><div className="mt-5 flex justify-between"><button onClick={onBack} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-800">Tagasi</button><button disabled={!canNext} onClick={onNext} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:bg-slate-300">Jätka</button></div></div>
}

function BookingStepServices({ form, room, toggleService, selectedServices, onBack, onNext }) {
  return <div><h2 className="text-2xl font-black">3. Teenused ja hind</h2><div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><h3 className="font-black">{room.house} · {room.name}</h3><p className="mt-1 text-sm text-slate-600">{room.description}</p><div className="mt-4"><p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Rendi hinna sees</p><div className="flex flex-wrap gap-2">{room.included.map((item) => <Pill key={item}>{item}</Pill>)}</div></div><div className="mt-4"><p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Eraldi kokkuleppel</p><div className="flex flex-wrap gap-2">{room.agreement.map((item) => <Pill key={item}>{item}</Pill>)}</div></div></div><div className="mt-5 grid gap-3 md:grid-cols-2">{rentalServices.map((service) => <label key={service.id} className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 hover:bg-slate-50"><input type="checkbox" checked={form.services.includes(service.id)} onChange={() => toggleService(service.id)} className="mt-1" /><span><b>{service.label}</b><span className="block text-sm text-slate-600">{service.description}</span><span className="mt-2 block text-sm font-black text-emerald-700">{service.pricing === 'hourly' ? `${formatEuro(service.price)} / h` : formatEuro(service.price)}</span></span></label>)}</div><div className="mt-5 flex justify-between"><button onClick={onBack} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-800">Tagasi</button><button onClick={onNext} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white">Jätka</button></div></div>
}

function BookingStepContact({ form, setForm, onBack, onSubmit, submitMessage }) {
  const canSubmit = form.name && form.email && form.phone && form.accepted
  return <div><h2 className="text-2xl font-black">4. Kontakt, tingimused ja saatmine</h2><div className="mt-5 grid gap-3 md:grid-cols-2"><Field label="Nimi" required><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="E-post" required><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Telefon" required><input type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field><Field label="Allkirjastamise viis" required><select className={inputClass}><option>Allkirjastan lepingu kohapeal rahvamajas</option><option>Soovin lepingu allkirjastada digitaalselt</option></select></Field></div><details className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><summary className="cursor-pointer font-black">Ruumide kasutamise tingimused, hinnainfo ja isikuandmed</summary><p className="mt-3 text-sm leading-6 text-slate-600">Broneering jõustub pärast rahvamaja kinnitust. Hind on orienteeruv ja kinnitatakse lõplikult pärast ruumi saadavuse ning vajaduste ülevaatamist. Isikuandmeid kasutatakse broneeringu, lepingu ja arve menetlemiseks.</p></details><label className="mt-4 flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200"><input type="checkbox" checked={form.accepted} onChange={(e) => setForm({ ...form, accepted: e.target.checked })} className="mt-1" /><span className="text-sm"><b>Olen tutvunud ruumi kasutamise tingimuste, hinnainfo ja isikuandmete töötlemise põhimõtetega ning nõustun nendega. <span className="text-rose-600">*</span></b></span></label>{submitMessage && <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900 ring-1 ring-emerald-100">{submitMessage}</div>}<div className="mt-5 flex justify-between"><button onClick={onBack} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-800">Tagasi</button><button disabled={!canSubmit} onClick={onSubmit} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:bg-slate-300">Saada broneeringusoov</button></div></div>
}

function ActivitiesView({ activities }) {
  return <Page><SectionHeader eyebrow="Ringid ja tegevused" title="Leia endale sobiv tegevus" text="Siit leiad püsivad tegevused ja huviringid. Liitumise või lisainfo saamiseks võta ühendust." /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{activities.filter(a => a.status === 'published').map((item) => <div key={item.id} className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-black">{item.title}</h3><p className="mt-2 text-sm text-slate-600">{item.house}</p><p className="mt-3 text-sm font-bold text-slate-950">Kellele: {item.audience}</p><p className="mt-1 text-sm text-slate-600">{item.time}</p><button className="mt-5 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 ring-1 ring-emerald-100">{item.contact}</button></div>)}</div></Page>
}

function HousesView() {
  return <Page><SectionHeader eyebrow="Rahvamajad" title="Kaks maja, kaks kohalikku nägu" text="Siia saab hiljem lisada päris fotod rahvamajadest ja ruumidest. Praegu on pildialad fotode kohahoidjad." /><div className="grid gap-5 md:grid-cols-2">{houses.map((house) => <article key={house.name} className="rounded-[1.7rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="mb-5 flex h-52 items-center justify-center rounded-[1.3rem] bg-gradient-to-br from-emerald-100 via-sky-50 to-amber-50 text-sm font-black text-slate-500">Lisa siia päris foto</div><h3 className="text-2xl font-black">{house.name}</h3><p className="mt-2 text-sm font-bold text-slate-500">📍 {house.location}</p><p className="mt-4 leading-7 text-slate-600">{house.description}</p><div className="mt-5 flex flex-wrap gap-2">{house.tags.map(tag => <Pill key={tag}>{tag}</Pill>)}</div></article>)}</div></Page>
}

function ContactView() {
  return <Page><SectionHeader eyebrow="Kontakt" title="Võta ühendust" text="Kirjuta või helista, kui soovid küsida sündmuse, ringi või ruumi kasutamise kohta." /><div className="grid gap-5 md:grid-cols-3">{['Üldkontakt', 'Rannu rahvamaja', 'Konguta rahvamaja'].map((title, index) => <div key={title} className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-black">{title}</h3><p className="mt-3 text-slate-600">{index === 0 ? 'kultuur@elva.ee' : index === 1 ? 'Rannu alevik' : 'Annikoru küla'}</p><p className="mt-1 text-slate-600">+372 0000 0000</p><div className="mt-5 flex flex-wrap gap-2"><a href="tel:+37200000000" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white">Helista</a><a href="mailto:kultuur@elva.ee" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-800">Kirjuta</a></div></div>)}</div></Page>
}

function LoginView({ setView, selectedRole, setSelectedRole }) {
  return <Page><SectionHeader eyebrow="Töötajale" title="Sisene rollipõhisesse vaatesse" text="Prototüübis saad rolli valida. Päris süsteemis asendub see sisselogimisega." /><div className="grid gap-3 md:grid-cols-2">{roles.map(role => <button key={role.id} onClick={() => setSelectedRole(role.id)} className={cx('rounded-2xl p-5 text-left ring-1', selectedRole === role.id ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-200')}><h3 className="font-black">{role.label}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{role.description}</p></button>)}</div><button onClick={() => setView('admin')} className="mt-5 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white">Ava sisuhaldus</button></Page>
}

function AdminView({ setView, selectedRole, events, activities, requests, setRequests }) {
  const pending = requests.filter((r) => r.status === 'ootel')
  const role = roles.find((r) => r.id === selectedRole)
  function approve(id) { setRequests(requests.map(r => r.id === id ? { ...r, status: 'kinnitatud' } : r)) }
  return <Page><SectionHeader eyebrow="Sisuhaldus" title={`Töölaud: ${role?.label || ''}`} text="Siin jääb alles rollipõhine kinnitamise ja avaliku teksti kohendamise põhimõte." /><div className="grid gap-5 md:grid-cols-3"><div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Kinnitusi</p><p className="mt-2 text-4xl font-black">{pending.length}</p></div><div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Sündmusi</p><p className="mt-2 text-4xl font-black">{events.length}</p></div><div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Ringe</p><p className="mt-2 text-4xl font-black">{activities.length}</p></div></div><section className="mt-6 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Kinnitused</h2><div className="mt-4 space-y-3">{requests.map(request => <div key={request.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase text-emerald-700">{request.type}</p><h3 className="mt-1 font-black">{request.title}</h3><p className="mt-1 text-sm text-slate-600">{request.house} · {request.submittedBy}</p><p className="mt-2 text-sm text-slate-500">Avaliku kalendri tekst: <b>{request.publicTitle || request.title}</b></p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">{request.status}</span></div>{request.status === 'ootel' && <button onClick={() => approve(request.id)} className="mt-3 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white">Kinnita</button>}</div>)}</div></section><button onClick={() => setView('home')} className="mt-5 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-800">Tagasi avalehele</button></Page>
}

export default function App() {
  const [view, setView] = useState('home')
  const [selectedRole, setSelectedRole] = useState('director')
  const [events] = useState(initialEvents)
  const [activities] = useState(initialActivities)
  const [requests, setRequests] = useState(initialRequests)

  return (
    <div className="min-h-screen bg-[#f8faf7] font-sans text-slate-900">
      <Header view={view} setView={setView} />
      {view === 'home' && <HomeView setView={setView} events={events} />}
      {view === 'events' && <EventsView events={events} />}
      {view === 'availability' && <AvailabilityView events={events} activities={activities} setView={setView} />}
      {view === 'booking' && <BookingView events={events} activities={activities} />}
      {view === 'activities' && <ActivitiesView activities={activities} />}
      {view === 'houses' && <HousesView />}
      {view === 'contact' && <ContactView />}
      {view === 'login' && <LoginView setView={setView} selectedRole={selectedRole} setSelectedRole={setSelectedRole} />}
      {view === 'admin' && <AdminView setView={setView} selectedRole={selectedRole} events={events} activities={activities} requests={requests} setRequests={setRequests} />}
      <MobileNav view={view} setView={setView} />
    </div>
  )
}
