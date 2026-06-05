export const bookingSettings = {
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbzdFUJ4VLN_jjgX3KZsGDtwpU6cdBuLlRNGyZRodzIOktR2ZF6IuIGGMe_CV4rlnIe5/exec',
  defaultEmail: 'kultuur@elva.ee',
  clientCopySubject: 'Sinu ruumi kasutamise soov on kätte saadud.',
  priceDisclaimer: 'Hind on orienteeruv. Lõpliku hinna, ruumi saadavuse ja tingimused kinnitab rahvamaja töötaja.',
  adminPin: '2026'
}



export const instructors = [
  {
    id: 'rahvatants-rannu',
    name: 'Rahvatantsurühma juhendaja',
    email: 'juhendaja@example.com',
    pin: '4821',
    collective: 'Rahvatants',
    house: 'Rannu rahvamaja',
    roomId: 'rannu-saal',
    room: 'Suur saal',
    active: true
  },
  {
    id: 'kasitoo-konguta',
    name: 'Käsitööringi juhendaja',
    email: 'kasitoo@example.com',
    pin: '7394',
    collective: 'Käsitöö- ja loovtöötuba',
    house: 'Konguta rahvamaja',
    roomId: 'konguta-saal',
    room: 'Saal',
    active: true
  }
]

export const initialEvents = [
  {
    id: 1,
    title: 'Kogukonna filmiõhtu',
    publicTitle: 'Kogukonna filmiõhtu',
    displayMode: 'full',
    house: 'Rannu rahvamaja',
    roomId: 'rannu-saal',
    room: 'Suur saal',
    dateISO: '2026-06-12',
    date: '12. juuni',
    weekday: 'reede',
    startTime: '19:00',
    endTime: '21:30',
    audience: 'Täiskasvanutele',
    category: 'Film',
    price: 'Tasuta',
    registration: false,
    public: true,
    blocksRoom: true,
    status: 'published',
    tech: 'projektor, heli',
    owner: 'Rannu rahvamaja',
    description: 'Hubane filmiõhtu Rannu rahvamajas koos väikese kohvikunurgaga.'
  },
  {
    id: 2,
    title: 'Loovtöötuba peredele',
    publicTitle: 'Loovtöötuba peredele',
    displayMode: 'full',
    house: 'Konguta rahvamaja',
    roomId: 'konguta-saal',
    room: 'Saal',
    dateISO: '2026-06-16',
    date: '16. juuni',
    weekday: 'teisipäev',
    startTime: '11:00',
    endTime: '13:00',
    audience: 'Peredele',
    category: 'Töötuba',
    price: 'Tasuta',
    registration: true,
    public: true,
    blocksRoom: true,
    status: 'published',
    tech: 'lauad, materjalid',
    owner: 'Konguta rahvamaja',
    description: 'Praktiline loovtöötuba lastele ja vanematele. Vajalik eelregistreerimine.'
  },
  {
    id: 3,
    title: 'Eraüritus: sünnipäev',
    publicTitle: 'Ruum broneeritud',
    displayMode: 'neutral',
    house: 'Rannu rahvamaja',
    roomId: 'rannu-saal',
    room: 'Suur saal',
    dateISO: '2026-06-20',
    date: '20. juuni',
    weekday: 'laupäev',
    startTime: '16:00',
    endTime: '23:00',
    audience: 'Kinnine kasutus',
    category: 'Broneering',
    price: '',
    registration: false,
    public: true,
    blocksRoom: true,
    status: 'published',
    tech: '',
    owner: 'Klient',
    description: 'Rahvamaja ruum on sel ajal broneeritud.'
  },
  {
    id: 4,
    title: 'Suveõhtu Annikoru välialal',
    publicTitle: 'Suveõhtu Annikoru välialal',
    displayMode: 'full',
    house: 'Konguta rahvamaja',
    roomId: 'konguta-valiala',
    room: 'Väliala / laululava ümbrus',
    dateISO: '2026-06-07',
    date: '7. juuni',
    weekday: 'pühapäev',
    startTime: '20:00',
    endTime: '23:00',
    audience: 'Kõigile',
    category: 'Kontsert',
    price: 'Tasuta',
    registration: false,
    public: true,
    blocksRoom: true,
    status: 'published',
    tech: 'lava, valgus, heli',
    owner: 'Konguta rahvamaja',
    description: 'Kogukondlik suveõhtu muusika, piknikuala ja mõnusa koosolemisega.'
  }
]

