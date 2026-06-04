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
  roles,
  rooms
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

function calculateHours(start, end, minimumHours = 1) {
  const startMin = timeToMinutes(start)
  const endMin = timeToMinutes(end)
  if (startMin === null || endMin === null || endMin <= startMin) return minimumHours
  const actual = (endMin - startMin) / 60
  return Math.max(actual, minimumHours)
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
    `Koristus ja ettevalmistus: sisaldub ruumi rendihinnas`,
    `Valitud lisateenused: ${euro(payload.servicesTotal)}`,
    `Kokku: ${euro(payload.estimatedTotal)}`,
    '',
    'LISAMÄRKUSED',
    payload.notes || '-',
    '',
    bookingSettings.priceDisclaimer
  ].join('\n')
}

function Pill({ children }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{children}</span>
}

function StatusPill({ status }) {
  const label = status === 'published' ? 'Avaldatud' : status === 'draft' ? 'Mustand' : status === 'rejected' || status === 'tagasi lükatud' ? 'Tagasi lükatud' : status === 'kinnitatud' ? 'Kinnitatud' : 'Kinnitamisel'
  const style = status === 'published' || status === 'kinnitatud' ? 'bg-emerald-50 text-emerald-800 ring-emerald-100' : status === 'rejected' || status === 'tagasi lükatud' ? 'bg-rose-50 text-rose-800 ring-rose-100' : 'bg-amber-50 text-amber-800 ring-amber-100'
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${style}`}>{label}</span>
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

function ActionCard({ icon, title, text, href }) {
  return (
    <a href={href} className="group rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl ring-1 ring-emerald-100">{icon}</div>
      <h3 className="text-lg font-extrabold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      <p className="mt-4 text-sm font-bold text-emerald-700 group-hover:text-emerald-900">Ava →</p>
    </a>
  )
}

function EventCard({ event }) {
  const dateParts = event.date.split(' ')
  return (
    <article className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-28 bg-gradient-to-br from-emerald-100 via-sky-50 to-amber-50 p-4">
        <div className="flex h-full items-start justify-between">
          <div className="rounded-2xl bg-white/85 px-4 py-3 text-center shadow-sm ring-1 ring-white">
            <p className="text-xl font-black text-slate-950">{dateParts[0]}</p>
            <p className="text-xs font-bold uppercase text-slate-500">{dateParts[1] || ''}</p>
          </div>
          <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-white">{event.price}</span>
        </div>
      </div>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <Pill>{event.house.replace(' rahvamaja', '')}</Pill>
          <Pill>{event.audience}</Pill>
          {event.registration && <Pill>registreerimisega</Pill>}
        </div>
        <h3 className="text-xl font-black leading-tight text-slate-950">{event.title}</h3>
        <p className="mt-2 text-sm font-semibold text-slate-500">{event.weekday} · kell {event.time}</p>
        <p className="mt-3 min-h-[3rem] text-sm leading-6 text-slate-600">{event.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">Vaata lähemalt</button>
          {event.registration && <button className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100">Registreeri</button>}
        </div>
      </div>
    </article>
  )
}

function BookingForm({ onBookingSubmit }) {
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
    notes: '',
    accepted: false
  })
  const [selectedServiceIds, setSelectedServiceIds] = useState([])
  const [status, setStatus] = useState(null)

  const selectedRoom = rentalRooms.find((room) => room.id === form.roomId) || rentalRooms[0]
  const hours = calculateHours(form.startTime, form.endTime, selectedRoom?.minimumHours || 1)
  const selectedServices = rentalServices
    .filter((service) => selectedServiceIds.includes(service.id))
    .map((service) => ({ ...service, total: service.pricing === 'hourly' ? service.price * hours : service.price }))
  const roomCost = (selectedRoom?.hourlyRate || 0) * hours
  const cleaningFee = 0
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
      setStatus({ type: 'error', text: 'Palun täida kohustuslikud väljad ja kinnita, et soovid broneeringupäringu saata.' })
      return
    }

    const payload = {
      createdAt: new Date().toISOString(),
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
      notes: form.notes,
      selectedServices,
      roomCost,
      cleaningFee,
      servicesTotal,
      estimatedTotal,
      disclaimer: bookingSettings.priceDisclaimer
    }

    onBookingSubmit(payload)

    if (bookingSettings.appsScriptUrl) {
      try {
        await fetch(bookingSettings.appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        })
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
      setStatus({ type: 'success', text: 'Avasin e-kirja mustandi rahvamajale ja kliendile. Automaatseks saatmiseks lisa hiljem Google Apps Scripti URL.' })
    }
  }

  return (
    <section id="broneeri" className="mx-auto max-w-7xl px-4 pb-14 md:px-8">
      <div className="grid gap-6 rounded-[2rem] bg-slate-950 p-5 text-white md:grid-cols-[0.9fr_1.1fr] md:p-8">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">Ruumide rent</p>
          <h2 className="text-3xl font-black md:text-4xl">Saada ruumi kasutamise soov</h2>
          <p className="mt-4 leading-7 text-white/70">Vali ruum, algus- ja lõpuaeg ning vajalikud lisateenused. Süsteem arvutab orienteeruva hinna ning koostab broneeringupäringu.</p>

          <div className="mt-6 rounded-[1.4rem] bg-white/10 p-5 ring-1 ring-white/15">
            <p className="text-sm font-bold uppercase tracking-wide text-white/50">Orienteeruv hind</p>
            <p className="mt-2 text-4xl font-black">{euro(estimatedTotal)}</p>
            <div className="mt-4 space-y-2 text-sm text-white/75">
              <div className="flex justify-between gap-4"><span>Ruum {hours} h × {euro(selectedRoom?.hourlyRate || 0)}</span><span>{euro(roomCost)}</span></div>
              <div className="flex justify-between gap-4 text-white/60"><span>Koristus ja ettevalmistus</span><span>hinnas</span></div>
              {selectedServices.length > 0 ? selectedServices.map((service) => (
                <div key={service.id} className="flex justify-between gap-4"><span>{service.label}</span><span>{euro(service.total)}</span></div>
              )) : <div className="flex justify-between gap-4 text-white/60"><span>Lisateenuseid ei ole valitud</span><span>{euro(0)}</span></div>}
            </div>
            <p className="mt-4 text-xs leading-5 text-white/55">{bookingSettings.priceDisclaimer}</p>
          </div>
        </div>

        <form onSubmit={submitBooking} className="grid gap-4 rounded-[1.5rem] bg-white p-4 text-slate-900 md:p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Ruum" required>
              <select required className={inputClass} value={form.roomId} onChange={(e) => update('roomId', e.target.value)}>
                {rentalRooms.map((room) => <option key={room.id} value={room.id}>{room.house} · {room.name}</option>)}
              </select>
            </Field>
            <Field label="Kuupäev" required>
              <input required className={inputClass} type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
            </Field>
            <Field label="Algusaeg" required>
              <input required className={inputClass} type="time" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} />
            </Field>
            <Field label="Lõpuaeg" required hint={`Arvestuslik kestus: ${hours} h. Miinimum: ${selectedRoom.minimumHours} h.`}>
              <input required className={inputClass} type="time" value={form.endTime} onChange={(e) => update('endTime', e.target.value)} />
            </Field>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <h3 className="font-black">{selectedRoom.house} · {selectedRoom.name}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{selectedRoom.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill>kuni {selectedRoom.capacity} inimest</Pill>
              <Pill>{euro(selectedRoom.hourlyRate)} / h</Pill>
              <Pill>miinimum {selectedRoom.minimumHours} h</Pill>
            </div>
            <div className="mt-4 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Rendi hinna sees</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(selectedRoom.included || []).map((item) => <Pill key={item}>{item}</Pill>)}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Lisateenuste hinnakiri</p>
            <div className="grid gap-2 md:grid-cols-2">
              {rentalServices.map((service) => {
                const checked = selectedServiceIds.includes(service.id)
                const total = service.pricing === 'hourly' ? service.price * hours : service.price
                return (
                  <label key={service.id} className={`cursor-pointer rounded-2xl p-3 ring-1 transition ${checked ? 'bg-emerald-50 ring-emerald-200' : 'bg-slate-50 ring-slate-200 hover:bg-slate-100'}`}>
                    <div className="flex items-start gap-3">
                      <input className="mt-1" type="checkbox" checked={checked} onChange={() => toggleService(service.id)} />
                      <div>
                        <p className="text-sm font-black">{service.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{service.description}</p>
                        <p className="mt-2 text-xs font-bold text-emerald-800">{service.pricing === 'hourly' ? `${euro(service.price)} / h` : euro(service.price)} · kokku {euro(total)}</p>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Sündmuse liik" required>
              <input required className={inputClass} value={form.eventType} onChange={(e) => update('eventType', e.target.value)} placeholder="nt sünnipäev, koosolek, koolitus" />
            </Field>
            <Field label="Osalejate arv">
              <input className={inputClass} type="number" min="1" value={form.participants} onChange={(e) => update('participants', e.target.value)} placeholder="nt 45" />
            </Field>
            <Field label="Nimi" required>
              <input required className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ees- ja perekonnanimi" />
            </Field>
            <Field label="E-post" required>
              <input required className={inputClass} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="nimi@example.ee" />
            </Field>
            <Field label="Telefon" required>
              <input required className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+372 ..." />
            </Field>
            <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold ring-1 ring-slate-200">
              <input type="checkbox" checked={form.publicEvent} onChange={(e) => update('publicEvent', e.target.checked)} />
              Tegemist on avaliku sündmusega
            </label>
          </div>

          <Field label="Lisainfo">
            <textarea className={`${inputClass} min-h-[96px]`} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Kirjelda ruumipaigutust, toitlustust, tehnilisi vajadusi või muid soove." />
          </Field>

          <label className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950 ring-1 ring-amber-100">
            <input className="mt-1" type="checkbox" checked={form.accepted} onChange={(e) => update('accepted', e.target.checked)} />
            <span><span className="font-bold text-rose-700">*</span> Mõistan, et tegemist on broneeringupäringuga. Lõplik broneering, hind ja tingimused kinnitatakse rahvamaja töötaja poolt.</span>
          </label>

          {status && <p className={`rounded-2xl p-4 text-sm leading-6 ring-1 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-900 ring-emerald-100' : 'bg-rose-50 text-rose-900 ring-rose-100'}`}>{status.text}</p>}

          <button type="submit" className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">Saada broneeringusoov</button>
        </form>
      </div>
    </section>
  )
}

