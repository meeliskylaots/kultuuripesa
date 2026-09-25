export const bookingSettings = {
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbzdFUJ4VLN_jjgX3KZsGDtwpU6cdBuLlRNGyZRodzIOktR2ZF6IuIGGMe_CV4rlnIe5/exec',
  defaultEmail: 'kultuur@elva.ee',
  clientCopySubject: 'Sinu ruumi kasutamise soov on kätte saadud.',
  priceDisclaimer: 'Hind on orienteeruv. Lõpliku hinna, ruumi saadavuse ja tingimused kinnitab rahvamaja töötaja.'
}

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
  {
    id: 101,
    type: 'Prooviaja muudatus',
    title: 'Rahvatantsu proov soovib liikuda kolmapäevale',
    submittedBy: 'Rahvatantsurühma juht',
    house: 'Rannu rahvamaja',
    target: 'Rahvatants',
    oldValue: 'Teisipäeviti 18.00–20.00',
    newValue: 'Kolmapäeviti 18.30–20.30',
    status: 'ootel',
    publicTitle: 'Rahvatantsu proov'
  },
  {
    id: 102,
    type: 'Uus sündmus',
    title: 'Kogukonna pannkoogihommik',
    submittedBy: 'Konguta külaseltsi esindaja',
    house: 'Konguta rahvamaja',
    target: 'Avalik kalender',
    oldValue: '-',
    newValue: '22. juuni kell 10.00',
    status: 'ootel',
    publicTitle: 'Kogukonna hommik'
  }
]

export const houses = [
  {
    id: 'rannu',
    name: 'Rannu rahvamaja',
    active: true,
    location: 'Elva tee 7, Rannu alevik, Elva vald, 61120 Tartumaa',
    description: 'Rannu rahvamajas toimuvad kontserdid, teatrietendused, tantsuõhtud ja huviringid. Majas asuvad ka Rannu kandi muuseum, raamatukogu ja teenuskeskus.',
    email: 'kulli.kornav@elva.ee',
    phone: '+372 5329 2468',
    contactPerson: 'Külli Kornav, kultuurikorraldaja',
    website: 'https://elvakultuur.ee/rannu-rahvamaja/tutvustus/',
    activitiesUrl: 'https://elvakultuur.ee/rannu-rahvamaja/huviringid/',
    collectivesUrl: 'https://elvakultuur.ee/rannu-rahvamaja/kultuurikollektiivid/',
    collectives: ['Naisrahvatantsurühm Kati', 'Segarahvatantsu- ja folkloorirühm Kolumats', 'Laulu ja tantsurühm Liisud'],
    tags: ['teater', 'rahvatants', 'huviringid', 'muuseum']
  },
  {
    id: 'konguta',
    name: 'Konguta rahvamaja',
    active: true,
    location: 'Annikoru küla, Elva vald, 61202 Tartumaa',
    description: 'Annikoru külas asuv rahvamaja ühendab kohalikke kultuuriharrastajaid. Lähedal Annikoru puhkepargis asub ka laululava.',
    email: 'konguta.rahvamaja@elva.ee',
    phone: '+372 525 9576',
    contactPerson: 'Meelis Külaots, juhataja',
    website: 'https://elvakultuur.ee/konguta-rahvamaja/tutvustus/',
    activitiesUrl: 'https://elvakultuur.ee/konguta-rahvamaja/huviringid/',
    collectivesUrl: 'https://elvakultuur.ee/konguta-rahvamaja/kultuurikollektiivid/',
    collectives: ['Konguta segakoor', 'Segarühm Kavalik', 'Tantsurühm Pihlakobar', 'Naisansambel MESI'],
    tags: ['segakoor', 'rahvatants', 'huviringid', 'laululava']
  },
  {
    id: 'puhja',
    name: 'Puhja rahvamaja',
    active: false,
    location: 'Puhja',
    description: '',
    tags: []
  },
  {
    id: 'rongu',
    name: 'Rõngu rahvamaja',
    active: false,
    location: 'Rõngu',
    description: '',
    tags: []
  }
]

export const activeHouses = houses.filter((house) => house.active)

