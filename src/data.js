export const initialEvents = [
  {
    id: 1,
    title: 'Kogukonna filmiõhtu',
    house: 'Rannu rahvamaja',
    date: '12. mai',
    weekday: 'teisipäev',
    time: '19.00',
    audience: 'Täiskasvanutele',
    category: 'Film',
    price: 'Tasuta',
    registration: false,
    public: true,
    status: 'published',
    room: 'Suur saal',
    tech: 'projektor, heli',
    owner: 'Rannu rahvamaja',
    description: 'Hubane filmiõhtu Rannu rahvamajas koos väikese kohvikunurgaga.'
  },
  {
    id: 2,
    title: 'Loovtöötuba peredele',
    house: 'Konguta rahvamaja',
    date: '16. mai',
    weekday: 'laupäev',
    time: '11.00',
    audience: 'Peredele',
    category: 'Töötuba',
    price: 'Tasuta',
    registration: true,
    public: true,
    status: 'published',
    room: 'Töötuba',
    tech: 'lauad, materjalid',
    owner: 'Konguta rahvamaja',
    description: 'Praktiline loovtöötuba lastele ja vanematele. Vajalik eelregistreerimine.'
  },
  {
    id: 3,
    title: 'Rahvatantsurühma avatud proov',
    house: 'Rannu rahvamaja',
    date: '20. mai',
    weekday: 'kolmapäev',
    time: '18.00',
    audience: 'Kõigile',
    category: 'Huviring',
    price: 'Tasuta',
    registration: false,
    public: true,
    status: 'published',
    room: 'Saal',
    tech: 'muusikakeskus',
    owner: 'Rahvatantsurühm',
    description: 'Tule vaata, kuidas rahvatantsurühm tegutseb, ja proovi soovi korral kaasa.'
  },
  {
    id: 4,
    title: 'Suveõhtu Annikoru välialal',
    house: 'Konguta rahvamaja',
    date: '7. juuni',
    weekday: 'pühapäev',
    time: '20.00',
    audience: 'Kõigile',
    category: 'Kontsert',
    price: 'Tasuta',
    registration: false,
    public: true,
    status: 'published',
    room: 'Väliala',
    tech: 'lava, valgus, heli',
    owner: 'Konguta rahvamaja',
    description: 'Kogukondlik suveõhtu muusika, piknikuala ja mõnusa koosolemisega.'
  },
  {
    id: 5,
    title: 'Eakate kohvihommik',
    house: 'Rannu rahvamaja',
    date: '10. juuni',
    weekday: 'kolmapäev',
    time: '11.00',
    audience: 'Eakatele',
    category: 'Kohtumine',
    price: 'Tasuta',
    registration: false,
    public: true,
    status: 'published',
    room: 'Väike saal',
    tech: 'kohvilaud',
    owner: 'Rannu rahvamaja',
    description: 'Rahulik hommikukohv, vestlusring ja info kohalike tegevuste kohta.'
  },
  {
    id: 6,
    title: 'Noorte ideelabor',
    house: 'Konguta rahvamaja',
    date: '14. juuni',
    weekday: 'pühapäev',
    time: '15.00',
    audience: 'Noortele',
    category: 'Noored',
    price: 'Tasuta',
    registration: true,
    public: true,
    status: 'published',
    room: 'Looveruum',
    tech: 'projektor, märkmepaberid',
    owner: 'Noorte algatusrühm',
    description: 'Ideede töötuba noortele, kes tahavad oma kogukonnas midagi ise algatada.'
  }
]

export const initialActivities = [
  { id: 1, title: 'Rahvatants', house: 'Rannu rahvamaja', audience: 'täiskasvanutele', time: 'Teisipäeviti 18.00', room: 'Saal', leader: 'Kollektiivi juht', contact: 'Küsi lisa', status: 'published' },
  { id: 2, title: 'Käsitöö- ja loovtöötuba', house: 'Konguta rahvamaja', audience: 'noortele ja täiskasvanutele', time: 'Kord kuus', room: 'Töötuba', leader: 'Töötoa juhendaja', contact: 'Liitu huviga', status: 'published' },
  { id: 3, title: 'Eakate kohtumised', house: 'Rannu rahvamaja', audience: 'eakatele', time: 'Kaks korda kuus', room: 'Väike saal', leader: 'Rahvamaja juht', contact: 'Vaata aega', status: 'published' },
  { id: 4, title: 'Perepäevad ja laste töötoad', house: 'Konguta rahvamaja', audience: 'peredele', time: 'Hooajaliselt', room: 'Saal / väliala', leader: 'Kogukonna juhendaja', contact: 'Küsi lisa', status: 'published' }
]

export const initialRequests = [
  { id: 101, type: 'Prooviaja muudatus', title: 'Rahvatantsu proov soovib liikuda kolmapäevale', submittedBy: 'Rahvatantsurühma juht', house: 'Rannu rahvamaja', target: 'Rahvatants', oldValue: 'Teisipäeviti 18.00', newValue: 'Kolmapäeviti 18.30', status: 'ootel' },
  { id: 102, type: 'Uus sündmus', title: 'Kogukonna pannkoogihommik', submittedBy: 'Konguta külaseltsi esindaja', house: 'Konguta rahvamaja', target: 'Avalik kalender', oldValue: '-', newValue: '22. juuni kell 10.00', status: 'ootel' }
]

export const rooms = [
  { house: 'Rannu rahvamaja', title: 'Saal sündmusteks ja koosviibimisteks', capacity: 'kuni 120 inimest', suitable: ['kontsert', 'pidu', 'koosolek', 'koolitus'], features: ['heli', 'projektor', 'lava', 'köögi kasutus kokkuleppel'] },
  { house: 'Konguta rahvamaja', title: 'Paindlik ruum töötubadeks ja kogukonnaüritusteks', capacity: 'kuni 80 inimest', suitable: ['töötuba', 'perepäev', 'koosolek', 'kogukonnaõhtu'], features: ['heli', 'projektor', 'väliala', 'laululava lähedus'] }
]

export const houses = [
  { name: 'Rannu rahvamaja', location: 'Rannu alevik', description: 'Piirkondlik kultuuri- ja kooskäimiskoht, kus toimuvad kontserdid, huviringid, kogukonnaõhtud ja kohtumised.', tags: ['kontserdid', 'rahvakultuur', 'koosolekud', 'eakate tegevused'] },
  { name: 'Konguta rahvamaja', location: 'Annikoru küla', description: 'Kogukondlik kultuuripesa, mis sobib töötubadeks, perepäevadeks, noorte algatusteks ja väliala sündmusteks.', tags: ['töötoad', 'pered', 'noored', 'väliala'] }
]

export const roles = [
  { id: 'director', label: 'Rahvamaja juht', description: 'Lisab ja kinnitab sündmusi, muudab maja infot, haldab ruume ja kollektiive.' },
  { id: 'admin', label: 'Administraator / kunstiline juht', description: 'Haldab avalikku infot, sündmusi, ringe, broneeringuid ja kommunikatsiooni.' },
  { id: 'collective', label: 'Kollektiivi juht', description: 'Muudab oma kollektiivi infot, prooviaegu ja avalikke teateid kinnitamiseks.' },
  { id: 'tech', label: 'Juht / tehnik', description: 'Näeb ruumide hõivatust, tehnilisi vajadusi, inventari ja ettevalmistuse ülesandeid.' }
]

export const filters = ['Kõik', 'Rannu', 'Konguta', 'Peredele', 'Noortele', 'Eakatele', 'Tasuta', 'Registreerimisega']