export const initialActivities = [
  {
    id: 1,
    title: 'Rahvatants',
    publicTitle: 'Rahvatantsu proov',
    displayMode: 'category',
    house: 'Rannu rahvamaja',
    roomId: 'rannu-saal',
    room: 'Suur saal',
    audience: 'täiskasvanutele',
    time: 'Teisipäeviti 18.00–20.00',
    dateISO: '2026-06-09',
    startTime: '18:00',
    endTime: '20:00',
    leader: 'Kollektiivi juht',
    contact: 'Küsi lisa',
    status: 'published',
    public: true,
    blocksRoom: true
  },
  {
    id: 2,
    title: 'Käsitöö- ja loovtöötuba',
    publicTitle: 'Ringitegevus',
    displayMode: 'category',
    house: 'Konguta rahvamaja',
    roomId: 'konguta-saal',
    room: 'Saal',
    audience: 'noortele ja täiskasvanutele',
    time: 'Kord kuus',
    dateISO: '2026-06-18',
    startTime: '17:30',
    endTime: '19:30',
    leader: 'Töötoa juhendaja',
    contact: 'Liitu huviga',
    status: 'published',
    public: true,
    blocksRoom: true
  },
  {
    id: 3,
    title: 'Eakate kohtumised',
    publicTitle: 'Eakate kohtumine',
    displayMode: 'full',
    house: 'Rannu rahvamaja',
    roomId: 'rannu-vaike-saal',
    room: 'Väike saal / koosolekuruum',
    audience: 'eakatele',
    time: 'Kaks korda kuus',
    dateISO: '2026-06-10',
    startTime: '11:00',
    endTime: '13:00',
    leader: 'Rahvamaja juht',
    contact: 'Vaata aega',
    status: 'published',
    public: true,
    blocksRoom: true
  }
]

export const initialRequests = [
  { id: 101, type: 'Prooviaja muudatus', title: 'Rahvatantsu proov soovib liikuda kolmapäevale', submittedBy: 'Rahvatantsurühma juht', house: 'Rannu rahvamaja', target: 'Rahvatants', oldValue: 'Teisipäeviti 18.00–20.00', newValue: 'Kolmapäeviti 18.30–20.30', status: 'ootel', publicTitle: 'Rahvatantsu proov' },
  { id: 102, type: 'Uus sündmus', title: 'Kogukonna pannkoogihommik', submittedBy: 'Konguta külaseltsi esindaja', house: 'Konguta rahvamaja', target: 'Avalik kalender', oldValue: '-', newValue: '22. juuni kell 10.00', status: 'ootel', publicTitle: 'Kogukonna hommik' }
]