// Avalik huviringide teave. Siin toodud kellaajad ei ole ruumibroneeringud.
// Enne proovide kalendrisse lisamist peab töötaja kinnitama ruumi ja kuupäevad.
export const publicActivities = [
  { houseId: 'konguta', title: 'Konguta segakoor', time: 'Esmaspäeval kell 19.00', leader: 'Ragne Lind ja Merilin Seer', place: 'Konguta rahvamaja' },
  { houseId: 'konguta', title: 'Segarühm Kavalik', time: 'Neljapäeval kell 19.30', leader: 'Kaie Tali', place: 'Konguta rahvamaja' },
  { houseId: 'konguta', title: 'Ansambel MESI', time: 'Teisipäeval kell 18.30', leader: 'Merilin Seer', place: 'Konguta rahvamaja / kool' },
  { houseId: 'konguta', title: 'Tantsurühm Pihlakobar', time: 'Kolmapäeval kell 18.00', leader: 'Kaie Tali', place: 'Konguta rahvamaja' },
  { houseId: 'konguta', title: 'Laste showtants RN Stuudio', time: 'Kolmapäeval kell 12.30', leader: 'Merit Täht', place: 'Konguta kool' },
  { houseId: 'konguta', title: 'Laste laulustuudio', time: 'E 14.00 · T 13.40 · K 15.30 · N 12.45', leader: 'Merilin Seer', place: 'Konguta rahvamaja / kool' },
  { houseId: 'rannu', title: 'Laste rahvatants (1.–4. klass)', time: 'Esmaspäeval 13.00–14.00, alates 5. oktoobrist', leader: 'Külli Kornav', place: 'Rannu rahvamaja' },
  { houseId: 'rannu', title: 'Savikoda lastele ja noortele', time: 'Esmaspäeval 13.00–15.00, alates 5. oktoobrist', leader: 'Liis Laht (OÜ Metsaliisu)', place: 'Rannu rahvamaja' },
  { houseId: 'rannu', title: 'Savikoda', time: 'Esmaspäeval 16.00–18.00 või 18.00–20.00', leader: 'Liis Laht (OÜ Metsaliisu)', place: 'Rannu rahvamaja' },
  { houseId: 'rannu', title: 'Jooga', time: 'Esmaspäeval 19.00–20.00', leader: 'Anne Kalvi', place: 'Peeglisaal' },
  { houseId: 'rannu', title: 'Naisrahvatantsurühm Kati', time: 'Esmaspäeval ja kolmapäeval 18.00–20.00', leader: 'Külli Kornav', place: 'Rannu rahvamaja' },
  { houseId: 'rannu', title: 'Beebikool', time: 'Teisipäeval 9.30–10.00 (4–7 kuud) või 10.30–11.00 (alates 8 kuust)', leader: 'Irina Radionova', place: 'Rannu rahvamaja' },
  { houseId: 'rannu', title: 'Segarühm Kolumats', time: 'Teisipäeval ja neljapäeval 19.00–21.00', leader: 'Lea Kurvits', place: 'Rannu rahvamaja' },
  { houseId: 'rannu', title: 'Pärimusrühm Liisu', time: 'Kolmapäeval 9.30–11.00', leader: 'Küllike Lõhmus ja Margit Aruksaar', place: 'Rannu rahvamaja' },
  { houseId: 'rannu', title: 'Kabe, male ja mõttemängud', time: 'Reedel 14.00–15.30', leader: 'Anna Lütsepp', place: 'Rannu rahvamaja' },
  { houseId: 'rannu', title: 'Kokandus', time: 'Reedel 14.00–16.30', leader: 'Elle Männamets', place: 'Rannu noortekeskus' },
  { houseId: 'rannu', title: 'EELK Rannu koguduse segakoor', time: 'Pühapäeval 16.00–17.30, kaks korda kuus', leader: 'Mart Jaanson', place: 'Rannu noortekeskus' }
]

