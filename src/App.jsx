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

const inputClass = 'w-full rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500'

function euro(value) {
  return `${Number(value || 0).toFixed(2).replace('.', ',')} €`
}

function timeToMinutes(value) {
  if (!value || !value.includes(':')) return null
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function minutesToTime(value) {
  const minutes = Math.max(0, Math.min(24 * 60, value))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function calculateHours(start, end, minimumHours = 1) {
  const startMin = timeToMinutes(start)
  const endMin = timeToMinutes(end)
  if (startMin === null || endMin === null || endMin <= startMin) return minimumHours
  return Math.max((endMin - startMin) / 60, minimumHours)
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

function publicUsageTitle(item) {
  if (item.displayMode === 'neutral') return item.publicTitle || 'Ruum broneeritud'
  if (item.displayMode === 'category') return item.publicTitle || 'Ringitegevus'
  return item.publicTitle || item.title || 'Rahvamaja kasutuses'
}

function getRoomUsages(events, activities, bookings) {
  const eventUsages = events
    .filter((item) => ['published', 'kinnitatud'].includes(item.status) && item.blocksRoom !== false)
    .map((item) => ({
      id: `event-${item.id}`,
      source: 'Sündmus',
      title: item.title,
      publicTitle: publicUsageTitle(item),
      house: item.house,
      roomId: item.roomId,
      room: item.room,
      dateISO: item.dateISO,
      date: item.date,
      startTime: item.startTime || item.time,
      endTime: item.endTime || item.time,
      displayMode: item.displayMode || 'full',
      public: true,
      status: item.status,
      details: item.displayMode === 'full' ? item.description : 'Ruum on sel ajal kasutuses.'
    }))

  const activityUsages = activities
    .filter((item) => ['published', 'kinnitatud'].includes(item.status) && item.blocksRoom !== false)
    .map((item) => ({
      id: `activity-${item.id}`,
      source: 'Ring / proov',
      title: item.title,
      publicTitle: publicUsageTitle(item),
      house: item.house,
      roomId: item.roomId,
      room: item.room,
      dateISO: item.dateISO,
      date: item.dateISO,
      startTime: item.startTime,
      endTime: item.endTime,
      displayMode: item.displayMode || 'category',
      public: true,
      status: item.status,
      details: item.displayMode === 'full' ? item.time : 'Rahvamaja ruum on sel ajal kasutuses.'
    }))

  const bookingUsages = bookings
    .filter((item) => ['kinnitatud', 'published'].includes(item.status))
    .map((item, index) => ({
      id: `booking-${item.createdAt || index}`,
      source: 'Broneering',
      title: item.eventType || 'Ruumibroneering',
      publicTitle: item.publicEvent ? (item.eventType || 'Avalik sündmus') : 'Ruum broneeritud',
      house: item.house,
      roomId: item.roomId,
      room: item.roomName,
      dateISO: item.date,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      displayMode: item.publicEvent ? 'category' : 'neutral',
      public: true,
      status: item.status,
      details: item.publicEvent ? 'Kinnitatud ruumikasutus.' : 'Ruum on sel ajal broneeritud.'
    }))

  return [...eventUsages, ...activityUsages, ...bookingUsages]
    .filter((item) => item.dateISO && item.startTime && item.endTime)
    .sort((a, b) => `${a.dateISO} ${a.startTime}`.localeCompare(`${b.dateISO} ${b.startTime}`))
}

function checkAvailability({ room, date, startTime, endTime, usages }) {
  if (!room || !date || !startTime || !endTime) return { ready: false, conflicts: [] }
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  if (start === null || end === null || end <= start) return { ready: true, invalid: true, conflicts: [] }

  const conflicts = usages.filter((item) => {
    if (item.roomId !== room.id || item.dateISO !== date) return false
    const itemStart = timeToMinutes(item.startTime) - (room.bufferBeforeMinutes || 0)
    const itemEnd = timeToMinutes(item.endTime) + (room.bufferAfterMinutes || 0)
    return overlaps(start, end, itemStart, itemEnd)
  })

  return { ready: true, invalid: false, conflicts }
}

function buildBookingEmail(payload) {
  const services = payload.selectedServices.length
    ? payload.selectedServices.map((item) => `- ${item.label}: ${euro(item.total)}`).join('\n')
    : '- Lisateenuseid ei valitud'

  return [
    'RUUMI KASUTAMISE SOOV',
    '',
    `Rahvamaja: ${payload.house}`,
    `Ruum: ${payload.roomName}`,
    `Kuupäev: ${payload.date}`,
    `Kellaaeg: ${payload.startTime}–${payload.endTime}`,
    `Kestus arvestuses: ${payload.hours} h`,
    `Sündmuse liik: ${payload.eventType}`,
    `Osalejate arv: ${payload.participants}`,
    `Kasutus: ${payload.publicEvent ? 'avalik sündmus' : 'era- või kinnine sündmus'}`,
    `Allkirjastamine: ${payload.signingPreference}`,
    '',
    'KLIENT',
    `Nimi: ${payload.name}`,
    `E-post: ${payload.email}`,
    `Telefon: ${payload.phone}`,
    '',
    'VALITUD TEENUSED',
    services,
    '',
    'ORIENTEERUV HIND',
    `Ruumi kasutus: ${euro(payload.roomCost)}`,
    'Koristus ja ettevalmistus: sisaldub ruumi rendihinnas',
    `Valitud lisateenused: ${euro(payload.servicesTotal)}`,
    `Kokku: ${euro(payload.estimatedTotal)}`,
    '',
    bookingSettings.priceDisclaimer
  ].join('\n')
}

function Pill({ children }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{children}</span>
}

function StatusPill({ status }) {
  const label = status === 'published' ? 'Avaldatud' : status === 'kinnitatud' ? 'Kinnitatud' : status === 'rejected' || status === 'tagasi lükatud' ? 'Tagasi lükatud' : status === 'ootel' ? 'Ootel' : 'Kinnitamisel'
  const style = ['published', 'kinnitatud'].includes(status) ? 'bg-emerald-50 text-emerald-800 ring-emerald-100' : ['rejected', 'tagasi lükatud'].includes(status) ? 'bg-rose-50 text-rose-800 ring-rose-100' : 'bg-amber-50 text-amber-800 ring-amber-100'
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${style}`}>{label}</span>
}

function Field({ label, children, hint, required = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}{required && <span className="ml-1 text-rose-600">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs leading-5 text-slate-500">{hint}</span>}
    </label>
  )
}

function SectionHeader({ eyebrow, title, text }) {
  return (
    <div className="mb-6 max-w-3xl">
      {eyebrow && <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>}
      <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-base leading-7 text-slate-600">{text}</p>}
    </div>
  )
}

function EventCard({ event }) {
  const title = publicUsageTitle(event)
  const isNeutral = event.displayMode === 'neutral'
  return (
    <article className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-28 bg-gradient-to-br from-emerald-100 via-sky-50 to-amber-50 p-4">
        <div className="flex h-full items-start justify-between">
          <div className="rounded-2xl bg-white/85 px-4 py-3 text-center shadow-sm ring-1 ring-white">
            <p className="text-xl font-black text-slate-950">{(event.date || '').split(' ')[0]}</p>
            <p className="text-xs font-bold uppercase text-slate-500">{(event.date || '').split(' ')[1] || ''}</p>
          </div>
          {event.price && <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-white">{event.price}</span>}
        </div>
      </div>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <Pill>{event.house.replace(' rahvamaja', '')}</Pill>
          <Pill>{event.room}</Pill>
          {isNeutral && <Pill>hõivatud</Pill>}
        </div>
        <h3 className="text-xl font-black leading-tight text-slate-950">{title}</h3>
        <p className="mt-2 text-sm font-semibold text-slate-500">{event.weekday || ''} · {event.startTime || event.time}{event.endTime ? `–${event.endTime}` : ''}</p>
        <p className="mt-3 min-h-[3rem] text-sm leading-6 text-slate-600">{isNeutral ? 'Rahvamaja ruum on sel ajal kasutuses. Täpsemaid detaile avalikus vaates ei kuvata.' : event.description}</p>
      </div>
    </article>
  )
}

function UsageCalendar({ usages, compact = false }) {
  if (!usages.length) return <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">Kalendris ei ole hetkel ruumikasutusi.</p>
  return (
    <div className="grid gap-3">
      {usages.map((item) => {
        const room = rentalRooms.find((r) => r.id === item.roomId)
        const blockedStart = room ? minutesToTime(timeToMinutes(item.startTime) - (room.bufferBeforeMinutes || 0)) : item.startTime
        const blockedEnd = room ? minutesToTime(timeToMinutes(item.endTime) + (room.bufferAfterMinutes || 0)) : item.endTime
        return (
          <div key={item.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">{item.dateISO} · {item.house}</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{item.publicTitle}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.room} · sündmuse aeg {item.startTime}–{item.endTime}</p>
                {!compact && <p className="mt-1 text-xs text-slate-500">Broneerimisel arvestatav hõivatus koos puhvriga: {blockedStart}–{blockedEnd}</p>}
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{item.source}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BookingForm({ events, activities, bookings, onBookingSubmit }) {
  const [form, setForm] = useState({
    roomId: rentalRooms[0]?.id || '',
    date: '',
    startTime: '18:00',
    endTime: '22:00',
    eventType: '',
    participants: '',
    publicEvent: false,
    name: '',
    email: '',
    phone: '',
    signingPreference: 'kohapeal',
    notes: '',
    accepted: false
  })
  const [selectedServiceIds, setSelectedServiceIds] = useState([])
  const [status, setStatus] = useState(null)

  const selectedRoom = rentalRooms.find((room) => room.id === form.roomId) || rentalRooms[0]
  const usages = getRoomUsages(events, activities, bookings)
  const dayUsages = usages.filter((item) => item.roomId === selectedRoom?.id && item.dateISO === form.date)
  const availability = checkAvailability({ room: selectedRoom, date: form.date, startTime: form.startTime, endTime: form.endTime, usages })

  const hours = calculateHours(form.startTime, form.endTime, selectedRoom?.minimumHours || 1)
  const selectedServices = rentalServices
    .filter((service) => selectedServiceIds.includes(service.id))
    .map((service) => ({ ...service, total: service.pricing === 'hourly' ? service.price * hours : service.price }))
  const roomCost = (selectedRoom?.hourlyRate || 0) * hours
  const servicesTotal = selectedServices.reduce((sum, service) => sum + service.total, 0)
  const estimatedTotal = roomCost + servicesTotal

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setStatus(null)
  }

  function toggleService(id) {
    setSelectedServiceIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function submitBooking(e) {
    e.preventDefault()
    if (!form.date || !form.startTime || !form.endTime || !form.eventType || !form.name || !form.email || !form.phone || !form.accepted) {
      setStatus({ type: 'error', text: 'Palun täida kohustuslikud väljad ja kinnita tingimustega tutvumine.' })
      return
    }
    if (availability.invalid) {
      setStatus({ type: 'error', text: 'Lõpuaeg peab olema hilisem kui algusaeg.' })
      return
    }
    if (availability.conflicts.length > 0) {
      setStatus({ type: 'error', text: 'Valitud ajal on ruum juba kasutuses. Palun vali teine aeg.' })
      return
    }

    const payload = {
      createdAt: new Date().toISOString(),
      status: 'ootel',
      house: selectedRoom.house,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      roomEmail: selectedRoom.email || bookingSettings.defaultEmail,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      hours,
      eventType: form.eventType,
      participants: form.participants,
      publicEvent: form.publicEvent,
      name: form.name,
      email: form.email,
      phone: form.phone,
      signingPreference: form.signingPreference === 'digitaalne' ? 'Soovin lepingu allkirjastada digitaalselt' : 'Allkirjastan lepingu kohapeal rahvamajas',
      notes: form.notes,
      selectedServices,
      includedItems: selectedRoom.included || [],
      agreementItems: selectedRoom.agreement || [],
      roomCost,
      cleaningFee: 0,
      servicesTotal,
      estimatedTotal,
      disclaimer: bookingSettings.priceDisclaimer
    }

    onBookingSubmit(payload)

    if (bookingSettings.appsScriptUrl) {
      try {
        await fetch(bookingSettings.appsScriptUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
        setStatus({ type: 'success', text: 'Sinu ruumi kasutamise soov on kätte saadud. Koopia läheb kliendi ja rahvamaja e-postile.' })
      } catch (error) {
        setStatus({ type: 'error', text: 'Saatmine ebaõnnestus. Kontrolli Apps Scripti aadressi või kasuta e-kirja mustandit.' })
      }
    } else {
      const subject = encodeURIComponent(`Ruumi kasutamise soov: ${selectedRoom.house} / ${selectedRoom.name}`)
      const body = encodeURIComponent(buildBookingEmail(payload))
      const to = encodeURIComponent(selectedRoom.email || bookingSettings.defaultEmail)
      const cc = encodeURIComponent(form.email)
      window.location.href = `mailto:${to}?cc=${cc}&subject=${subject}&body=${body}`
      setStatus({ type: 'success', text: 'Avasin e-kirja mustandi rahvamajale ja kliendile.' })
    }
  }

  return (
    <section id="broneeri" className="mx-auto max-w-7xl px-4 pb-14 md:px-8">
      <div className="grid gap-6 rounded-[2rem] bg-slate-950 p-5 text-white md:grid-cols-[0.9fr_1.1fr] md:p-8">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">Ruumide rent</p>
          <h2 className="text-3xl font-black md:text-4xl">Saada ruumi kasutamise soov</h2>
          <p className="mt-4 leading-7 text-white/70">Vali ruum ja aeg. Süsteem kontrollib samast Kultuuripesa kalendrist, kas ruum on valitud ajal esialgu vaba.</p>
          <div className="mt-6 rounded-[1.4rem] bg-white/10 p-5 ring-1 ring-white/15">
            <p className="text-sm font-bold uppercase tracking-wide text-white/50">Orienteeruv hind</p>
            <p className="mt-2 text-4xl font-black">{euro(estimatedTotal)}</p>
            <div className="mt-4 space-y-2 text-sm text-white/75">
              <div className="flex justify-between gap-4"><span>Ruum {hours} h × {euro(selectedRoom?.hourlyRate || 0)}</span><span>{euro(roomCost)}</span></div>
              <div className="flex justify-between gap-4 text-white/60"><span>Koristus ja ettevalmistus</span><span>hinnas</span></div>
              {selectedServices.length > 0 ? selectedServices.map((service) => <div key={service.id} className="flex justify-between gap-4"><span>{service.label}</span><span>{euro(service.total)}</span></div>) : <div className="flex justify-between gap-4 text-white/60"><span>Lisateenuseid ei ole valitud</span><span>{euro(0)}</span></div>}
            </div>
            <p className="mt-4 text-xs leading-5 text-white/55">{bookingSettings.priceDisclaimer}</p>
          </div>
        </div>

        <form onSubmit={submitBooking} className="grid gap-4 rounded-[1.5rem] bg-white p-4 text-slate-900 md:p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Ruum" required><select required className={inputClass} value={form.roomId} onChange={(e) => update('roomId', e.target.value)}>{rentalRooms.map((room) => <option key={room.id} value={room.id}>{room.house} · {room.name}</option>)}</select></Field>
            <Field label="Kuupäev" required><input required className={inputClass} type="date" value={form.date} onChange={(e) => update('date', e.target.value)} /></Field>
            <Field label="Algusaeg" required><input required className={inputClass} type="time" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} /></Field>
            <Field label="Lõpuaeg" required hint={`Arvestuslik kestus: ${hours} h. Miinimum: ${selectedRoom.minimumHours} h.`}><input required className={inputClass} type="time" value={form.endTime} onChange={(e) => update('endTime', e.target.value)} /></Field>
          </div>

          {form.date && (
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <h3 className="font-black">{selectedRoom.house} · {selectedRoom.name}</h3>
              <p className="mt-1 text-sm text-slate-600">Selle päeva ruumikasutus avalikus kalendris:</p>
              <div className="mt-3 space-y-2">
                {dayUsages.length === 0 && <p className="rounded-xl bg-white p-3 text-sm text-emerald-900 ring-1 ring-emerald-100">Sellel kuupäeval ei ole ruumi kasutust kalendris.</p>}
                {dayUsages.map((item) => <p key={item.id} className="rounded-xl bg-white p-3 text-sm text-slate-700 ring-1 ring-slate-200">{item.startTime}–{item.endTime} · {item.publicTitle}</p>)}
              </div>
              {availability.ready && !availability.invalid && (
                <div className={`mt-3 rounded-xl p-3 text-sm font-semibold ring-1 ${availability.conflicts.length ? 'bg-rose-50 text-rose-900 ring-rose-100' : 'bg-emerald-50 text-emerald-900 ring-emerald-100'}`}>
                  {availability.conflicts.length ? 'Valitud ajal on ruum koos puhvriga juba kasutuses. Palun vali teine aeg.' : 'Valitud aeg on ruumikalendri põhjal esialgu vaba.'}
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="font-black">Rendi hinna sees</p>
            <div className="mt-2 flex flex-wrap gap-2">{(selectedRoom.included || []).map((item) => <Pill key={item}>{item}</Pill>)}</div>
            {(selectedRoom.agreement || []).length > 0 && <><p className="mt-4 text-sm font-black text-amber-800">Eraldi kokkuleppel</p><div className="mt-2 flex flex-wrap gap-2">{selectedRoom.agreement.map((item) => <span key={item} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-100">{item}</span>)}</div></>}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Lisateenuste hinnakiri</p>
            <div className="grid gap-2 md:grid-cols-2">
              {rentalServices.map((service) => {
                const checked = selectedServiceIds.includes(service.id)
                const total = service.pricing === 'hourly' ? service.price * hours : service.price
                return <label key={service.id} className={`cursor-pointer rounded-2xl p-3 ring-1 transition ${checked ? 'bg-emerald-50 ring-emerald-200' : 'bg-slate-50 ring-slate-200 hover:bg-slate-100'}`}><div className="flex items-start gap-3"><input className="mt-1" type="checkbox" checked={checked} onChange={() => toggleService(service.id)} /><div><p className="text-sm font-black">{service.label}</p><p className="mt-1 text-xs leading-5 text-slate-600">{service.description}</p><p className="mt-2 text-xs font-bold text-emerald-800">{service.pricing === 'hourly' ? `${euro(service.price)} / h` : euro(service.price)} · kokku {euro(total)}</p></div></div></label>
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Sündmuse liik" required><input required className={inputClass} value={form.eventType} onChange={(e) => update('eventType', e.target.value)} placeholder="nt sünnipäev, koosolek, koolitus" /></Field>
            <Field label="Osalejate arv"><input className={inputClass} type="number" min="1" value={form.participants} onChange={(e) => update('participants', e.target.value)} placeholder="nt 45" /></Field>
            <Field label="Nimi" required><input required className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ees- ja perekonnanimi" /></Field>
            <Field label="E-post" required><input required className={inputClass} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="nimi@example.ee" /></Field>
            <Field label="Telefon" required><input required className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+372 ..." /></Field>
            <Field label="Allkirjastamine" required><select required className={inputClass} value={form.signingPreference} onChange={(e) => update('signingPreference', e.target.value)}><option value="kohapeal">Allkirjastan lepingu kohapeal rahvamajas</option><option value="digitaalne">Soovin lepingu allkirjastada digitaalselt</option></select></Field>
          </div>

          <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold ring-1 ring-slate-200"><input type="checkbox" checked={form.publicEvent} onChange={(e) => update('publicEvent', e.target.checked)} />Tegemist on avaliku sündmusega</label>
          <Field label="Lisainfo"><textarea className={`${inputClass} min-h-[96px]`} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Kirjelda lisasoove, toitlustuse vajadust, tehnilisi vajadusi või muid olulisi asjaolusid." /></Field>
          <label className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950 ring-1 ring-amber-100"><input className="mt-1" type="checkbox" checked={form.accepted} onChange={(e) => update('accepted', e.target.checked)} /><span><span className="font-bold text-rose-700">*</span> Olen tutvunud ruumi kasutamise tingimuste, hinnainfo ja isikuandmete töötlemise põhimõtetega ning nõustun nendega.</span></label>
          {status && <p className={`rounded-2xl p-4 text-sm leading-6 ring-1 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-900 ring-emerald-100' : 'bg-rose-50 text-rose-900 ring-rose-100'}`}>{status.text}</p>}
          <button type="submit" className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">Saada broneeringusoov</button>
        </form>
      </div>
    </section>
  )
}

function PublicView({ events, activities, bookings, setView, onBookingSubmit }) {
  const [filter, setFilter] = useState('Kõik')
  const [query, setQuery] = useState('')
  const usages = getRoomUsages(events, activities, bookings)
  const publicEvents = events.filter((event) => event.status === 'published' && event.public && event.displayMode !== 'neutral')
  const publicActivities = activities.filter((activity) => activity.status === 'published')
  const filteredEvents = useMemo(() => publicEvents.filter((event) => {
    const text = `${event.title} ${event.publicTitle} ${event.house} ${event.audience} ${event.category} ${event.price} ${event.description}`.toLowerCase()
    const queryOk = text.includes(query.toLowerCase())
    const filterOk = filter === 'Kõik' || event.house.includes(filter) || event.audience === filter || event.price === filter || (filter === 'Registreerimisega' && event.registration)
    return queryOk && filterOk
  }), [publicEvents, query, filter])

  return (
    <div className="min-h-screen bg-[#f8faf7] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <a href="#avaleht" className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-lg font-black text-white">RK</div><div><p className="text-base font-black leading-tight">Rannu & Konguta</p><p className="text-xs font-semibold text-slate-500">rahvamajad</p></div></a>
          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-700 md:flex"><a href="#sundmused" className="hover:text-emerald-700">Sündmused</a><a href="#kasutus" className="hover:text-emerald-700">Kasutuskalender</a><a href="#ringid" className="hover:text-emerald-700">Ringid</a><a href="#broneeri" className="hover:text-emerald-700">Ruumide rent</a><a href="#kontakt" className="hover:text-emerald-700">Kontakt</a></nav>
          <div className="hidden gap-2 md:flex"><button onClick={() => setView('login')} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Töötajale</button><a href="#broneeri" className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">Broneeri ruum</a></div>
        </div>
      </header>

      <main id="avaleht">
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-16">
          <div className="flex flex-col justify-center"><p className="mb-4 inline-flex w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100">Rannu ja Konguta kultuurielu ühest kohast</p><h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Leia sündmused, ruumide kasutus ja vabad ajad kiiresti.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Avalik kalender näitab nii avalikke sündmusi kui ka seda, millal rahvamaja või ruum on broneeritud või kasutuses.</p><div className="mt-7 flex flex-wrap gap-3"><a href="#kasutus" className="rounded-2xl bg-emerald-700 px-5 py-3 text-base font-extrabold text-white shadow-sm hover:bg-emerald-800">Vaata kasutuskalendrit</a><a href="#broneeri" className="rounded-2xl bg-white px-5 py-3 text-base font-extrabold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">Saada broneeringusoov</a></div></div>
          <div className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5"><div className="rounded-[1.5rem] bg-gradient-to-br from-emerald-100 via-white to-amber-50 p-5"><h2 className="text-lg font-black">Täna oluline</h2><div className="mt-5 space-y-3"><a href="#sundmused" className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-white hover:bg-slate-50"><div><p className="font-extrabold">Avalikud sündmused</p><p className="text-sm text-slate-500">{publicEvents.length} sündmust nähtaval</p></div><span>→</span></a><a href="#kasutus" className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-white hover:bg-slate-50"><div><p className="font-extrabold">Rahvamajade kasutus</p><p className="text-sm text-slate-500">{usages.length} ruumikasutust kalendris</p></div><span>→</span></a><a href="#broneeri" className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-white hover:bg-slate-50"><div><p className="font-extrabold">Ruumide rent</p><p className="text-sm text-slate-500">hind ja saadavuse esmane kontroll</p></div><span>→</span></a></div></div></div>
        </section>

        <section id="sundmused" className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><SectionHeader eyebrow="Sündmused" title="Mis lähiajal toimub?" text="Siin on avalikud sündmused, mille detaile rahvamaja soovib tutvustada." /><div className="w-full rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 md:max-w-sm"><label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Otsi</label><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Näiteks peredele, kontsert, Rannu..." className="w-full bg-transparent text-sm outline-none" /></div></div>
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ring-1 ${filter === item ? 'bg-emerald-700 text-white ring-emerald-700' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}`}>{item}</button>)}</div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filteredEvents.map((event) => <EventCard key={event.id} event={event} />)}</div>
        </section>

        <section id="kasutus" className="bg-white py-12 ring-1 ring-slate-200">
          <div className="mx-auto max-w-7xl px-4 md:px-8"><SectionHeader eyebrow="Kasutuskalender" title="Millal rahvamaja on kasutuses?" text="Kõik ruumi hõivavad tegevused on avalikus vaates nähtavad vähemalt kasutuse infona. Eraürituste ja sisemiste tegevuste detaile ei kuvata." /><UsageCalendar usages={usages} /></div>
        </section>

        <section id="ringid" className="mx-auto max-w-7xl px-4 py-12 md:px-8"><SectionHeader eyebrow="Ringid ja tegevused" title="Leia endale sobiv tegevus" text="Kollektiivide juhid saavad prooviaegu muuta sisselogitud vaates, juhataja või administraator kinnitab muudatused." /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{publicActivities.map((item) => <div key={item.id} className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-black">{item.title}</h3><p className="mt-2 text-sm text-slate-600">{item.house} · {item.room}</p><p className="mt-3 text-sm font-semibold text-slate-950">Kellele: {item.audience}</p><p className="mt-1 text-sm text-slate-600">{item.time}</p></div>)}</div></section>
        <BookingForm events={events} activities={activities} bookings={bookings} onBookingSubmit={onBookingSubmit} />
        <section id="majad" className="bg-white py-12 ring-1 ring-slate-200"><div className="mx-auto max-w-7xl px-4 md:px-8"><SectionHeader eyebrow="Rahvamajad" title="Kaks maja, kaks kohalikku nägu" text="Rannu ja Konguta rahvamajad töötavad ühise avaliku vaatega, aga mõlemal majal on oma tugevused ja kogukondlik roll." /><div className="grid gap-5 md:grid-cols-2">{houses.map((house) => <article key={house.name} className="rounded-[1.7rem] bg-[#f8faf7] p-6 ring-1 ring-slate-200"><div className="mb-5 h-44 rounded-[1.3rem] bg-gradient-to-br from-emerald-100 via-sky-50 to-amber-50" /><h3 className="text-2xl font-black">{house.name}</h3><p className="mt-2 text-sm font-semibold text-slate-500">📍 {house.location}</p><p className="mt-4 leading-7 text-slate-600">{house.description}</p><div className="mt-5 flex flex-wrap gap-2">{house.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}</div></article>)}</div></div></section>
        <section id="kontakt" className="mx-auto max-w-7xl px-4 py-12 md:px-8"><SectionHeader eyebrow="Kontakt" title="Võta ühendust" text="Kirjuta või helista, kui soovid küsida sündmuse, ringi või ruumi kasutamise kohta." /><div className="grid gap-5 md:grid-cols-3"><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-black">Üldkontakt</h3><p className="mt-3 text-slate-600">{bookingSettings.defaultEmail}</p></div><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-black">Rannu rahvamaja</h3><p className="mt-3 text-slate-600">Rannu alevik</p></div><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-black">Konguta rahvamaja</h3><p className="mt-3 text-slate-600">Annikoru küla</p></div></div></section>
      </main>
      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between md:px-8"><p className="font-semibold">Rannu & Konguta rahvamajad</p><p>Sündmused · Kasutuskalender · Ringid · Ruumide rent · <button onClick={() => setView('login')} className="font-bold text-emerald-700">Töötajale</button></p></div></footer>
    </div>
  )
}

function LoginView({ selectedRole, setSelectedRole, setView }) {
  const role = roles.find((item) => item.id === selectedRole)
  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white md:p-8"><div className="mx-auto max-w-5xl"><button onClick={() => setView('public')} className="mb-6 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/15 hover:bg-white/15">← Tagasi avalikule lehele</button><div className="grid gap-6 rounded-[2rem] bg-white p-5 text-slate-900 shadow-xl md:grid-cols-[0.9fr_1.1fr] md:p-8"><div className="rounded-[1.5rem] bg-gradient-to-br from-emerald-100 via-white to-amber-50 p-6"><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Sisselogimine</p><h1 className="mt-3 text-4xl font-black tracking-tight">Töötaja ja juhendaja vaade</h1><p className="mt-4 leading-7 text-slate-600">Prototüübis saad rolli valida. Päris süsteemis tuleks siia Google / Microsoft / e-postiga sisselogimine.</p><div className="mt-6 rounded-2xl bg-white/80 p-4 ring-1 ring-white"><p className="text-sm font-bold text-slate-950">Valitud roll</p><p className="mt-1 text-sm leading-6 text-slate-600">{role.description}</p></div></div><div><h2 className="text-xl font-black">Vali roll</h2><div className="mt-4 grid gap-3">{roles.map((item) => <button key={item.id} onClick={() => setSelectedRole(item.id)} className={`rounded-2xl p-4 text-left ring-1 transition ${selectedRole === item.id ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-200 hover:bg-slate-50'}`}><p className="font-black">{item.label}</p><p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p></button>)}</div><button onClick={() => setView('admin')} className="mt-5 w-full rounded-2xl bg-emerald-700 px-5 py-3 text-base font-extrabold text-white hover:bg-emerald-800">Logi sisse prototüüpi</button></div></div></div></div>
  )
}

function AdminView({ selectedRole, setSelectedRole, setView, events, setEvents, activities, setActivities, requests, setRequests, bookings, setBookings }) {
  const [tab, setTab] = useState('overview')
  const [newEvent, setNewEvent] = useState({ title: '', publicTitle: '', displayMode: 'full', house: 'Rannu rahvamaja', roomId: 'rannu-saal', dateISO: '', startTime: '', endTime: '', audience: 'Kõigile', category: 'Sündmus', price: 'Tasuta', description: '', public: true, blocksRoom: true })
  const [activityChange, setActivityChange] = useState({ activityId: 1, newTime: '', publicTitle: '', note: '' })
  const role = roles.find((item) => item.id === selectedRole)
  const canApprove = selectedRole === 'director' || selectedRole === 'admin'
  const canEditEvents = selectedRole === 'director' || selectedRole === 'admin'
  const canEditCollectives = selectedRole === 'director' || selectedRole === 'admin' || selectedRole === 'collective'
  const canSeeTech = selectedRole === 'director' || selectedRole === 'admin' || selectedRole === 'tech'
  const usages = getRoomUsages(events, activities, bookings)
  const pendingRequests = requests.filter((item) => item.status === 'ootel')
  const pendingEvents = events.filter((item) => item.status === 'review')

  function roomFromId(id) {
    return rentalRooms.find((room) => room.id === id) || rentalRooms[0]
  }

  function submitEvent() {
    if (!newEvent.title || !newEvent.dateISO || !newEvent.startTime || !newEvent.endTime) return
    const room = roomFromId(newEvent.roomId)
    setEvents([{ id: Date.now(), ...newEvent, room: room.name, house: room.house, date: newEvent.dateISO, weekday: '', registration: false, status: canApprove ? 'published' : 'review', owner: role.label, publicTitle: newEvent.publicTitle || newEvent.title, tech: '' }, ...events])
    setNewEvent({ title: '', publicTitle: '', displayMode: 'full', house: 'Rannu rahvamaja', roomId: 'rannu-saal', dateISO: '', startTime: '', endTime: '', audience: 'Kõigile', category: 'Sündmus', price: 'Tasuta', description: '', public: true, blocksRoom: true })
  }

  function updateEvent(id, patch) {
    setEvents(events.map((event) => event.id === id ? { ...event, ...patch } : event))
  }

  function submitActivityChange() {
    const activity = activities.find((item) => item.id === Number(activityChange.activityId))
    if (!activity || !activityChange.newTime) return
    setRequests([{ id: Date.now(), type: 'Prooviaja muudatus', title: `${activity.title}: uus aeg`, submittedBy: role.label, house: activity.house, target: activity.title, oldValue: activity.time, newValue: activityChange.newTime, publicTitle: activityChange.publicTitle || activity.publicTitle || activity.title, status: 'ootel', note: activityChange.note }, ...requests])
    setActivityChange({ activityId: 1, newTime: '', publicTitle: '', note: '' })
  }

  function approveRequest(id) {
    const request = requests.find((item) => item.id === id)
    if (request?.type === 'Prooviaja muudatus') setActivities(activities.map((activity) => activity.title === request.target ? { ...activity, time: request.newValue, publicTitle: request.publicTitle || activity.publicTitle } : activity))
    setRequests(requests.map((item) => item.id === id ? { ...item, status: 'kinnitatud' } : item))
  }

  function confirmBooking(index) {
    setBookings(bookings.map((booking, i) => i === index ? { ...booking, status: 'kinnitatud' } : booking))
  }

  const tabs = [
    { id: 'overview', label: 'Ülevaade' },
    { id: 'usage', label: 'Kasutuskalender' },
    { id: 'bookings', label: `Broneeringud (${bookings.length})` },
    { id: 'events', label: 'Sündmused' },
    { id: 'collectives', label: 'Kollektiivid' },
    { id: 'rooms', label: 'Ruumid ja tehnika' },
    { id: 'approvals', label: `Kinnitused (${pendingRequests.length + pendingEvents.length})` }
  ]

  return (
    <div className="min-h-screen bg-[#f8faf7] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">RK</div><div><p className="text-base font-black leading-tight">Sisuhaldus</p><p className="text-xs font-semibold text-slate-500">{role.label}</p></div></div><div className="flex flex-wrap items-center gap-2"><select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="rounded-2xl bg-slate-50 px-4 py-2 text-sm font-bold outline-none ring-1 ring-slate-200">{roles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><button onClick={() => setView('public')} className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">Avalik vaade</button><button onClick={() => setView('login')} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Välju</button></div></div></header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8"><div className="mb-6 rounded-[2rem] bg-slate-950 p-6 text-white md:p-8"><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">Üks süsteem</p><h1 className="mt-2 text-3xl font-black md:text-5xl">Avalik kalender + broneeringud + sisuhaldus</h1><p className="mt-4 max-w-3xl leading-7 text-white/70">Kõik ruumikasutused on nähtavad vähemalt hõivatuse infona. Juhataja/admin saab avaliku kalendri teksti kohendada.</p></div><div className="mb-6 flex gap-2 overflow-x-auto pb-2">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-full px-4 py-2 text-sm font-bold ring-1 ${tab === item.id ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}`}>{item.label}</button>)}</div>

        {tab === 'overview' && <section className="grid gap-4 md:grid-cols-4"><div className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Ruumikasutusi</p><p className="mt-2 text-3xl font-black">{usages.length}</p></div><div className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Broneeringusoove</p><p className="mt-2 text-3xl font-black">{bookings.length}</p></div><div className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Kinnitamisel</p><p className="mt-2 text-3xl font-black">{pendingRequests.length + pendingEvents.length}</p></div><div className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Ruumid</p><p className="mt-2 text-3xl font-black">{rentalRooms.length}</p></div></section>}
        {tab === 'usage' && <section><SectionHeader eyebrow="Kasutuskalender" title="Kõik ruumi hõivavad tegevused" text="See sama kalender on avaliku kasutusvaate ja broneeringukontrolli alus." /><UsageCalendar usages={usages} /></section>}
        {tab === 'bookings' && <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]"><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Broneeringusoovid</h2><div className="mt-4 space-y-3">{bookings.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">Broneeringuid ei ole veel prototüübis lisatud.</p>}{bookings.map((booking, index) => <div key={`${booking.createdAt}-${index}`} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{booking.house} · {booking.roomName}</h3><p className="mt-1 text-sm text-slate-600">{booking.date} · {booking.startTime}–{booking.endTime} · {booking.name}</p><p className="mt-1 text-sm text-slate-600">{booking.eventType} · {booking.participants || '-'} osalejat</p><p className="mt-1 text-xs text-slate-500">Allkirjastamine: {booking.signingPreference}</p></div><StatusPill status={booking.status || 'ootel'} /></div><p className="mt-3 text-sm font-bold text-slate-950">Orienteeruv hind: {euro(booking.estimatedTotal)}</p><p className="mt-1 text-xs text-slate-500">Kontakt: {booking.email} · {booking.phone}</p>{canApprove && booking.status !== 'kinnitatud' && <button onClick={() => confirmBooking(index)} className="mt-3 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Kinnita broneering ja näita avalikus kalendris</button>}</div>)}</div></div><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Töövoog</h2><ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700"><li><b>1.</b> Klient valib vaba aja.</li><li><b>2.</b> Broneering läheb ootele.</li><li><b>3.</b> Töötaja kinnitab.</li><li><b>4.</b> Kinnitatud aeg ilmub avalikus kalendris kui “Ruum broneeritud”.</li></ol></div></section>}
        {tab === 'events' && <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Lisa ruumikasutus / sündmus</h2>{!canEditEvents && <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-100">Sinu roll saab esitada muudatusi ainult oma kollektiivi kohta.</p>}<div className="mt-4 grid gap-3"><Field label="Sisemine nimetus" required><input disabled={!canEditEvents} className={inputClass} value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="nt Mari sünnipäev või Kontsert" /></Field><Field label="Avaliku kalendri tekst"><input disabled={!canEditEvents} className={inputClass} value={newEvent.publicTitle} onChange={(e) => setNewEvent({ ...newEvent, publicTitle: e.target.value })} placeholder="nt Ruum broneeritud / Rahvamaja kasutuses / sündmuse nimi" /></Field><div className="grid gap-3 md:grid-cols-2"><Field label="Kuvamise viis"><select disabled={!canEditEvents} className={inputClass} value={newEvent.displayMode} onChange={(e) => setNewEvent({ ...newEvent, displayMode: e.target.value })}><option value="full">Näita sündmuse nime ja infot</option><option value="category">Näita üldise kategooriana</option><option value="neutral">Näita ainult hõivatuse tekstina</option></select></Field><Field label="Ruum"><select disabled={!canEditEvents} className={inputClass} value={newEvent.roomId} onChange={(e) => setNewEvent({ ...newEvent, roomId: e.target.value })}>{rentalRooms.map((room) => <option key={room.id} value={room.id}>{room.house} · {room.name}</option>)}</select></Field><Field label="Kuupäev" required><input disabled={!canEditEvents} className={inputClass} type="date" value={newEvent.dateISO} onChange={(e) => setNewEvent({ ...newEvent, dateISO: e.target.value })} /></Field><Field label="Algus" required><input disabled={!canEditEvents} className={inputClass} type="time" value={newEvent.startTime} onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })} /></Field><Field label="Lõpp" required><input disabled={!canEditEvents} className={inputClass} type="time" value={newEvent.endTime} onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })} /></Field><Field label="Sihtrühm"><input disabled={!canEditEvents} className={inputClass} value={newEvent.audience} onChange={(e) => setNewEvent({ ...newEvent, audience: e.target.value })} /></Field></div><Field label="Avalik kirjeldus"><textarea disabled={!canEditEvents} className={`${inputClass} min-h-[100px]`} value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Täidetakse ainult siis, kui sündmus on avalik." /></Field><button disabled={!canEditEvents} onClick={submitEvent} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">Lisa kalendrisse</button></div></div><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Sündmuste nimekiri</h2><div className="mt-4 space-y-3">{events.map((event) => <div key={event.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{event.title}</h3><p className="mt-1 text-sm text-slate-600">Avalikus vaates: <b>{event.publicTitle || event.title}</b></p><p className="mt-1 text-xs text-slate-500">{event.house} · {event.room} · {event.dateISO} · {event.startTime}–{event.endTime}</p></div><StatusPill status={event.status} /></div>{canApprove && <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]"><input className={inputClass} value={event.publicTitle || ''} onChange={(e) => updateEvent(event.id, { publicTitle: e.target.value })} placeholder="Avaliku kalendri tekst" /><select className={inputClass} value={event.displayMode || 'full'} onChange={(e) => updateEvent(event.id, { displayMode: e.target.value })}><option value="full">Täistekst</option><option value="category">Üldine kategooria</option><option value="neutral">Ainult hõivatus</option></select></div>}</div>)}</div></div></section>}
        {tab === 'collectives' && <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Muuda prooviaega</h2><p className="mt-3 text-sm leading-6 text-slate-600">Kollektiivi juht saab esitada oma prooviaja muudatuse. See liigub kinnitamisele.</p><div className="mt-4 grid gap-3"><Field label="Kollektiiv"><select disabled={!canEditCollectives} className={inputClass} value={activityChange.activityId} onChange={(e) => setActivityChange({ ...activityChange, activityId: e.target.value })}>{activities.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.house}</option>)}</select></Field><Field label="Uus prooviaeg"><input disabled={!canEditCollectives} className={inputClass} value={activityChange.newTime} onChange={(e) => setActivityChange({ ...activityChange, newTime: e.target.value })} placeholder="nt Kolmapäeviti 18.30–20.30" /></Field><Field label="Avaliku kalendri tekst"><input disabled={!canEditCollectives} className={inputClass} value={activityChange.publicTitle} onChange={(e) => setActivityChange({ ...activityChange, publicTitle: e.target.value })} placeholder="nt Ringitegevus / Rahvatantsu proov" /></Field><button disabled={!canEditCollectives} onClick={submitActivityChange} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">Saada kinnitamiseks</button></div></div><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Kollektiivid ja ringid</h2><div className="mt-4 space-y-3">{activities.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><h3 className="font-black">{item.title}</h3><p className="mt-1 text-sm text-slate-600">Avalikus kalendris: <b>{item.publicTitle}</b></p><p className="mt-1 text-sm text-slate-600">{item.house} · {item.room}</p><p className="mt-1 text-sm font-semibold text-slate-900">{item.time}</p></div>)}</div></div></section>}
        {tab === 'rooms' && <section className="grid gap-6 lg:grid-cols-[1fr_1fr]"><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Ruumid ja hinnad</h2><div className="mt-5 space-y-3">{rentalRooms.map((room) => <div key={room.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><p className="font-black">{room.house} · {room.name}</p><p className="mt-1 text-sm text-slate-600">{euro(room.hourlyRate)} / h · min {room.minimumHours} h · puhver {room.bufferBeforeMinutes} min enne ja {room.bufferAfterMinutes} min pärast</p></div>)}</div></div><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Tehnilised vajadused</h2>{!canSeeTech && <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">Sinu roll ei näe tehnilisi ettevalmistusi.</p>}{canSeeTech && <div className="mt-5 space-y-3">{events.map((event) => <div key={event.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><p className="font-black">{event.title}</p><p className="mt-1 text-sm text-slate-600">{event.tech || 'Tehniline vajadus lisamata'}</p></div>)}</div>}</div></section>}
        {tab === 'approvals' && <section className="grid gap-6 lg:grid-cols-[1fr_1fr]"><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Muudatused kinnitamiseks</h2><div className="mt-4 space-y-3">{requests.map((request) => <div key={request.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{request.type}</p><h3 className="mt-1 font-black">{request.title}</h3><p className="mt-1 text-sm text-slate-600">{request.house} · esitas: {request.submittedBy}</p><p className="mt-2 text-sm text-slate-500">Vana: {request.oldValue}</p><p className="text-sm font-semibold text-slate-900">Uus: {request.newValue}</p><p className="mt-1 text-sm text-slate-600">Avaliku kalendri tekst: {request.publicTitle}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{request.status}</span></div>{canApprove && request.status === 'ootel' && <button onClick={() => approveRequest(request.id)} className="mt-3 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Kinnita</button>}</div>)}</div></div><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Avaldamata sündmused</h2>{pendingEvents.length === 0 && <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-100">Kõik sündmused on avaldatud või kinnitusi ei ole.</p>}</div></section>}
      </main>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('public')
  const [selectedRole, setSelectedRole] = useState('director')
  const [events, setEvents] = useState(initialEvents)
  const [activities, setActivities] = useState(initialActivities)
  const [requests, setRequests] = useState(initialRequests)
  const [bookings, setBookings] = useState([])

  function handleBookingSubmit(payload) {
    setBookings((current) => [{ ...payload, status: 'ootel' }, ...current])
  }

  if (view === 'login') return <LoginView selectedRole={selectedRole} setSelectedRole={setSelectedRole} setView={setView} />
  if (view === 'admin') return <AdminView selectedRole={selectedRole} setSelectedRole={setSelectedRole} setView={setView} events={events} setEvents={setEvents} activities={activities} setActivities={setActivities} requests={requests} setRequests={setRequests} bookings={bookings} setBookings={setBookings} />
  return <PublicView events={events} activities={activities} bookings={bookings} setView={setView} onBookingSubmit={handleBookingSubmit} />
}