export const rentalRooms = [
  {
    id: 'rannu-saal',
    house: 'Rannu rahvamaja',
    email: 'rannu@elva.ee',
    name: 'Suur saal',
    capacity: 120,
    hourlyRate: 25,
    minimumHours: 2,
    bufferBeforeMinutes: 60,
    bufferAfterMinutes: 60,
    cleaningFee: 0,
    cleaningIncluded: true,
    description: 'Sobib kontserdiks, peoks, koosolekuks ja koolituseks.',
    included: ['saal ja lava', 'WC', 'garderoob', 'toolide ja laudade tavapaigutus', 'koristus ja ettevalmistus', 'esmane kasutajajuhend'],
    agreement: ['köögi kasutamine kokkuleppel', 'tegelaste toa kasutamine kokkuleppel']
  },
  {
    id: 'rannu-vaike-saal',
    house: 'Rannu rahvamaja',
    email: 'rannu@elva.ee',
    name: 'Väike saal / koosolekuruum',
    capacity: 35,
    hourlyRate: 15,
    minimumHours: 1,
    bufferBeforeMinutes: 30,
    bufferAfterMinutes: 30,
    cleaningFee: 0,
    cleaningIncluded: true,
    description: 'Sobib koosolekuks, väiksemaks töötoaks ja nõupidamiseks.',
    included: ['ruumi tavakasutus', 'WC', 'garderoob', 'lauad ja toolid tavapaigutuses', 'wifi', 'koristus ja ettevalmistus'],
    agreement: ['köögi kasutamine kokkuleppel', 'tegelaste toa kasutamine kokkuleppel']
  },
  {
    id: 'konguta-saal',
    house: 'Konguta rahvamaja',
    email: 'konguta@elva.ee',
    name: 'Saal',
    capacity: 80,
    hourlyRate: 22,
    minimumHours: 2,
    bufferBeforeMinutes: 60,
    bufferAfterMinutes: 60,
    cleaningFee: 0,
    cleaningIncluded: true,
    description: 'Paindlik ruum töötubadeks, perepäevadeks, pidudeks ja kogukonnaüritusteks.',
    included: ['saali tavakasutus', 'WC', 'garderoob', 'lauad ja toolid tavapaigutuses', 'projektori kasutamise võimalus', 'koristus ja ettevalmistus', 'esmane kasutajajuhend'],
    agreement: ['köögi kasutamine kokkuleppel', 'tegelaste toa kasutamine kokkuleppel']
  },
  {
    id: 'konguta-valiala',
    house: 'Konguta rahvamaja',
    email: 'konguta@elva.ee',
    name: 'Väliala / laululava ümbrus',
    capacity: 300,
    hourlyRate: 30,
    minimumHours: 3,
    bufferBeforeMinutes: 120,
    bufferAfterMinutes: 120,
    cleaningFee: 0,
    cleaningIncluded: true,
    description: 'Sobib suveõhtuks, välisündmuseks ja kogukonna koosviibimiseks.',
    included: ['väliala kasutus', 'WC kasutus kokkulepitud ulatuses', 'garderoobi kasutus kokkulepitud ulatuses', 'ligipääsu kokkulepe', 'koristus ja ettevalmistus', 'esmane riskide ülevaatus'],
    agreement: ['köögi kasutamine kokkuleppel', 'tegelaste toa kasutamine kokkuleppel']
  }
]

export const rentalServices = [
  { id: 'basic-sound', label: 'Helitehnika põhikomplekt', description: 'Kõlarid ja mikrofon kuni väikese sündmuse jaoks.', price: 20, pricing: 'fixed' },
  { id: 'projector', label: 'Projektor ja ekraan', description: 'Esitlus, film või koosolekumaterjalid.', price: 10, pricing: 'fixed' },
  { id: 'light-basic', label: 'Valgustuse põhiseadistus', description: 'Lihtne lava- või saalivalgus.', price: 25, pricing: 'fixed' },
  { id: 'tech-hour', label: 'Tehniku kohalolu', description: 'Tehniline tugi sündmuse ajal.', price: 20, pricing: 'hourly' },
  { id: 'coffee', label: 'Kohvilaua ettevalmistus', description: 'Kohv, tee ja lauanõud. Toitlustus eraldi kokkuleppel.', price: 15, pricing: 'fixed' }
]

export const houses = [
  { name: 'Rannu rahvamaja', location: 'Rannu alevik', description: 'Piirkondlik kultuuri- ja kooskäimiskoht, kus toimuvad kontserdid, huviringid, kogukonnaõhtud ja kohtumised.', tags: ['kontserdid', 'rahvakultuur', 'koosolekud', 'eakate tegevused'] },
  { name: 'Konguta rahvamaja', location: 'Annikoru küla', description: 'Kogukondlik kultuuripesa, mis sobib töötubadeks, perepäevadeks, noorte algatusteks ja väliala sündmusteks.', tags: ['töötoad', 'pered', 'noored', 'väliala'] }
]

export const roles = [
  { id: 'director', label: 'Rahvamaja juht', description: 'Lisab ja kinnitab sündmusi, kohendab avaliku kalendri tekste, haldab ruume ja broneeringuid.' },
  { id: 'admin', label: 'Administraator / kunstiline juht', description: 'Haldab avalikku infot, sündmusi, ringe, broneeringuid ja kommunikatsiooni.' },
  { id: 'collective', label: 'Kollektiivi juht', description: 'Lisab ja muudab oma kollektiivi infot, prooviaegu ja avalikke teateid kinnitamiseks.' },
  { id: 'tech', label: 'Juht / tehnik', description: 'Näeb ruumide hõivatust, tehnilisi vajadusi, inventari ja ettevalmistuse ülesandeid.' }
]

export const filters = ['Kõik', 'Rannu', 'Konguta', 'Peredele', 'Noortele', 'Eakatele', 'Tasuta', 'Registreerimisega']