// Lähteandmed ühekordseks impordiks; hiljem hallatakse avalikke kirjeid töölaual.
export const officialCollectives = [
  { name: 'Konguta segakoor', house: 'Konguta rahvamaja', instructor: 'Merilin Seer ja Ragne Lind', description: 'Konguta segakoor laulab koorimuusikat klassikast jazz-popini.', sourceUrl: 'https://elvakultuur.ee/konguta-rahvamaja/kultuurikollektiivid/' },
  { name: 'Segarühm Kavalik', house: 'Konguta rahvamaja', instructor: 'Kaie Tali', description: 'Segarühm tantsib eesti ja teiste rahvaste tantse.', sourceUrl: 'https://elvakultuur.ee/konguta-rahvamaja/kultuurikollektiivid/' },
  { name: 'Tantsurühm Pihlakobar', house: 'Konguta rahvamaja', instructor: 'Kaie Tali', description: 'Memmede rahvatantsurühm.', sourceUrl: 'https://elvakultuur.ee/konguta-rahvamaja/kultuurikollektiivid/' },
  { name: 'Naisansambel MESI', house: 'Konguta rahvamaja', instructor: 'Merilin Seer', description: 'Naisansambel esitab eriilmelisi laule.', sourceUrl: 'https://elvakultuur.ee/konguta-rahvamaja/kultuurikollektiivid/' },
  { name: 'Naisrahvatantsurühm Kati', house: 'Rannu rahvamaja', instructor: 'Külli Kornav', description: 'Rannu naisrahvatantsurühm.', sourceUrl: 'https://elvakultuur.ee/rannu-rahvamaja/kultuurikollektiivid/' },
  { name: 'Segarahvatantsu- ja folkloorirühm Kolumats', house: 'Rannu rahvamaja', instructor: 'Lea Kurvits', description: 'Rannu segarahvatantsu- ja folkloorirühm.', sourceUrl: 'https://elvakultuur.ee/rannu-rahvamaja/kultuurikollektiivid/' },
  { name: 'Laulu ja tantsurühm Liisud', house: 'Rannu rahvamaja', instructor: '', description: 'Rannu laulu- ja tantsurühm.', sourceUrl: 'https://elvakultuur.ee/rannu-rahvamaja/kultuurikollektiivid/' }
]

export const rentalRooms = [
  {
    id: 'rannu-saal',
    houseId: 'rannu',
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
    houseId: 'rannu',
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
    houseId: 'konguta',
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
    houseId: 'konguta',
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
  .filter((room) => activeHouses.some((house) => house.id === room.houseId))
  .map((room) => ({
    ...room,
    house: activeHouses.find((house) => house.id === room.houseId).name
  }))

export const rentalServices = [
  {
    id: 'basic-sound',
    label: 'Helitehnika põhikomplekt',
    description: 'Kõlarid ja mikrofon kuni väikese sündmuse jaoks.',
    price: 20,
    pricing: 'fixed'
  },
  {
    id: 'projector',
    label: 'Projektor ja ekraan',
    description: 'Esitlus, film või koosolekumaterjalid.',
    price: 10,
    pricing: 'fixed'
  },
  {
    id: 'light-basic',
    label: 'Valgustuse põhiseadistus',
    description: 'Lihtne lava- või saalivalgus.',
    price: 25,
    pricing: 'fixed'
  },
  {
    id: 'tech-hour',
    label: 'Tehniku kohalolu',
    description: 'Tehniline tugi sündmuse ajal.',
    price: 20,
    pricing: 'hourly'
  },
  {
    id: 'coffee',
    label: 'Kohvilaua ettevalmistus',
    description: 'Kohv, tee ja lauanõud. Toitlustus eraldi kokkuleppel.',
    price: 15,
    pricing: 'fixed'
  }
]

export const roles = [
  {
    id: 'director',
    label: 'Juhataja',
    description: 'Lisab ja kinnitab sündmusi, kohendab avaliku kalendri tekste, haldab ruume ja broneeringuid.'
  },
  {
    id: 'admin',
    label: 'Administraator',
    description: 'Haldab avalikku infot, sündmusi, ringe, broneeringuid ja kommunikatsiooni.'
  },
  {
    id: 'collective',
    label: 'Kollektiivi juht',
    description: 'Lisab ja muudab oma kollektiivi infot, prooviaegu ja avalikke teateid kinnitamiseks.'
  },
  {
    id: 'tech',
    label: 'Juht / tehnik',
    description: 'Näeb ruumide hõivatust, tehnilisi vajadusi, inventari ja ettevalmistuse ülesandeid.'
  }
]

export const filters = [
  'Kõik',
  ...activeHouses.map((house) => house.name.replace(' rahvamaja', '')),
  'Peredele',
  'Noortele',
  'Eakatele',
  'Tasuta',
  'Registreerimisega'
]
