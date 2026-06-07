export const bookingSettings = {
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbzdFUJ4VLN_jjgX3KZsGDtwpU6cdBuLlRNGyZRodzIOktR2ZF6IuIGGMe_CV4rlnIe5/exec',
  defaultEmail: 'kultuur@elva.ee',
  priceDisclaimer: 'Hind on orienteeruv. Lõpliku hinna, ruumi saadavuse ja tingimused kinnitab rahvamaja töötaja.',
  adminPin: '2026'
}

export const instructors = [
  { id: 'rahvatants-rannu', name: 'Rahvatantsurühma juhendaja', pin: '4821', collective: 'Rahvatants', house: 'Rannu rahvamaja', active: true },
  { id: 'kasitoo-konguta', name: 'Käsitööringi juhendaja', pin: '7394', collective: 'Käsitöö- ja loovtöötuba', house: 'Konguta rahvamaja', active: true }
]

export const initialEvents = [
  { id: 1, kind: 'event', title: 'Kogukonna filmiõhtu', house: 'Rannu rahvamaja', roomId: 'rannu-saal', dateISO: '2026-06-12', startTime: '19:00', endTime: '21:30', status: 'published', public: true, displayMode: 'full' },
  { id: 2, kind: 'event', title: 'Loovtöötuba', house: 'Konguta rahvamaja', roomId: 'konguta-saal', dateISO: '2026-06-16', startTime: '11:00', endTime: '13:00', status: 'published', public: true, displayMode: 'full' }
]

export const initialActivities = [
  { id: 'a1', kind: 'activity', title: 'Segakoor', house: 'Konguta rahvamaja', time: 'Esmaspäev 19:00', instructor: 'Meelis Külaots', joinInfo: 'Kirjuta kultuur@elva.ee', status: 'published' },
  { id: 'a2', kind: 'activity', title: 'Rahvatants', house: 'Rannu rahvamaja', time: 'Teisipäev 18:30', instructor: 'Jaan Tamm', joinInfo: 'Tule proovi kohale', status: 'published' }
]

export const rentalRooms = [
  { id: 'rannu-saal', name: 'Rannu suur saal', house: 'Rannu rahvamaja', capacity: 120, hourlyRate: 25, minimumHours: 2, bufferBeforeMinutes: 60, bufferAfterMinutes: 60, included: ['WC', 'wifi'], agreement: [] },
  { id: 'konguta-saal', name: 'Konguta saal', house: 'Konguta rahvamaja', capacity: 80, hourlyRate: 22, minimumHours: 2, bufferBeforeMinutes: 60, bufferAfterMinutes: 60, included: ['WC', 'wifi'], agreement: [] }
]

export const rentalServices = [
  { id: 'tech', label: 'Tehniline tugi', price: 20, pricing: 'hourly' }
]

export const houses = [
  { name: 'Rannu rahvamaja', location: 'Rannu alevik', description: 'Piirkondlik kultuurikeskus.', tags: ['kontserdid', 'rahvakultuur'] },
  { name: 'Konguta rahvamaja', location: 'Annikoru küla', description: 'Kogukondlik kultuuripesa.', tags: ['töötoad', 'väliala'] }
]

export const roles = [
  { id: 'director', label: 'Juhataja' },
  { id: 'collective', label: 'Ringijuht' }
]

export const initialRequests = []
export const filters = ['Kõik', 'Rannu', 'Konguta']