function PublicView({ events, activities, setView, onBookingSubmit }) {
  const [filter, setFilter] = useState('Kõik')
  const [query, setQuery] = useState('')

  const publicEvents = events.filter((event) => event.status === 'published' && event.public)
  const publicActivities = activities.filter((activity) => activity.status === 'published')

  const filteredEvents = useMemo(() => {
    return publicEvents.filter((event) => {
      const text = `${event.title} ${event.house} ${event.audience} ${event.category} ${event.price} ${event.description}`.toLowerCase()
      const queryOk = text.includes(query.toLowerCase())
      const filterOk = filter === 'Kõik' || event.house.includes(filter) || event.audience === filter || event.price === filter || (filter === 'Registreerimisega' && event.registration)
      return queryOk && filterOk
    })
  }, [filter, query, publicEvents])

  return (
    <div className="min-h-screen bg-[#f8faf7] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <a href="#avaleht" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-lg font-black text-white">RK</div>
            <div><p className="text-base font-black leading-tight">Rannu & Konguta</p><p className="text-xs font-semibold text-slate-500">rahvamajad</p></div>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-700 md:flex">
            <a href="#sundmused" className="hover:text-emerald-700">Sündmused</a>
            <a href="#ringid" className="hover:text-emerald-700">Ringid</a>
            <a href="#ruumid" className="hover:text-emerald-700">Ruumide rent</a>
            <a href="#majad" className="hover:text-emerald-700">Rahvamajad</a>
            <a href="#kontakt" className="hover:text-emerald-700">Kontakt</a>
          </nav>
          <div className="hidden gap-2 md:flex">
            <button onClick={() => setView('login')} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Töötajale</button>
            <a href="#sundmused" className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-200">Vaata sündmusi</a>
            <a href="#broneeri" className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">Broneeri ruum</a>
          </div>
        </div>
      </header>

      <main id="avaleht">
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-16">
          <div className="flex flex-col justify-center">
            <p className="mb-4 inline-flex w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100">Rannu ja Konguta kultuurielu ühest kohast</p>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Leia sündmused, ringid ja ruumid kiiresti.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Siit näed, mis Rannu ja Konguta rahvamajades toimub, kuidas tegevustega liituda ning kuidas saata ruumi kasutamise soov.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#sundmused" className="rounded-2xl bg-emerald-700 px-5 py-3 text-base font-extrabold text-white shadow-sm hover:bg-emerald-800">Vaata tulekul sündmusi</a>
              <a href="#broneeri" className="rounded-2xl bg-white px-5 py-3 text-base font-extrabold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">Saada broneeringusoov</a>
              <button onClick={() => setView('login')} className="rounded-2xl bg-slate-950 px-5 py-3 text-base font-extrabold text-white shadow-sm hover:bg-slate-800 md:hidden">Töötajale</button>
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-emerald-100 via-white to-amber-50 p-5">
              <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black">Täna kasulik</h2><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">kiirvaade</span></div>
              <div className="space-y-3">
                <a href="#sundmused" className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-white hover:bg-slate-50"><div><p className="font-extrabold">Lähimad sündmused</p><p className="text-sm text-slate-500">{publicEvents.length} sündmust tulekul</p></div><span className="text-xl">→</span></a>
                <a href="#ringid" className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-white hover:bg-slate-50"><div><p className="font-extrabold">Ringid ja tegevused</p><p className="text-sm text-slate-500">lastele, noortele, täiskasvanutele</p></div><span className="text-xl">→</span></a>
                <a href="#broneeri" className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-white hover:bg-slate-50"><div><p className="font-extrabold">Ruumide rent</p><p className="text-sm text-slate-500">aeg, teenused ja orienteeruv hind</p></div><span className="text-xl">→</span></a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 md:px-8">
          <div className="grid gap-4 md:grid-cols-4">
            <ActionCard icon="📅" title="Tulekul sündmused" text="Vaata, mis toimub Rannus ja Kongutas lähinädalatel." href="#sundmused" />
            <ActionCard icon="🎭" title="Ringid ja tegevused" text="Leia püsivad tegevused lastele, noortele ja täiskasvanutele." href="#ringid" />
            <ActionCard icon="🏠" title="Ruumide rent" text="Vali ruum, aeg ja teenused ning näe orienteeruvat hinda." href="#broneeri" />
            <ActionCard icon="☎" title="Kontakt" text="Leia aadressid, kontaktid ja vastuvõtuinfo." href="#kontakt" />
          </div>
        </section>

        <section id="sundmused" className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <SectionHeader eyebrow="Sündmused" title="Mis lähiajal toimub?" text="Otsi sündmusi nime, koha või sihtrühma järgi. Avalik kalender näitab ainult kinnitatud infot." />
            <div className="w-full rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 md:max-w-sm"><label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Otsi</label><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Näiteks peredele, kontsert, Rannu..." className="w-full bg-transparent text-sm outline-none" /></div>
          </div>
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ring-1 ${filter === item ? 'bg-emerald-700 text-white ring-emerald-700' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}`}>{item}</button>)}</div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filteredEvents.map((event) => <EventCard key={event.id} event={event} />)}</div>
        </section>

        <section id="ringid" className="bg-white py-12 ring-1 ring-slate-200">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <SectionHeader eyebrow="Ringid ja tegevused" title="Leia endale sobiv tegevus" text="Siin on püsivad ja korduvad tegevused. Prooviaegu saavad kollektiivide juhid muuta sisselogitud vaates." />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {publicActivities.map((item) => <div key={item.id} className="rounded-[1.5rem] bg-[#f8faf7] p-5 ring-1 ring-slate-200"><h3 className="text-lg font-black">{item.title}</h3><p className="mt-2 text-sm text-slate-600">{item.house}</p><p className="mt-3 text-sm font-semibold text-slate-950">Kellele: {item.audience}</p><p className="mt-1 text-sm text-slate-600">{item.time}</p><button className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-50">{item.contact}</button></div>)}
            </div>
          </div>
        </section>

        <section id="ruumid" className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <SectionHeader eyebrow="Ruumid" title="Vali sobiv ruum" text="Allolevad ruumid ja hinnad on piloodi näited. Päriskasutuses asenda need kinnitatud hinnakirja ja ruumikirjeldustega." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {rentalRooms.map((room) => <article key={room.id} className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold uppercase tracking-wide text-emerald-700">{room.house}</p><h3 className="mt-2 text-xl font-black">{room.name}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{room.description}</p><div className="mt-4 flex flex-wrap gap-2"><Pill>kuni {room.capacity} inimest</Pill><Pill>{euro(room.hourlyRate)} / h</Pill><Pill>min {room.minimumHours} h</Pill></div><a href="#broneeri" className="mt-5 inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">Broneeri</a></article>)}
          </div>
        </section>

        <BookingForm onBookingSubmit={onBookingSubmit} />

        <section id="majad" className="bg-white py-12 ring-1 ring-slate-200">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <SectionHeader eyebrow="Rahvamajad" title="Kaks maja, kaks kohalikku nägu" text="Rannu ja Konguta rahvamajad töötavad ühise avaliku vaatega, aga mõlemal majal on oma tugevused ja kogukondlik roll." />
            <div className="grid gap-5 md:grid-cols-2">
              {houses.map((house) => <article key={house.name} className="rounded-[1.7rem] bg-[#f8faf7] p-6 ring-1 ring-slate-200"><div className="mb-5 h-44 rounded-[1.3rem] bg-gradient-to-br from-emerald-100 via-sky-50 to-amber-50" /><h3 className="text-2xl font-black">{house.name}</h3><p className="mt-2 text-sm font-semibold text-slate-500">📍 {house.location}</p><p className="mt-4 leading-7 text-slate-600">{house.description}</p><div className="mt-5 flex flex-wrap gap-2">{house.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}</div></article>)}
            </div>
          </div>
        </section>

        <section id="kontakt" className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <SectionHeader eyebrow="Kontakt" title="Võta ühendust" text="Kirjuta või helista, kui soovid küsida sündmuse, ringi või ruumi kasutamise kohta." />
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-black">Üldkontakt</h3><p className="mt-3 text-slate-600">{bookingSettings.defaultEmail}</p><p className="mt-1 text-slate-600">+372 0000 0000</p></div>
            <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-black">Rannu rahvamaja</h3><p className="mt-3 text-slate-600">Rannu alevik</p><p className="mt-1 text-slate-600">Vastuvõtt kokkuleppel</p></div>
            <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-black">Konguta rahvamaja</h3><p className="mt-3 text-slate-600">Annikoru küla</p><p className="mt-1 text-slate-600">Vastuvõtt kokkuleppel</p></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between md:px-8"><p className="font-semibold">Rannu & Konguta rahvamajad</p><p>Sündmused · Ringid · Ruumide rent · Kontakt · <button onClick={() => setView('login')} className="font-bold text-emerald-700">Töötajale</button></p></div></footer>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden"><div className="mx-auto grid max-w-sm grid-cols-3 gap-2"><a href="#sundmused" className="rounded-2xl bg-slate-950 px-3 py-3 text-center text-sm font-bold text-white">Sündmused</a><a href="#broneeri" className="rounded-2xl bg-emerald-700 px-3 py-3 text-center text-sm font-bold text-white">Broneeri</a><button onClick={() => setView('login')} className="rounded-2xl bg-white px-3 py-3 text-center text-sm font-bold text-slate-900 ring-1 ring-slate-200">Töötajale</button></div></div>
    </div>
  )
}

function LoginView({ selectedRole, setSelectedRole, setView }) {
  const role = roles.find((item) => item.id === selectedRole)
  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <div className="mx-auto max-w-5xl">
        <button onClick={() => setView('public')} className="mb-6 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/15 hover:bg-white/15">← Tagasi avalikule lehele</button>
        <div className="grid gap-6 rounded-[2rem] bg-white p-5 text-slate-900 shadow-xl md:grid-cols-[0.9fr_1.1fr] md:p-8">
          <div className="rounded-[1.5rem] bg-gradient-to-br from-emerald-100 via-white to-amber-50 p-6"><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Sisselogimine</p><h1 className="mt-3 text-4xl font-black tracking-tight">Töötaja ja juhendaja vaade</h1><p className="mt-4 leading-7 text-slate-600">Prototüübis saad rolli valida. Päris süsteemis tuleks siia Google / Microsoft / e-postiga sisselogimine.</p><div className="mt-6 rounded-2xl bg-white/80 p-4 ring-1 ring-white"><p className="text-sm font-bold text-slate-950">Valitud roll</p><p className="mt-1 text-sm leading-6 text-slate-600">{role.description}</p></div></div>
          <div><h2 className="text-xl font-black">Vali roll</h2><div className="mt-4 grid gap-3">{roles.map((item) => <button key={item.id} onClick={() => setSelectedRole(item.id)} className={`rounded-2xl p-4 text-left ring-1 transition ${selectedRole === item.id ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-200 hover:bg-slate-50'}`}><p className="font-black">{item.label}</p><p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p></button>)}</div><button onClick={() => setView('admin')} className="mt-5 w-full rounded-2xl bg-emerald-700 px-5 py-3 text-base font-extrabold text-white hover:bg-emerald-800">Logi sisse prototüüpi</button></div>
        </div>
      </div>
    </div>
  )
}

function AdminView({ selectedRole, setSelectedRole, setView, events, setEvents, activities, setActivities, requests, setRequests, bookings }) {
  const [tab, setTab] = useState('overview')
  const [newEvent, setNewEvent] = useState({ title: '', house: 'Rannu rahvamaja', date: '', weekday: '', time: '', audience: 'Kõigile', category: 'Sündmus', price: 'Tasuta', room: '', tech: '', description: '' })
  const [activityChange, setActivityChange] = useState({ activityId: 1, newTime: '', note: '' })
  const role = roles.find((item) => item.id === selectedRole)
  const pendingRequests = requests.filter((item) => item.status === 'ootel')
  const pendingEvents = events.filter((item) => item.status === 'review')
  const canApprove = selectedRole === 'director' || selectedRole === 'admin'
  const canEditEvents = selectedRole === 'director' || selectedRole === 'admin'
  const canEditCollectives = selectedRole === 'director' || selectedRole === 'admin' || selectedRole === 'collective'
  const canSeeTech = selectedRole === 'director' || selectedRole === 'admin' || selectedRole === 'tech'

  function submitEvent() {
    if (!newEvent.title || !newEvent.date || !newEvent.time) return
    setEvents([{ id: Date.now(), ...newEvent, registration: false, public: true, status: canApprove ? 'published' : 'review', owner: role.label }, ...events])
    setNewEvent({ title: '', house: 'Rannu rahvamaja', date: '', weekday: '', time: '', audience: 'Kõigile', category: 'Sündmus', price: 'Tasuta', room: '', tech: '', description: '' })
  }

  function submitActivityChange() {
    const activity = activities.find((item) => item.id === Number(activityChange.activityId))
    if (!activity || !activityChange.newTime) return
    setRequests([{ id: Date.now(), type: 'Prooviaja muudatus', title: `${activity.title}: uus aeg`, submittedBy: role.label, house: activity.house, target: activity.title, oldValue: activity.time, newValue: activityChange.newTime, status: 'ootel', note: activityChange.note }, ...requests])
    setActivityChange({ activityId: 1, newTime: '', note: '' })
  }

  function approveRequest(id) {
    const request = requests.find((item) => item.id === id)
    if (request?.type === 'Prooviaja muudatus') setActivities(activities.map((activity) => activity.title === request.target ? { ...activity, time: request.newValue } : activity))
    setRequests(requests.map((item) => item.id === id ? { ...item, status: 'kinnitatud' } : item))
  }

  const tabs = [
    { id: 'overview', label: 'Ülevaade' },
    { id: 'bookings', label: `Broneeringud (${bookings.length})` },
    { id: 'events', label: 'Sündmused' },
    { id: 'collectives', label: 'Kollektiivid' },
    { id: 'rooms', label: 'Ruumid ja tehnika' },
    { id: 'approvals', label: `Kinnitused (${pendingRequests.length + pendingEvents.length})` }
  ]

  return (
    <div className="min-h-screen bg-[#f8faf7] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">RK</div><div><p className="text-base font-black leading-tight">Sisuhaldus</p><p className="text-xs font-semibold text-slate-500">{role.label}</p></div></div><div className="flex flex-wrap items-center gap-2"><select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="rounded-2xl bg-slate-50 px-4 py-2 text-sm font-bold outline-none ring-1 ring-slate-200">{roles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><button onClick={() => setView('public')} className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">Avalik vaade</button><button onClick={() => setView('login')} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Välju</button></div></div></header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 rounded-[2rem] bg-slate-950 p-6 text-white md:p-8"><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">Üks süsteem</p><h1 className="mt-2 text-3xl font-black md:text-5xl">Avalik kalender + broneeringud + sisuhaldus</h1><p className="mt-4 max-w-3xl leading-7 text-white/70">Avalik leht näitab kinnitatud infot. Broneeringuvorm koostab päringu, arvutab hinna ja saadab info rahvamajale ning kliendile.</p></div>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-full px-4 py-2 text-sm font-bold ring-1 ${tab === item.id ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}`}>{item.label}</button>)}</div>

        {tab === 'overview' && <section className="grid gap-4 md:grid-cols-4"><div className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Avalikke sündmusi</p><p className="mt-2 text-3xl font-black">{events.filter((e) => e.status === 'published').length}</p></div><div className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Broneeringusoove</p><p className="mt-2 text-3xl font-black">{bookings.length}</p></div><div className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Kinnitamisel</p><p className="mt-2 text-3xl font-black">{pendingRequests.length + pendingEvents.length}</p></div><div className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Ruumid</p><p className="mt-2 text-3xl font-black">{rentalRooms.length}</p></div></section>}

        {tab === 'bookings' && <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]"><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Broneeringusoovid</h2><div className="mt-4 space-y-3">{bookings.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">Broneeringuid ei ole veel prototüübis lisatud.</p>}{bookings.map((booking, index) => <div key={`${booking.createdAt}-${index}`} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{booking.house} · {booking.roomName}</h3><p className="mt-1 text-sm text-slate-600">{booking.date} · {booking.startTime}–{booking.endTime} · {booking.name}</p><p className="mt-1 text-sm text-slate-600">{booking.eventType} · {booking.participants || '-'} osalejat</p></div><StatusPill status="ootel" /></div><p className="mt-3 text-sm font-bold text-slate-950">Orienteeruv hind: {euro(booking.estimatedTotal)}</p><p className="mt-1 text-xs text-slate-500">Kontakt: {booking.email} · {booking.phone}</p></div>)}</div></div><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Professionaalne töövoog</h2><ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700"><li><b>1.</b> Klient saadab päringu.</li><li><b>2.</b> Süsteem saadab koopia kliendile ja rahvamajale.</li><li><b>3.</b> Töötaja kontrollib ruumi saadavust.</li><li><b>4.</b> Töötaja kinnitab hinna ja tingimused.</li><li><b>5.</b> Vajadusel koostatakse leping või arve.</li></ol></div></section>}

        {tab === 'events' && <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Lisa sündmus</h2>{!canEditEvents && <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-100">Sinu roll saab esitada muudatusi ainult oma kollektiivi kohta.</p>}<div className="mt-4 grid gap-3"><Field label="Pealkiri"><input disabled={!canEditEvents} className={inputClass} value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Sündmuse nimi" /></Field><div className="grid gap-3 md:grid-cols-2"><Field label="Rahvamaja"><select disabled={!canEditEvents} className={inputClass} value={newEvent.house} onChange={(e) => setNewEvent({ ...newEvent, house: e.target.value })}><option>Rannu rahvamaja</option><option>Konguta rahvamaja</option></select></Field><Field label="Kuupäev"><input disabled={!canEditEvents} className={inputClass} value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} placeholder="nt 22. juuni" /></Field><Field label="Kellaaeg"><input disabled={!canEditEvents} className={inputClass} value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} placeholder="nt 18.00" /></Field><Field label="Ruum"><input disabled={!canEditEvents} className={inputClass} value={newEvent.room} onChange={(e) => setNewEvent({ ...newEvent, room: e.target.value })} placeholder="nt saal" /></Field></div><Field label="Avalik kirjeldus"><textarea disabled={!canEditEvents} className={`${inputClass} min-h-[100px]`} value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Lühike tekst avalikule lehele" /></Field><button disabled={!canEditEvents} onClick={submitEvent} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">Lisa sündmus</button></div></div><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Sündmuste nimekiri</h2><div className="mt-4 space-y-3">{events.map((event) => <div key={event.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{event.title}</h3><p className="mt-1 text-sm text-slate-600">{event.house} · {event.date} · {event.time}</p><p className="mt-1 text-xs text-slate-500">Ruum: {event.room || 'määramata'} · Tehnika: {event.tech || 'puudub'}</p></div><StatusPill status={event.status} /></div></div>)}</div></div></section>}

        {tab === 'collectives' && <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Muuda prooviaega</h2><p className="mt-3 text-sm leading-6 text-slate-600">Kollektiivi juht saab esitada oma prooviaja muudatuse. See liigub kinnitamisele.</p><div className="mt-4 grid gap-3"><Field label="Kollektiiv"><select disabled={!canEditCollectives} className={inputClass} value={activityChange.activityId} onChange={(e) => setActivityChange({ ...activityChange, activityId: e.target.value })}>{activities.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.house}</option>)}</select></Field><Field label="Uus prooviaeg"><input disabled={!canEditCollectives} className={inputClass} value={activityChange.newTime} onChange={(e) => setActivityChange({ ...activityChange, newTime: e.target.value })} placeholder="nt Kolmapäeviti 18.30" /></Field><button disabled={!canEditCollectives} onClick={submitActivityChange} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">Saada kinnitamiseks</button></div></div><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Kollektiivid ja ringid</h2><div className="mt-4 space-y-3">{activities.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><h3 className="font-black">{item.title}</h3><p className="mt-1 text-sm text-slate-600">{item.house} · {item.room}</p><p className="mt-1 text-sm font-semibold text-slate-900">{item.time}</p></div>)}</div></div></section>}

        {tab === 'rooms' && <section className="grid gap-6 lg:grid-cols-[1fr_1fr]"><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Ruumid ja hinnad</h2><div className="mt-5 space-y-3">{rentalRooms.map((room) => <div key={room.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><p className="font-black">{room.house} · {room.name}</p><p className="mt-1 text-sm text-slate-600">{euro(room.hourlyRate)} / h · min {room.minimumHours} h · koristus ja ettevalmistus hinnas</p></div>)}</div></div><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Tehnilised vajadused</h2>{!canSeeTech && <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">Sinu roll ei näe tehnilisi ettevalmistusi.</p>}{canSeeTech && <div className="mt-5 space-y-3">{events.map((event) => <div key={event.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><p className="font-black">{event.title}</p><p className="mt-1 text-sm text-slate-600">{event.tech || 'Tehniline vajadus lisamata'}</p></div>)}</div>}</div></section>}

        {tab === 'approvals' && <section className="grid gap-6 lg:grid-cols-[1fr_1fr]"><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Muudatused kinnitamiseks</h2><div className="mt-4 space-y-3">{requests.map((request) => <div key={request.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{request.type}</p><h3 className="mt-1 font-black">{request.title}</h3><p className="mt-1 text-sm text-slate-600">{request.house} · esitas: {request.submittedBy}</p><p className="mt-2 text-sm text-slate-500">Vana: {request.oldValue}</p><p className="text-sm font-semibold text-slate-900">Uus: {request.newValue}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{request.status}</span></div>{canApprove && request.status === 'ootel' && <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => approveRequest(request.id)} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Kinnita</button></div>}</div>)}</div></div><div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Avaldamata sündmused</h2>{pendingEvents.length === 0 && <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-100">Kõik sündmused on avaldatud või kinnitusi ei ole.</p>}</div></section>}
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
  if (view === 'admin') return <AdminView selectedRole={selectedRole} setSelectedRole={setSelectedRole} setView={setView} events={events} setEvents={setEvents} activities={activities} setActivities={setActivities} requests={requests} setRequests={setRequests} bookings={bookings} />
  return <PublicView events={events} activities={activities} setView={setView} onBookingSubmit={handleBookingSubmit} />
}
