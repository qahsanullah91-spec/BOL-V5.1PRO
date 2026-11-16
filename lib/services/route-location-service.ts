import {
  LocationRecord,
  LocationType,
  RouteMaster,
  RouteLeg,
  RouteSnapshot,
  LocationSnapshot,
  TransportMode,
  LocationQualityAudit,
} from '@/lib/types/route-locations'

// ============================================================================
// CANONICAL SEED LOCATIONS (AFGHANISTAN CORRIDORS & TRANSIT GATEWAYS)
// ============================================================================

export const SEED_LOCATIONS: LocationRecord[] = [
  // --- MAJOR SEAPORTS ---
  {
    id: 'loc-port-bnd',
    code: 'IRBND',
    name: 'Bandar Abbas',
    nativeName: 'بندر عباس',
    unlocode: 'IRBND',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IR',
    countryName: 'Iran',
    provinceState: 'Hormozgan',
    timezone: 'Asia/Tehran',
    isHub: true,
    aliases: ['BandarAbbas', 'Bandar-e-Abbas', 'BND', 'Shahid Rajaee', 'Shahid Rajaee Port', 'Bandar Abbas Port'],
    coordinates: { lat: 27.1832, lng: 56.2666 },
    seaportInfo: {
      unlocode: 'IRBND',
      customsLocationCode: 'IRBND1',
      terminals: [
        { terminalName: 'Shahid Rajaee Terminal 1', code: 'SRT-1', containerHandling: true, draftMeters: 14.5 },
        { terminalName: 'Shahid Rajaee Terminal 2', code: 'SRT-2', containerHandling: true, draftMeters: 17.0 },
      ],
      seaCorridorNotes: 'Primary oceanic transit hub for Afghanistan commercial cargo and containers.',
    },
    notes: 'Main transit entry gateway for containerized imports into Western and Central Afghanistan.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-jea',
    code: 'AEJEA',
    name: 'Jebel Ali',
    nativeName: 'ميناء جبل علي',
    unlocode: 'AEJEA',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    provinceState: 'Dubai',
    timezone: 'Asia/Dubai',
    isHub: true,
    aliases: ['JebelAli', 'Dubai Port', 'DP World Jebel Ali', 'Jebel Ali Port', 'DXB Port', 'JEA'],
    coordinates: { lat: 24.9857, lng: 55.0273 },
    seaportInfo: {
      unlocode: 'AEJEA',
      terminals: [
        { terminalName: 'DP World Terminal 1', code: 'DPW-T1', containerHandling: true, draftMeters: 16.0 },
        { terminalName: 'DP World Terminal 2', code: 'DPW-T2', containerHandling: true, draftMeters: 17.0 },
        { terminalName: 'DP World Terminal 3', code: 'DPW-T3', containerHandling: true, draftMeters: 18.0 },
      ],
      seaCorridorNotes: 'Major transshipment hub connecting Far East, Europe, and Indian Subcontinent to the Persian Gulf.',
    },
    notes: 'Primary regional feeder hub for cargo moving onward to Bandar Abbas, Karachi, and Central Asia.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-nsa',
    code: 'INNSA',
    name: 'Nhava Sheva (JNPT)',
    nativeName: 'نوا شوا / नहावा शेवा',
    unlocode: 'INNSA',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IN',
    countryName: 'India',
    provinceState: 'Maharashtra',
    timezone: 'Asia/Kolkata',
    isHub: true,
    aliases: [
      'Nhava Sheva',
      'Nhava Sheva, IN',
      'Nhava Sheva, India',
      'JNPT',
      'Jawaharlal Nehru Port',
      'Nava Sheva',
      'Nhava Sheva Port',
      'Mumbai JNPT',
      'Navi Mumbai',
      'NSA',
      'نوا شوا',
      'نهاوا شوا',
      'ناوا شوا',
      'ناوا شیوا',
      'بندر نوا شوا',
      'بندر نهاوا شوا',
      'نوا شوا، هند',
    ],
    coordinates: { lat: 18.9499, lng: 72.9515 },
    seaportInfo: {
      unlocode: 'INNSA',
      terminals: [
        { terminalName: 'JNPCT (JN Port Container Terminal)', code: 'JNPCT', containerHandling: true, draftMeters: 14.0 },
        { terminalName: 'NSICT (DP World Nhava Sheva)', code: 'NSICT', containerHandling: true, draftMeters: 14.5 },
        { terminalName: 'NSIGT (Nhava Sheva International Gateway Terminal)', code: 'NSIGT', containerHandling: true, draftMeters: 14.5 },
        { terminalName: 'GTI (Gateway Terminals India / APM)', code: 'GTI', containerHandling: true, draftMeters: 14.5 },
        { terminalName: 'BMCT (Bharat Mumbai Container Terminals / PSA)', code: 'BMCT', containerHandling: true, draftMeters: 16.5 },
      ],
      seaCorridorNotes: 'Top origin port for tea, spices, textiles, and dry goods routed to Afghanistan via Bandar Abbas.',
    },
    notes: 'High-volume export hub for Afghanistan-bound cargo from Western and Northern India.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-mun',
    code: 'INMUN',
    name: 'Mundra Port',
    nativeName: 'موندرا / मुंद्रा',
    unlocode: 'INMUN',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IN',
    countryName: 'India',
    provinceState: 'Gujarat',
    timezone: 'Asia/Kolkata',
    isHub: true,
    aliases: [
      'Mundra',
      'Mundra, IN',
      'Mundra, India',
      'Mundra Port',
      'Adani Mundra',
      'MUN',
      'موندرا',
      'بندر موندرا',
      'موندرا، هند',
    ],
    coordinates: { lat: 22.7388, lng: 69.7042 },
    seaportInfo: {
      unlocode: 'INMUN',
      terminals: [
        { terminalName: 'Adani International Container Terminal (AICTPL)', code: 'AICTPL', containerHandling: true, draftMeters: 17.5 },
        { terminalName: 'Adani CMA Mundra Terminal (ACMTPL)', code: 'ACMTPL', containerHandling: true, draftMeters: 17.5 },
        { terminalName: 'Mundra International Container Terminal (MICT)', code: 'MICT', containerHandling: true, draftMeters: 16.5 },
      ],
      seaCorridorNotes: 'Frequent origin for machinery, agricultural products, and raw chemicals.',
    },
    notes: 'Adani flagship port offering deep draft for large container vessels.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-bom',
    code: 'INBOM',
    name: 'Mumbai Port (MbPT)',
    nativeName: 'بندر بمبئی / मुंबई पोर्ट',
    unlocode: 'INBOM',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IN',
    countryName: 'India',
    provinceState: 'Maharashtra',
    timezone: 'Asia/Kolkata',
    isHub: true,
    aliases: ['Mumbai Port', 'Bombay Port', 'MbPT', 'Mumbai', 'BOM', 'بمبئی', 'بندر بمبئی'],
    coordinates: { lat: 18.9438, lng: 72.8426 },
    seaportInfo: {
      unlocode: 'INBOM',
      terminals: [
        { terminalName: 'Indira Dock', code: 'ID', containerHandling: true, draftMeters: 11.5 },
        { terminalName: 'Victoria Dock', code: 'VD', containerHandling: false, draftMeters: 9.5 },
      ],
      seaCorridorNotes: 'Historic natural deep-water port on India West Coast handling general cargo and break-bulk.',
    },
    notes: 'Major port of India for break-bulk, project cargo, and petroleum products.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-ixy',
    code: 'INIXY',
    name: 'Kandla Port (Deendayal)',
    nativeName: 'بندر کاندلا / कांडला',
    unlocode: 'INIXY',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IN',
    countryName: 'India',
    provinceState: 'Gujarat',
    timezone: 'Asia/Kolkata',
    isHub: true,
    aliases: ['Kandla', 'Deendayal Port', 'DPA', 'IXY', 'کاندلا', 'بندر کاندلا'],
    coordinates: { lat: 23.0033, lng: 70.2185 },
    seaportInfo: {
      unlocode: 'INIXY',
      terminals: [
        { terminalName: 'Kandla Container Terminal', code: 'KCT', containerHandling: true, draftMeters: 13.0 },
      ],
      seaCorridorNotes: 'Premier bulk and container port in Gulf of Kutch serving Northern India.',
    },
    notes: 'Major Port of India with highest cargo throughput for dry and liquid bulk.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-maa',
    code: 'INMAA',
    name: 'Chennai Port',
    nativeName: 'بندر چنای / चेन्नई पोर्ट',
    unlocode: 'INMAA',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IN',
    countryName: 'India',
    provinceState: 'Tamil Nadu',
    timezone: 'Asia/Kolkata',
    isHub: true,
    aliases: ['Chennai', 'Madras Port', 'CCTPL', 'CITPL', 'MAA', 'چنای', 'بندر چنای'],
    coordinates: { lat: 13.0827, lng: 80.2707 },
    seaportInfo: {
      unlocode: 'INMAA',
      terminals: [
        { terminalName: 'Chennai Container Terminal (DP World CCT)', code: 'CCT', containerHandling: true, draftMeters: 14.5 },
        { terminalName: 'Chennai International Terminals (PSA CITPL)', code: 'CITPL', containerHandling: true, draftMeters: 15.5 },
      ],
      seaCorridorNotes: 'Primary gateway port on the Coromandel Coast of Southeast India.',
    },
    notes: 'Second largest container port in India, key manufacturing and automotive hub.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-cok',
    code: 'INCOK',
    name: 'Cochin Port (Vallarpadam)',
    nativeName: 'بندر کوچین / कोचीन पोर्ट',
    unlocode: 'INCOK',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IN',
    countryName: 'India',
    provinceState: 'Kerala',
    timezone: 'Asia/Kolkata',
    isHub: true,
    aliases: ['Cochin', 'Kochi', 'Vallarpadam', 'ICTT', 'COK', 'کوچین', 'بندر کوچین'],
    coordinates: { lat: 9.9656, lng: 76.2706 },
    seaportInfo: {
      unlocode: 'INCOK',
      terminals: [
        { terminalName: 'International Container Transshipment Terminal (ICTT DP World)', code: 'ICTT', containerHandling: true, draftMeters: 14.5 },
      ],
      seaCorridorNotes: 'Strategic deep-water transshipment gateway closest to international east-west sea routes.',
    },
    notes: 'Major transshipment hub on South India west coast.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-vtz',
    code: 'INVTZ',
    name: 'Visakhapatnam Port (Vizag)',
    nativeName: 'بندر ویزاگ / विशाखापत्तनम',
    unlocode: 'INVTZ',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IN',
    countryName: 'India',
    provinceState: 'Andhra Pradesh',
    timezone: 'Asia/Kolkata',
    isHub: true,
    aliases: ['Visakhapatnam', 'Vizag Port', 'VCTPL', 'VTZ', 'ویزاگ', 'بندر ویزاگ'],
    coordinates: { lat: 17.6868, lng: 83.2185 },
    seaportInfo: {
      unlocode: 'INVTZ',
      terminals: [
        { terminalName: 'Visakha Container Terminal (VCTPL)', code: 'VCTPL', containerHandling: true, draftMeters: 16.5 },
      ],
      seaCorridorNotes: 'Major east-coast natural harbour serving central and eastern India hinterland.',
    },
    notes: 'Deepest major port on India east coast for heavy minerals, steel, and containers.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-ccu',
    code: 'INCCU',
    name: 'Kolkata Port (SMPK)',
    nativeName: 'بندر کلکته / कोलकाता पोर्ट',
    unlocode: 'INCCU',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IN',
    countryName: 'India',
    provinceState: 'West Bengal',
    timezone: 'Asia/Kolkata',
    isHub: true,
    aliases: ['Kolkata', 'Calcutta', 'SMPK', 'Syama Prasad Mookerjee Port', 'CCU', 'کلکته', 'بندر کلکته'],
    coordinates: { lat: 22.5448, lng: 88.3227 },
    seaportInfo: {
      unlocode: 'INCCU',
      terminals: [
        { terminalName: 'Netaji Subhas Dock (NSD)', code: 'NSD', containerHandling: true, draftMeters: 8.5 },
        { terminalName: 'Kidderpore Dock (KPD)', code: 'KPD', containerHandling: false, draftMeters: 7.5 },
      ],
      seaCorridorNotes: 'Only riverine major port in India, gateway to Nepal, Bhutan, and eastern trade.',
    },
    notes: 'Historic gateway on Hooghly river serving North-East India, Nepal, and Bhutan.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-hal',
    code: 'INHAL',
    name: 'Haldia Dock Complex',
    nativeName: 'بندر هالدیا / हल्दिया',
    unlocode: 'INHAL',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IN',
    countryName: 'India',
    provinceState: 'West Bengal',
    timezone: 'Asia/Kolkata',
    isHub: true,
    aliases: ['Haldia', 'Haldia Port', 'HDC', 'HAL', 'هالدیا', 'بندر هالدیا'],
    coordinates: { lat: 22.0227, lng: 88.0617 },
    seaportInfo: {
      unlocode: 'INHAL',
      terminals: [
        { terminalName: 'Haldia Container Berth', code: 'HCB', containerHandling: true, draftMeters: 10.5 },
      ],
      seaCorridorNotes: 'Deep-water riverine dock complex of Kolkata Port for heavy bulk and containerized trade.',
    },
    notes: 'Crucial seaport hub for East India and landlocked Himalayan transit corridors.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-khi',
    code: 'PKKHI',
    name: 'Karachi Port',
    nativeName: 'کراچی بندرگاہ',
    unlocode: 'PKKHI',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'PK',
    countryName: 'Pakistan',
    provinceState: 'Sindh',
    timezone: 'Asia/Karachi',
    isHub: true,
    aliases: ['Karachi', 'Port of Karachi', 'KPT', 'SAPT', 'Karachi Seaport', 'KHI'],
    coordinates: { lat: 24.8465, lng: 66.9748 },
    seaportInfo: {
      unlocode: 'PKKHI',
      terminals: [
        { terminalName: 'Karachi International Container Terminal (KICT)', code: 'KICT', containerHandling: true, draftMeters: 13.5 },
        { terminalName: 'South Asia Pakistan Terminals (SAPT)', code: 'SAPT', containerHandling: true, draftMeters: 16.0 },
      ],
      seaCorridorNotes: 'Traditional transit gateway for Afghanistan Transit Trade (ATT / APTTA).',
    },
    notes: 'Direct land route access to Chaman/Spin Boldak and Torkham border stations.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-mer',
    code: 'TRMER',
    name: 'Mersin',
    nativeName: 'Mersin Limanı',
    unlocode: 'TRMER',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'TR',
    countryName: 'Turkey',
    provinceState: 'Mersin',
    timezone: 'Europe/Istanbul',
    isHub: true,
    aliases: ['Mersin Port', 'MIP', 'Port of Mersin'],
    coordinates: { lat: 36.795, lng: 34.64 },
    seaportInfo: {
      unlocode: 'TRMER',
      terminals: [
        { terminalName: 'Mersin International Port', code: 'MIP-1', containerHandling: true, draftMeters: 15.0 },
      ],
      seaCorridorNotes: 'Mediterranean gateway for European, Levantine, and North African cargo heading overland to Central Asia.',
    },
    notes: 'Key transit port on the Turkey-Iran-Afghanistan TIR road and rail corridor.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-sha',
    code: 'CNSHA',
    name: 'Shanghai',
    nativeName: '上海港',
    unlocode: 'CNSHA',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'CN',
    countryName: 'China',
    provinceState: 'Shanghai',
    timezone: 'Asia/Shanghai',
    isHub: true,
    aliases: ['Shanghai Port', 'Yangshan', 'Waigaoqiao', 'SHA Port'],
    coordinates: { lat: 31.2304, lng: 121.4737 },
    seaportInfo: {
      unlocode: 'CNSHA',
      terminals: [
        { terminalName: 'Yangshan Deepwater Terminal', code: 'YS-T4', containerHandling: true, draftMeters: 17.5 },
      ],
    },
    notes: 'Major origin for Chinese electronics, fabrics, and consumer goods bound for Afghanistan via Bandar Abbas.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-qdg',
    code: 'CNQDG',
    name: 'Qingdao',
    nativeName: '青岛港',
    unlocode: 'CNQDG',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'CN',
    countryName: 'China',
    provinceState: 'Shandong',
    timezone: 'Asia/Shanghai',
    isHub: false,
    aliases: ['Qingdao Port', 'QDG'],
    coordinates: { lat: 36.0671, lng: 120.3826 },
    seaportInfo: {
      unlocode: 'CNQDG',
      terminals: [
        { terminalName: 'Qingdao Qianwan Container Terminal', code: 'QQCT', containerHandling: true, draftMeters: 17.0 },
      ],
    },
    notes: 'Common origin for Chinese tires, construction materials, and solar equipment.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // --- OMAN SEAPORTS ---
  {
    id: 'loc-port-omsoh',
    code: 'OMSOH',
    name: 'Sohar Port',
    nativeName: 'بندر صحار – عمان',
    unlocode: 'OMSOH',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'OM',
    countryName: 'Oman',
    provinceState: 'Al Batinah North',
    timezone: 'Asia/Muscat',
    isHub: true,
    aliases: ['Sohar', 'Sohar Port & Freezone', 'Sohar Port – Oman', 'Sohar Port - Oman', 'SOH', 'OMSOH', 'بندر صحار', 'بندر صحار – عمان', 'بندر صحار - عمان'],
    coordinates: { lat: 24.4961, lng: 56.6317 },
    seaportInfo: { unlocode: 'OMSOH', terminals: [{ terminalName: 'Oman International Container Terminal (OICT)', code: 'OICT', containerHandling: true, draftMeters: 18.0 }] },
    notes: 'Premier deep-sea container and industrial port in northern Oman.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-omsll',
    code: 'OMSLL',
    name: 'Port of Salalah',
    nativeName: 'بندر صلاله',
    unlocode: 'OMSLL',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'OM',
    countryName: 'Oman',
    provinceState: 'Dhofar',
    timezone: 'Asia/Muscat',
    isHub: true,
    aliases: ['Salalah', 'Salalah Port', 'SLL', 'OMSLL'],
    coordinates: { lat: 16.9531, lng: 54.0044 },
    seaportInfo: { unlocode: 'OMSLL', terminals: [{ terminalName: 'Salalah Container Terminal', code: 'SCT', containerHandling: true, draftMeters: 18.0 }] },
    notes: 'Major Arabian Sea container transshipment hub.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-ommct',
    code: 'OMMCT',
    name: 'Port Sultan Qaboos (Muscat)',
    nativeName: 'بندر سلطان قابوس (مسقط)',
    unlocode: 'OMMCT',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'OM',
    countryName: 'Oman',
    provinceState: 'Muscat',
    timezone: 'Asia/Muscat',
    isHub: true,
    aliases: ['Muscat Port', 'Sultan Qaboos', 'Muttrah', 'MCT', 'OMMCT'],
    coordinates: { lat: 23.6267, lng: 58.5675 },
    seaportInfo: { unlocode: 'OMMCT', terminals: [{ terminalName: 'Port Sultan Qaboos Commercial Pier', code: 'PSQ', containerHandling: true, draftMeters: 13.0 }] },
    notes: 'Historic Muscat harbor and commercial port.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-omdqm',
    code: 'OMDQM',
    name: 'Port of Duqm',
    nativeName: 'بندر دقم',
    unlocode: 'OMDQM',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'OM',
    countryName: 'Oman',
    provinceState: 'Al Wusta',
    timezone: 'Asia/Muscat',
    isHub: true,
    aliases: ['Duqm', 'Duqm Port', 'SEZAD', 'DQM', 'OMDQM'],
    coordinates: { lat: 19.6714, lng: 57.7031 },
    seaportInfo: { unlocode: 'OMDQM', terminals: [{ terminalName: 'Duqm Commercial Terminal', code: 'DCT', containerHandling: true, draftMeters: 18.0 }] },
    notes: 'Deepwater special economic zone seaport on the Arabian Sea.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-omswq',
    code: 'OMSWQ',
    name: 'Port of Suwaiq',
    nativeName: 'بندر السویق – عمان',
    unlocode: 'OMSWQ',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'OM',
    countryName: 'Oman',
    provinceState: 'Al Batinah North',
    timezone: 'Asia/Muscat',
    isHub: false,
    aliases: ['Suwaiq', 'Suwaiq Port', 'Suwaiq Port – Oman', 'Suwaiq Port - Oman', 'Al Suwaiq', 'SWQ', 'OMSWQ', 'بندر السویق', 'بندر السويق', 'بندر السویق – عمان', 'بندر السویق - عمان', 'السویق'],
    coordinates: { lat: 23.8492, lng: 57.4386 },
    seaportInfo: { unlocode: 'OMSWQ', terminals: [{ terminalName: 'Suwaiq Commercial Terminal', code: 'SWQ-1', containerHandling: true, draftMeters: 10.5 }] },
    notes: 'Regional Gulf trade and general cargo port in Al Batinah.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-omkhs',
    code: 'OMKHS',
    name: 'Port of Khasab',
    nativeName: 'بندر خصب',
    unlocode: 'OMKHS',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'OM',
    countryName: 'Oman',
    provinceState: 'Musandam',
    timezone: 'Asia/Muscat',
    isHub: false,
    aliases: ['Khasab', 'Khasab Port', 'KHS', 'OMKHS'],
    coordinates: { lat: 26.2089, lng: 56.2456 },
    seaportInfo: { unlocode: 'OMKHS', terminals: [{ terminalName: 'Khasab Commercial Terminal', code: 'KHS-1', containerHandling: true, draftMeters: 10.0 }] },
    notes: 'Strait of Hormuz commercial and dhow transit port in Musandam.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-omshn',
    code: 'OMSHN',
    name: 'Port of Shinas',
    nativeName: 'بندر شناص',
    unlocode: 'OMSHN',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'OM',
    countryName: 'Oman',
    provinceState: 'Al Batinah North',
    timezone: 'Asia/Muscat',
    isHub: false,
    aliases: ['Shinas', 'Shinas Port', 'SHN', 'OMSHN'],
    coordinates: { lat: 24.7428, lng: 56.4686 },
    seaportInfo: { unlocode: 'OMSHN', terminals: [{ terminalName: 'Shinas Commercial Berth', code: 'SHN-1', containerHandling: false, draftMeters: 8.0 }] },
    notes: 'Northern Oman commercial, livestock, and general cargo harbor.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // --- ADDITIONAL IRAN SEAPORTS ---
  {
    id: 'loc-port-irjsk',
    code: 'IRJSK',
    name: 'Jask Port (Bandar Jask)',
    nativeName: 'جاسک – ایران',
    unlocode: 'IRJSK',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IR',
    countryName: 'Iran',
    provinceState: 'Hormozgan',
    timezone: 'Asia/Tehran',
    isHub: false,
    aliases: ['Jask', 'Jask Port', 'Bandar Jask', 'Bandar Jask Port', 'JSK', 'IRJSK', 'جاسک', 'بندر جاسک', 'جاسک – ایران', 'جاسک - ایران', 'Jask Port – IRAN', 'Jask Port - IRAN', 'Jask Port - Iran', 'Jask Port, IR'],
    coordinates: { lat: 25.6439, lng: 57.7744 },
    seaportInfo: { 
      unlocode: 'IRJSK', 
      customsLocationCode: 'IRJSK1',
      terminals: [
        { terminalName: 'Jask Commercial Jetty', code: 'JSK-1', containerHandling: true, draftMeters: 14.0 },
        { terminalName: 'Makran Crude Terminal', code: 'JSK-2', containerHandling: false, draftMeters: 18.0 },
        { terminalName: 'Customs Bonded Zone', code: 'JSK-BND', containerHandling: true, draftMeters: 12.0 }
      ] 
    },
    notes: 'Strategic Gulf of Oman commercial seaport and coastal export hub in Hormozgan.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-irzbr',
    code: 'IRZBR',
    name: 'Chabahar Port',
    nativeName: 'بندر چابهار (شهید بهشتی)',
    unlocode: 'IRZBR',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IR',
    countryName: 'Iran',
    provinceState: 'Sistan and Baluchestan',
    timezone: 'Asia/Tehran',
    isHub: true,
    aliases: ['Chabahar', 'Shahid Beheshti Port', 'Shahid Kalantari', 'CHA', 'IRZBR'],
    coordinates: { lat: 25.2969, lng: 60.6122 },
    seaportInfo: { 
      unlocode: 'IRZBR', 
      customsLocationCode: 'IRZBR1',
      terminals: [
        { terminalName: 'Shahid Beheshti Container Terminal', code: 'SBC', containerHandling: true, draftMeters: 16.0 },
        { terminalName: 'IPGL Terminal (Adani/JNPA)', code: 'IPGL', containerHandling: true, draftMeters: 16.5 },
        { terminalName: 'Grain Silo Berth', code: 'GSB', containerHandling: false, draftMeters: 14.0 }
      ] 
    },
    notes: 'Oceanic transit port serving southern Afghanistan (Nimroz / Zaranj corridor) and India.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-irbkm',
    code: 'IRBKM',
    name: 'Bandar Imam Khomeini (BIK)',
    nativeName: 'بندر امام خمینی',
    unlocode: 'IRBKM',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IR',
    countryName: 'Iran',
    provinceState: 'Khuzestan',
    timezone: 'Asia/Tehran',
    isHub: true,
    aliases: ['BIK', 'Bandar Khomeini', 'IRBKM'],
    coordinates: { lat: 30.4314, lng: 49.0764 },
    seaportInfo: { unlocode: 'IRBKM', terminals: [{ terminalName: 'BIK Container Terminal', code: 'BIK-CT', containerHandling: true, draftMeters: 14.5 }] },
    notes: 'Major northwestern Persian Gulf bulk, grain, and container gateway.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-irbuz',
    code: 'IRBUZ',
    name: 'Bushehr Port',
    nativeName: 'بندر بوشهر',
    unlocode: 'IRBUZ',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IR',
    countryName: 'Iran',
    provinceState: 'Bushehr',
    timezone: 'Asia/Tehran',
    isHub: false,
    aliases: ['Bushehr', 'BSH', 'IRBUZ'],
    coordinates: { lat: 28.9833, lng: 50.8333 },
    seaportInfo: { unlocode: 'IRBUZ', terminals: [{ terminalName: 'Bushehr Commercial Port', code: 'BUZ-1', containerHandling: true, draftMeters: 11.5 }] },
    notes: 'Central Persian Gulf commercial port.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-irkho',
    code: 'IRKHO',
    name: 'Khorramshahr Port',
    nativeName: 'بندر خرمشهر',
    unlocode: 'IRKHO',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IR',
    countryName: 'Iran',
    provinceState: 'Khuzestan',
    timezone: 'Asia/Tehran',
    isHub: false,
    aliases: ['Khorramshahr', 'KHR', 'IRKHO'],
    coordinates: { lat: 30.4333, lng: 48.1833 },
    seaportInfo: { unlocode: 'IRKHO', terminals: [{ terminalName: 'Khorramshahr Container Pier', code: 'KHO-1', containerHandling: true, draftMeters: 9.0 }] },
    notes: 'Arvand Free Zone river/sea commercial port.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-irbaz',
    code: 'IRBAZ',
    name: 'Bandar Anzali Port',
    nativeName: 'بندر انزلی',
    unlocode: 'IRBAZ',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IR',
    countryName: 'Iran',
    provinceState: 'Gilan',
    timezone: 'Asia/Tehran',
    isHub: true,
    aliases: ['Anzali', 'Bandar Anzali', 'Caspian Port', 'ANZ', 'IRBAZ'],
    coordinates: { lat: 37.4728, lng: 49.4622 },
    seaportInfo: { unlocode: 'IRBAZ', terminals: [{ terminalName: 'Anzali Caspian Sea Terminal', code: 'ANZ-1', containerHandling: true, draftMeters: 8.5 }] },
    notes: 'Largest Caspian Sea port connecting Iran to CIS and Northern Corridors.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-port-iramr',
    code: 'IRAMR',
    name: 'Amirabad Port',
    nativeName: 'بندر امیرآباد',
    unlocode: 'IRAMR',
    type: 'SEAPORT',
    status: 'ACTIVE',
    countryCode: 'IR',
    countryName: 'Iran',
    provinceState: 'Mazandaran',
    timezone: 'Asia/Tehran',
    isHub: false,
    aliases: ['Amirabad', 'Behshahr', 'AMR', 'IRAMR'],
    coordinates: { lat: 36.8519, lng: 53.3686 },
    seaportInfo: { unlocode: 'IRAMR', terminals: [{ terminalName: 'Amirabad SEZ Rail-Sea Terminal', code: 'AMR-1', containerHandling: true, draftMeters: 8.0 }] },
    notes: 'Rail-connected Caspian Sea special economic zone port.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },

  // --- TWO-SIDED BORDER CROSSINGS ---
  {
    id: 'loc-border-isl-dog',
    code: 'BC-ISL-DOG',
    name: 'Islam Qala / Dogharoon Border',
    nativeName: 'اسلام قلعه / دوغارون',
    type: 'BORDER',
    status: 'ACTIVE',
    countryCode: 'AF',
    countryName: 'Afghanistan',
    provinceState: 'Herat / Khorasan Razavi',
    timezone: 'Asia/Kabul',
    isHub: true,
    aliases: ['Islam Qala', 'IslamQala', 'Islam Qaleh', 'Dogharoon', 'Dogharun', 'Eslam Qal\'eh', 'Herat Border', 'Taibad Border'],
    coordinates: { lat: 34.6683, lng: 61.0664 },
    borderInfo: {
      sideACountry: 'AF',
      sideAName: 'Islam Qala (Herat)',
      sideBCountry: 'IR',
      sideBName: 'Dogharoon (Taybad, Razavi Khorasan)',
      clearanceTypes: ['COMMERCIAL', 'TRANSIT', 'PASSENGER'],
      operatingHours: '07:00 - 18:00 (Customs Gates)',
      bottleneckNotes: 'Heavy transit fuel truck lines and container transloading queues during seasonal peaks.',
      roadConditions: 'Paved highway directly connecting to Herat City (120 km).',
    },
    notes: 'Primary commercial artery between Iran (Bandar Abbas / Mashhad) and Western/Northern Afghanistan.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-border-tor-ser',
    code: 'BC-TOR-SER',
    name: 'Torghundi / Serhetabat Border',
    nativeName: 'تورغندی / سرحدآباد',
    type: 'BORDER',
    status: 'ACTIVE',
    countryCode: 'AF',
    countryName: 'Afghanistan',
    provinceState: 'Herat / Mary Province',
    timezone: 'Asia/Kabul',
    isHub: true,
    aliases: ['Torghundi', 'Torghondi', 'Towraghondi', 'Serhetabat', 'Kushka', 'Turkmenistan Border Herat'],
    coordinates: { lat: 35.2536, lng: 62.2964 },
    borderInfo: {
      sideACountry: 'AF',
      sideAName: 'Torghundi Dry Port & Station',
      sideBCountry: 'TM',
      sideBName: 'Serhetabat Railway Hub',
      clearanceTypes: ['COMMERCIAL', 'TRANSIT'],
      operatingHours: '08:00 - 17:00',
      bottleneckNotes: 'Rail gauge transshipment (Russian 1520mm gauge terminal to trucks) requires crane scheduling.',
      roadConditions: 'Paved access to Herat Ring Road via Rabata-e-Sangi.',
    },
    notes: 'Lapis Lazuli corridor northern railhead gateway connecting Turkmenistan, Azerbaijan, and Turkey.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-border-hai-ter',
    code: 'BC-HAI-TER',
    name: 'Hairatan / Termez Border',
    nativeName: 'حیرتان / ترمذ',
    type: 'BORDER',
    status: 'ACTIVE',
    countryCode: 'AF',
    countryName: 'Afghanistan',
    provinceState: 'Balkh / Surxondaryo',
    timezone: 'Asia/Kabul',
    isHub: true,
    aliases: ['Hairatan', 'Hayratan', 'Termez', 'Friendship Bridge', 'Hairatan Rail Border', 'Balkh Border'],
    coordinates: { lat: 37.2178, lng: 67.4194 },
    borderInfo: {
      sideACountry: 'AF',
      sideAName: 'Hairatan Port & Rail Yard',
      sideBCountry: 'UZ',
      sideBName: 'Termez Cargo Center',
      clearanceTypes: ['COMMERCIAL', 'TRANSIT', 'PASSENGER'],
      operatingHours: '24 Hours (Rail) / 08:00 - 18:00 (Road)',
      bottleneckNotes: 'Friendship bridge rail inspection protocols; Uzbekistan railway authority wagon releases.',
      roadConditions: 'Excellent paved dual carriageway directly to Mazar-i-Sharif (75 km).',
    },
    notes: 'Major rail/river gateway for grain, fuel, and Russian/Central Asian goods into Afghanistan.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-border-spi-cha',
    code: 'BC-SPI-CHA',
    name: 'Spin Boldak / Chaman Border',
    nativeName: 'سپین بولدک / چمن',
    type: 'BORDER',
    status: 'ACTIVE',
    countryCode: 'AF',
    countryName: 'Afghanistan',
    provinceState: 'Kandahar / Balochistan',
    timezone: 'Asia/Kabul',
    isHub: true,
    aliases: ['Spin Boldak', 'Spinboldak', 'Chaman', 'Chaman Border', 'Kandahar Border', 'Friendship Gate Chaman'],
    coordinates: { lat: 31.0089, lng: 66.4419 },
    borderInfo: {
      sideACountry: 'AF',
      sideAName: 'Spin Boldak Customs Gate',
      sideBCountry: 'PK',
      sideBName: 'Chaman Customs Post',
      clearanceTypes: ['COMMERCIAL', 'TRANSIT', 'PASSENGER'],
      operatingHours: '07:00 - 19:00',
      bottleneckNotes: 'Frequent bilateral strikes, driver biometric verification delays, and cross-border tension.',
      roadConditions: 'Direct highway to Kandahar City (105 km).',
    },
    notes: 'Southern commercial corridor connecting Karachi Seaport and Quetta with Kandahar and Kabul.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-border-zar-mil',
    code: 'BC-ZAR-MIL',
    name: 'Zaranj / Milak Border',
    nativeName: 'زرنج / میلک',
    type: 'BORDER',
    status: 'ACTIVE',
    countryCode: 'AF',
    countryName: 'Afghanistan',
    provinceState: 'Nimroz / Sistan and Baluchestan',
    timezone: 'Asia/Kabul',
    isHub: true,
    aliases: ['Zaranj', 'Milak', 'Nimroz Border', 'Zaranj Border', 'Chabahar Route Border'],
    coordinates: { lat: 30.9634, lng: 61.8601 },
    borderInfo: {
      sideACountry: 'AF',
      sideAName: 'Zaranj Customs Depot',
      sideBCountry: 'IR',
      sideBName: 'Milak Border Terminal (Zabol)',
      clearanceTypes: ['COMMERCIAL', 'TRANSIT'],
      operatingHours: '07:30 - 17:30',
      bottleneckNotes: 'Single bridge transit capacity over the Helmand River / Parian diversion canal.',
      roadConditions: 'Delaram-Zaranj Highway (Route 606) connects directly to Garland Ring Road.',
    },
    notes: 'Designated transit crossing for cargo arriving from Chabahar Port (Iran) into Southwestern Afghanistan.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-border-she-pan',
    code: 'BC-SHE-PAN',
    name: 'Sher Khan Bandar / Panji Poyon Border',
    nativeName: 'شیرخان بندر / پنج پایان',
    type: 'BORDER',
    status: 'ACTIVE',
    countryCode: 'AF',
    countryName: 'Afghanistan',
    provinceState: 'Kunduz / Khatlon',
    timezone: 'Asia/Kabul',
    isHub: false,
    aliases: ['Sher Khan Bandar', 'Sherkhan', 'Nizhny Panj', 'Panji Poyon', 'Kunduz Border', 'Tajikistan Border'],
    coordinates: { lat: 37.1953, lng: 68.6186 },
    borderInfo: {
      sideACountry: 'AF',
      sideAName: 'Sher Khan Bandar Customs Terminal',
      sideBCountry: 'TJ',
      sideBName: 'Panji Poyon Customs Checkpoint',
      clearanceTypes: ['COMMERCIAL', 'TRANSIT'],
      operatingHours: '08:00 - 16:30',
      bottleneckNotes: 'Bridge weight restrictions over Panj River bridge; periodic border closures.',
      roadConditions: 'Highway connecting to Kunduz City and onward to Kabul via Salang Pass.',
    },
    notes: 'Northern gateway connecting Afghanistan with Tajikistan and western China overland routes.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-border-tor-kpk',
    code: 'BC-TOR-KPK',
    name: 'Torkham Border',
    nativeName: 'تورخم',
    type: 'BORDER',
    status: 'ACTIVE',
    countryCode: 'AF',
    countryName: 'Afghanistan',
    provinceState: 'Nangarhar / Khyber Pakhtunkhwa',
    timezone: 'Asia/Kabul',
    isHub: true,
    aliases: ['Torkham', 'Torkham Gate', 'Khyber Pass Border', 'Jalalabad Border'],
    coordinates: { lat: 34.1231, lng: 71.0924 },
    borderInfo: {
      sideACountry: 'AF',
      sideAName: 'Torkham Customs House (Nangarhar)',
      sideBCountry: 'PK',
      sideBName: 'Torkham NLC Border Terminal',
      clearanceTypes: ['COMMERCIAL', 'TRANSIT', 'PASSENGER'],
      operatingHours: '06:00 - 20:00',
      bottleneckNotes: 'High volume freight queues, electronic visa & driver permit enforcement, scanner queues.',
      roadConditions: 'Four-lane highway to Jalalabad (70 km) and Kabul (225 km).',
    },
    notes: 'Busiest border crossing between Afghanistan and Pakistan for commercial goods and transit containers.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },

  // --- AIRPORTS ---
  {
    id: 'loc-air-kbl',
    code: 'KBL',
    name: 'Kabul International Airport',
    nativeName: 'میدان هوایی بین‌المللی کابل',
    iataCode: 'KBL',
    icaoCode: 'OAKB',
    type: 'AIRPORT',
    status: 'ACTIVE',
    countryCode: 'AF',
    countryName: 'Afghanistan',
    provinceState: 'Kabul',
    timezone: 'Asia/Kabul',
    isHub: true,
    aliases: ['KBL', 'OAKB', 'Kabul Airport', 'Khwaja Rawash', 'Kabul Air Cargo Terminal'],
    coordinates: { lat: 34.5658, lng: 69.2123 },
    airportInfo: {
      iataCode: 'KBL',
      icaoCode: 'OAKB',
      cargoFacility: true,
      customsPointAvailable: true,
    },
    notes: 'Primary international air cargo gateway for high-value goods, medicine, and electronic equipment.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-air-kdh',
    code: 'KDH',
    name: 'Kandahar International Airport',
    nativeName: 'د کندهار نړيوال هوايي ډګر',
    iataCode: 'KDH',
    icaoCode: 'OAKN',
    type: 'AIRPORT',
    status: 'ACTIVE',
    countryCode: 'AF',
    countryName: 'Afghanistan',
    provinceState: 'Kandahar',
    timezone: 'Asia/Kabul',
    isHub: false,
    aliases: ['KDH', 'OAKN', 'Kandahar Airport', 'Ahmad Shah Baba Airport'],
    coordinates: { lat: 31.5058, lng: 65.8478 },
    airportInfo: {
      iataCode: 'KDH',
      icaoCode: 'OAKN',
      cargoFacility: true,
      customsPointAvailable: true,
    },
    notes: 'Southern air gateway with long runway capable of handling heavy cargo charters (IL-76, B747F).',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-air-dxb',
    code: 'DXB',
    name: 'Dubai International Airport',
    nativeName: 'مطار دبي الدولي',
    iataCode: 'DXB',
    icaoCode: 'OMDB',
    type: 'AIRPORT',
    status: 'ACTIVE',
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    provinceState: 'Dubai',
    timezone: 'Asia/Dubai',
    isHub: true,
    aliases: ['DXB', 'OMDB', 'Dubai Airport', 'Dubai Cargo Village', 'Dnata Cargo Hub'],
    coordinates: { lat: 25.2532, lng: 55.3657 },
    airportInfo: {
      iataCode: 'DXB',
      icaoCode: 'OMDB',
      cargoFacility: true,
      customsPointAvailable: true,
    },
    notes: 'Major global air cargo consolidation hub connecting Asia, Europe, and Americas to Kabul.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-air-ist',
    code: 'IST',
    name: 'Istanbul Airport',
    nativeName: 'İstanbul Havalimanı',
    iataCode: 'IST',
    icaoCode: 'LTFM',
    type: 'AIRPORT',
    status: 'ACTIVE',
    countryCode: 'TR',
    countryName: 'Turkey',
    provinceState: 'Istanbul',
    timezone: 'Europe/Istanbul',
    isHub: true,
    aliases: ['IST', 'LTFM', 'Istanbul Airport', 'Turkish Cargo Mega Hub'],
    coordinates: { lat: 41.2753, lng: 28.7519 },
    airportInfo: {
      iataCode: 'IST',
      icaoCode: 'LTFM',
      cargoFacility: true,
      customsPointAvailable: true,
    },
    notes: 'Key air cargo bridge between Europe/UK and Afghanistan.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },

  // --- INLAND CUSTOMS POINTS & DEPOTS ---
  {
    id: 'loc-icd-kbl',
    code: 'ICD-KBL',
    name: 'Kabul Inland Customs Depot (ICD)',
    nativeName: 'ګمرک کابل / گمرک کابل',
    type: 'CUSTOMS_POINT',
    status: 'ACTIVE',
    countryCode: 'AF',
    countryName: 'Afghanistan',
    provinceState: 'Kabul',
    timezone: 'Asia/Kabul',
    isHub: true,
    aliases: ['Kabul Customs', 'Kabul ICD', 'Gomrok Kabul', 'Kabul Dry Port', 'Jalalabad Road Customs', 'Kabul Customs House'],
    coordinates: { lat: 34.5281, lng: 69.2415 },
    depotInfo: {
      storageType: 'BONDED_WAREHOUSE',
      customsApproved: true,
      capacityTeu: 3500,
    },
    notes: 'Central clearance facility for commercial cargo arriving into the capital city.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-icd-hea',
    code: 'ICD-HEA',
    name: 'Herat Customs Depot',
    nativeName: 'گمرک هرات / د هرات ګمرک',
    type: 'CUSTOMS_POINT',
    status: 'ACTIVE',
    countryCode: 'AF',
    countryName: 'Afghanistan',
    provinceState: 'Herat',
    timezone: 'Asia/Kabul',
    isHub: true,
    aliases: ['Herat Customs', 'Herat ICD', 'Gomrok Herat', 'Herat City Customs'],
    coordinates: { lat: 34.3419, lng: 62.2031 },
    depotInfo: {
      storageType: 'CONTAINER_YARD',
      customsApproved: true,
      capacityTeu: 2500,
    },
    notes: 'Western commercial hub receiving trucks from Islam Qala and Torghundi border crossings.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-icd-kdh',
    code: 'ICD-KDH',
    name: 'Kandahar Customs Depot',
    nativeName: 'د کندهار ګمرک / گمرک قندهار',
    type: 'CUSTOMS_POINT',
    status: 'ACTIVE',
    countryCode: 'AF',
    countryName: 'Afghanistan',
    provinceState: 'Kandahar',
    timezone: 'Asia/Kabul',
    isHub: true,
    aliases: ['Kandahar Customs', 'Kandahar ICD', 'Gomrok Kandahar', 'Shorandam Industrial Park Customs'],
    coordinates: { lat: 31.6289, lng: 65.7372 },
    depotInfo: {
      storageType: 'CONTAINER_YARD',
      customsApproved: true,
      capacityTeu: 2000,
    },
    notes: 'Primary customs hub for southern Afghanistan receiving cargo from Spin Boldak and Zaranj.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-icd-mzr',
    code: 'ICD-MZR',
    name: 'Mazar-i-Sharif Customs Depot',
    nativeName: 'ګمرک مزار شریف / گمرک مزار شریف',
    type: 'CUSTOMS_POINT',
    status: 'ACTIVE',
    countryCode: 'AF',
    countryName: 'Afghanistan',
    provinceState: 'Balkh',
    timezone: 'Asia/Kabul',
    isHub: true,
    aliases: ['Mazar Customs', 'Mazar ICD', 'Gomrok Mazar', 'Balkh Customs'],
    coordinates: { lat: 36.7061, lng: 67.1122 },
    depotInfo: {
      storageType: 'BONDED_WAREHOUSE',
      customsApproved: true,
      capacityTeu: 1800,
    },
    notes: 'Northern hub clearing cargo brought from Hairatan Rail Terminal and Uzbekistan.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

// ============================================================================
// CANONICAL SEED ROUTES
// ============================================================================

function createSnapshotFromSeed(loc: LocationRecord): LocationSnapshot {
  return {
    locationId: loc.id,
    canonicalName: loc.name,
    unlocode: loc.unlocode,
    iataCode: loc.iataCode,
    countryCode: loc.countryCode,
    countryName: loc.countryName,
    type: loc.type,
    timezone: loc.timezone,
    displayText: loc.name,
    snapshotDate: '2026-01-01T00:00:00.000Z',
  }
}

const locBND = SEED_LOCATIONS.find((l) => l.id === 'loc-port-bnd')!
const locISL = SEED_LOCATIONS.find((l) => l.id === 'loc-border-isl-dog')!
const locHEA = SEED_LOCATIONS.find((l) => l.id === 'loc-icd-hea')!
const locKBL = SEED_LOCATIONS.find((l) => l.id === 'loc-icd-kbl')!
const locNSA = SEED_LOCATIONS.find((l) => l.id === 'loc-port-nsa')!
const locJEA = SEED_LOCATIONS.find((l) => l.id === 'loc-port-jea')!
const locKDH = SEED_LOCATIONS.find((l) => l.id === 'loc-icd-kdh')!
const locSPI = SEED_LOCATIONS.find((l) => l.id === 'loc-border-spi-cha')!
const locKHI = SEED_LOCATIONS.find((l) => l.id === 'loc-port-khi')!
const locHAI = SEED_LOCATIONS.find((l) => l.id === 'loc-border-hai-ter')!
const locMZR = SEED_LOCATIONS.find((l) => l.id === 'loc-icd-mzr')!

export const SEED_ROUTES: RouteMaster[] = [
  {
    id: 'rt-bnd-kbl-via-isl',
    code: 'RT-BND-ISL-KBL',
    name: 'Bandar Abbas to Kabul via Islam Qala',
    namePersian: 'بندر عباس به کابل از طریق اسلام قلعه و هرات',
    originId: locBND.id,
    originSnapshot: createSnapshotFromSeed(locBND),
    destinationId: locKBL.id,
    destinationSnapshot: createSnapshotFromSeed(locKBL),
    transitMode: 'TRUCK',
    isActive: true,
    version: 1,
    legs: [
      {
        id: 'leg-1',
        legOrder: 1,
        fromLocationId: locBND.id,
        fromLocationSnapshot: createSnapshotFromSeed(locBND),
        toLocationId: locISL.id,
        toLocationSnapshot: createSnapshotFromSeed(locISL),
        mode: 'TRUCK',
        minDays: 3,
        maxDays: 6,
        avgDays: 4,
        distanceKm: 1450,
        notes: 'Overland transit through Iran via Kerman and Taybad to Dogharoon/Islam Qala border gate.',
      },
      {
        id: 'leg-2',
        legOrder: 2,
        fromLocationId: locISL.id,
        fromLocationSnapshot: createSnapshotFromSeed(locISL),
        toLocationId: locHEA.id,
        toLocationSnapshot: createSnapshotFromSeed(locHEA),
        mode: 'TRUCK',
        minDays: 1,
        maxDays: 3,
        avgDays: 1.5,
        distanceKm: 120,
        notes: 'Border clearance and road transit into Herat Customs Depot.',
      },
      {
        id: 'leg-3',
        legOrder: 3,
        fromLocationId: locHEA.id,
        fromLocationSnapshot: createSnapshotFromSeed(locHEA),
        toLocationId: locKBL.id,
        toLocationSnapshot: createSnapshotFromSeed(locKBL),
        mode: 'TRUCK',
        minDays: 2,
        maxDays: 5,
        avgDays: 3,
        distanceKm: 1050,
        notes: 'Highway transit along Garland Ring Road via Kandahar and Ghazni to Kabul ICD.',
      },
    ],
    totalMinDays: 6,
    totalMaxDays: 14,
    totalAvgDays: 8.5,
    totalDistanceKm: 2620,
    notes: 'Most frequently utilized commercial overland container route for Western & Central Afghanistan.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'rt-nsa-kbl-multimodal',
    code: 'RT-NSA-BND-KBL',
    name: 'Nhava Sheva (JNPT) to Kabul Multimodal',
    namePersian: 'نهاوا شیوا به کابل (دریایی و زمینی)',
    originId: locNSA.id,
    originSnapshot: createSnapshotFromSeed(locNSA),
    destinationId: locKBL.id,
    destinationSnapshot: createSnapshotFromSeed(locKBL),
    transitMode: 'MULTIMODAL',
    isActive: true,
    version: 1,
    legs: [
      {
        id: 'leg-1',
        legOrder: 1,
        fromLocationId: locNSA.id,
        fromLocationSnapshot: createSnapshotFromSeed(locNSA),
        toLocationId: locBND.id,
        toLocationSnapshot: createSnapshotFromSeed(locBND),
        mode: 'SEA',
        minDays: 4,
        maxDays: 8,
        avgDays: 6,
        distanceKm: 1850,
        notes: 'Direct feeder or container line sailing across Arabian Sea / Strait of Hormuz to Bandar Abbas.',
      },
      {
        id: 'leg-2',
        legOrder: 2,
        fromLocationId: locBND.id,
        fromLocationSnapshot: createSnapshotFromSeed(locBND),
        toLocationId: locISL.id,
        toLocationSnapshot: createSnapshotFromSeed(locISL),
        mode: 'TRUCK',
        minDays: 3,
        maxDays: 6,
        avgDays: 4,
        distanceKm: 1450,
        notes: 'Transit TIR truck from Shahid Rajaee port to Dogharoon/Islam Qala border gate.',
      },
      {
        id: 'leg-3',
        legOrder: 3,
        fromLocationId: locISL.id,
        fromLocationSnapshot: createSnapshotFromSeed(locISL),
        toLocationId: locKBL.id,
        toLocationSnapshot: createSnapshotFromSeed(locKBL),
        mode: 'TRUCK',
        minDays: 3,
        maxDays: 7,
        avgDays: 4.5,
        distanceKm: 1170,
        notes: 'Afghan truck transit from Islam Qala through Herat to Kabul Inland Customs Depot.',
      },
    ],
    totalMinDays: 10,
    totalMaxDays: 21,
    totalAvgDays: 14.5,
    totalDistanceKm: 4470,
    notes: 'Major import pipeline for Indian tea, garments, spices, and construction hardware.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'rt-khi-kdh-via-spi',
    code: 'RT-KHI-SPI-KDH',
    name: 'Karachi Port to Kandahar via Spin Boldak',
    namePersian: 'بندر کراچی به کندهار از طریق چمن و سپین بولدک',
    originId: locKHI.id,
    originSnapshot: createSnapshotFromSeed(locKHI),
    destinationId: locKDH.id,
    destinationSnapshot: createSnapshotFromSeed(locKDH),
    transitMode: 'TRUCK',
    isActive: true,
    version: 1,
    legs: [
      {
        id: 'leg-1',
        legOrder: 1,
        fromLocationId: locKHI.id,
        fromLocationSnapshot: createSnapshotFromSeed(locKHI),
        toLocationId: locSPI.id,
        toLocationSnapshot: createSnapshotFromSeed(locSPI),
        mode: 'TRUCK',
        minDays: 3,
        maxDays: 7,
        avgDays: 4,
        distanceKm: 810,
        notes: 'Overland transit from Karachi port via Quetta to Chaman / Spin Boldak border gate.',
      },
      {
        id: 'leg-2',
        legOrder: 2,
        fromLocationId: locSPI.id,
        fromLocationSnapshot: createSnapshotFromSeed(locSPI),
        toLocationId: locKDH.id,
        toLocationSnapshot: createSnapshotFromSeed(locKDH),
        mode: 'TRUCK',
        minDays: 1,
        maxDays: 3,
        avgDays: 1.5,
        distanceKm: 105,
        notes: 'Customs release at Spin Boldak and road transport into Kandahar Customs ICD.',
      },
    ],
    totalMinDays: 4,
    totalMaxDays: 10,
    totalAvgDays: 5.5,
    totalDistanceKm: 915,
    notes: 'Fastest corridor for southern Afghan trade when border gates remain smoothly operational.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'rt-hai-kbl-via-mzr',
    code: 'RT-HAI-MZR-KBL',
    name: 'Hairatan to Kabul via Mazar-i-Sharif',
    namePersian: 'حیرتان به کابل از طریق مزار شریف و سالنگ',
    originId: locHAI.id,
    originSnapshot: createSnapshotFromSeed(locHAI),
    destinationId: locKBL.id,
    destinationSnapshot: createSnapshotFromSeed(locKBL),
    transitMode: 'TRUCK',
    isActive: true,
    version: 1,
    legs: [
      {
        id: 'leg-1',
        legOrder: 1,
        fromLocationId: locHAI.id,
        fromLocationSnapshot: createSnapshotFromSeed(locHAI),
        toLocationId: locMZR.id,
        toLocationSnapshot: createSnapshotFromSeed(locMZR),
        mode: 'TRUCK',
        minDays: 1,
        maxDays: 2,
        avgDays: 1,
        distanceKm: 75,
        notes: 'Transloading from rail wagons to road trucks; road transfer to Mazar Customs Depot.',
      },
      {
        id: 'leg-2',
        legOrder: 2,
        fromLocationId: locMZR.id,
        fromLocationSnapshot: createSnapshotFromSeed(locMZR),
        toLocationId: locKBL.id,
        toLocationSnapshot: createSnapshotFromSeed(locKBL),
        mode: 'TRUCK',
        minDays: 1,
        maxDays: 3,
        avgDays: 2,
        distanceKm: 425,
        notes: 'Mountain transit via Pul-e-Khumri and the Salang Tunnel to Kabul ICD (winter weather dependent).',
      },
    ],
    totalMinDays: 2,
    totalMaxDays: 5,
    totalAvgDays: 3,
    totalDistanceKm: 500,
    notes: 'Primary artery for Central Asian wheat, cooking oil, steel bars, and petrochemicals.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

// ============================================================================
// SERVICE IMPLEMENTATION & ALGORITHM LOGIC
// ============================================================================

export class RouteLocationService {
  private static instance: RouteLocationService
  private locations: LocationRecord[] = []
  private routes: RouteMaster[] = []
  private isInitialized = false

  private constructor() {
    this.init()
  }

  public static getInstance(): RouteLocationService {
    if (!RouteLocationService.instance) {
      RouteLocationService.instance = new RouteLocationService()
    }
    return RouteLocationService.instance
  }

  private init() {
    if (this.isInitialized) return
    this.locations = [...SEED_LOCATIONS]
    this.routes = [...SEED_ROUTES]
    this.loadFromLocalStorage()
    this.isInitialized = true
  }

  private loadFromLocalStorage() {
    if (typeof window === 'undefined') return
    try {
      const storedLocs = window.localStorage.getItem('skybol:master-locations')
      if (storedLocs) {
        const parsed = JSON.parse(storedLocs)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge custom with seed
          const map = new Map<string, LocationRecord>()
          for (const s of SEED_LOCATIONS) map.set(s.id, s)
          for (const p of parsed) map.set(p.id, p)
          this.locations = Array.from(map.values())
        }
      }
      const storedRoutes = window.localStorage.getItem('skybol:master-routes')
      if (storedRoutes) {
        const parsed = JSON.parse(storedRoutes)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, RouteMaster>()
          for (const r of SEED_ROUTES) map.set(r.id, r)
          for (const p of parsed) map.set(p.id, p)
          this.routes = Array.from(map.values())
        }
      }
    } catch (e) {
      console.warn('[RouteLocationService] Error loading from localStorage:', e)
    }
  }

  private saveToLocalStorage() {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('skybol:master-locations', JSON.stringify(this.locations))
      window.localStorage.setItem('skybol:master-routes', JSON.stringify(this.routes))
      window.dispatchEvent(new CustomEvent('skybol:locations-updated', { detail: { count: this.locations.length } }))
    } catch (e) {
      console.warn('[RouteLocationService] Error saving to localStorage:', e)
    }
  }

  // --- LOCATION QUERIES ---

  public getLocations(): LocationRecord[] {
    return [...this.locations]
  }

  public getLocationById(id: string): LocationRecord | undefined {
    return this.locations.find((l) => l.id === id)
  }

  /**
   * Universal Alias & Fuzzy Lookup Engine:
   * Matches by UN/LOCODE, IATA, ICAO, Canonical Name, Native Name, or Known Aliases.
   */
  public resolveLocation(query: string): LocationRecord | null {
    if (!query) return null
    const q = query.trim().toLowerCase()
    const cleanQ = q.replace(/[^a-z0-9]/g, '')

    // 1. Direct Code Matches (UN/LOCODE, IATA, ICAO)
    for (const loc of this.locations) {
      if (loc.unlocode && loc.unlocode.toLowerCase() === q) return loc
      if (loc.iataCode && loc.iataCode.toLowerCase() === q) return loc
      if (loc.icaoCode && loc.icaoCode.toLowerCase() === q) return loc
      if (loc.code && loc.code.toLowerCase() === q) return loc
    }

    // 2. Exact Canonical Name or Native Name
    for (const loc of this.locations) {
      if (loc.name.toLowerCase() === q) return loc
      if (loc.nativeName && loc.nativeName.toLowerCase() === q) return loc
    }

    // 3. Exact Alias Matches
    for (const loc of this.locations) {
      if (loc.aliases && loc.aliases.some((a) => a.toLowerCase() === q)) {
        return loc
      }
    }

    // 4. Normalized Alphanumeric Exact Matches
    for (const loc of this.locations) {
      const cleanName = loc.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (cleanName === cleanQ && cleanName.length > 2) return loc

      if (loc.aliases) {
        for (const alias of loc.aliases) {
          const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '')
          if (cleanAlias === cleanQ && cleanAlias.length > 2) return loc
        }
      }
    }

    // 5. Border Two-Sided Name Check
    for (const loc of this.locations) {
      if (loc.borderInfo) {
        const sideA = loc.borderInfo.sideAName.toLowerCase()
        const sideB = loc.borderInfo.sideBName.toLowerCase()
        if (sideA.includes(q) || sideB.includes(q) || q.includes(sideA) || q.includes(sideB)) {
          return loc
        }
      }
    }

    // 6. Substring containment match (minimum 3 chars to prevent false positives)
    if (cleanQ.length >= 3) {
      for (const loc of this.locations) {
        const cleanName = loc.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (cleanName.includes(cleanQ) || cleanQ.includes(cleanName)) {
          return loc
        }
        for (const alias of loc.aliases) {
          const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '')
          if (cleanAlias.includes(cleanQ) || cleanQ.includes(cleanAlias)) {
            return loc
          }
        }
      }
    }

    return null
  }

  /**
   * Duplicate Candidate Checker:
   * Prevents accidental duplication of existing ports/crossings.
   */
  public checkLocationDuplicate(candidate: Partial<LocationRecord>): {
    hasDuplicate: boolean
    duplicateReason?: string
    existingLocation?: LocationRecord
  } {
    for (const existing of this.locations) {
      // Exclude self if editing
      if (candidate.id && existing.id === candidate.id) continue

      // UN/LOCODE clash
      if (
        candidate.unlocode &&
        existing.unlocode &&
        candidate.unlocode.trim().toUpperCase() === existing.unlocode.trim().toUpperCase()
      ) {
        return {
          hasDuplicate: true,
          duplicateReason: `UN/LOCODE '${candidate.unlocode}' already assigned to ${existing.name}`,
          existingLocation: existing,
        }
      }

      // IATA Code clash
      if (
        candidate.iataCode &&
        existing.iataCode &&
        candidate.iataCode.trim().toUpperCase() === existing.iataCode.trim().toUpperCase()
      ) {
        return {
          hasDuplicate: true,
          duplicateReason: `IATA Airport code '${candidate.iataCode}' already assigned to ${existing.name}`,
          existingLocation: existing,
        }
      }

      // Name similarity clash
      if (candidate.name) {
        const clean1 = candidate.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        const clean2 = existing.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (clean1 === clean2 && clean1.length > 2) {
          return {
            hasDuplicate: true,
            duplicateReason: `Identical location name '${existing.name}' already exists`,
            existingLocation: existing,
          }
        }
      }
    }

    return { hasDuplicate: false }
  }

  // --- LOCATION MUTATIONS ---

  public createLocation(data: Omit<LocationRecord, 'id' | 'createdAt' | 'updatedAt'>): LocationRecord {
    const dupCheck = this.checkLocationDuplicate(data)
    if (dupCheck.hasDuplicate) {
      console.warn('[RouteLocationService] Warning: Potential duplicate location:', dupCheck.duplicateReason)
    }

    const newLoc: LocationRecord = {
      ...data,
      id: `loc-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.locations.unshift(newLoc)
    this.saveToLocalStorage()
    return newLoc
  }

  public updateLocation(id: string, updates: Partial<LocationRecord>): LocationRecord {
    const index = this.locations.findIndex((l) => l.id === id)
    if (index === -1) throw new Error(`Location not found: ${id}`)

    const updated = {
      ...this.locations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.locations[index] = updated
    this.saveToLocalStorage()
    return updated
  }

  public deleteLocation(id: string): boolean {
    const prevCount = this.locations.length
    this.locations = this.locations.filter((l) => l.id !== id)
    if (this.locations.length !== prevCount) {
      this.saveToLocalStorage()
      return true
    }
    return false
  }

  // --- HISTORICAL SNAPSHOT GENERATOR ---

  /**
   * Generates a frozen LocationSnapshot.
   * Ensures that updating master data records later never modifies past legal documents.
   */
  public buildLocationSnapshot(location: LocationRecord, rawTextOverride?: string): LocationSnapshot {
    return {
      locationId: location.id,
      canonicalName: location.name,
      unlocode: location.unlocode,
      iataCode: location.iataCode,
      countryCode: location.countryCode,
      countryName: location.countryName,
      type: location.type,
      timezone: location.timezone,
      displayText: rawTextOverride || location.name,
      snapshotDate: new Date().toISOString(),
    }
  }

  // --- ROUTE CALCULATIONS & MUTATIONS ---

  public getRoutes(): RouteMaster[] {
    return [...this.routes]
  }

  public getRouteById(id: string): RouteMaster | undefined {
    return this.routes.find((r) => r.id === id)
  }

  public calculateRouteTransit(legs: RouteLeg[]): {
    totalMinDays: number
    totalMaxDays: number
    totalAvgDays: number
    totalDistanceKm: number
  } {
    let totalMinDays = 0
    let totalMaxDays = 0
    let totalAvgDays = 0
    let totalDistanceKm = 0

    for (const leg of legs) {
      totalMinDays += leg.minDays || 0
      totalMaxDays += leg.maxDays || 0
      totalAvgDays += leg.avgDays || 0
      totalDistanceKm += leg.distanceKm || 0
    }

    return {
      totalMinDays,
      totalMaxDays,
      totalAvgDays: Number(totalAvgDays.toFixed(1)),
      totalDistanceKm,
    }
  }

  public createRoute(
    data: Omit<RouteMaster, 'id' | 'totalMinDays' | 'totalMaxDays' | 'totalAvgDays' | 'totalDistanceKm' | 'version' | 'createdAt' | 'updatedAt'>
  ): RouteMaster {
    const transit = this.calculateRouteTransit(data.legs)

    const newRoute: RouteMaster = {
      ...data,
      id: `rt-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...transit,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.routes.unshift(newRoute)
    this.saveToLocalStorage()
    return newRoute
  }

  public updateRoute(id: string, updates: Partial<RouteMaster>): RouteMaster {
    const index = this.routes.findIndex((r) => r.id === id)
    if (index === -1) throw new Error(`Route not found: ${id}`)

    const current = this.routes[index]
    const updatedLegs = updates.legs || current.legs
    const transit = this.calculateRouteTransit(updatedLegs)

    const updated: RouteMaster = {
      ...current,
      ...updates,
      ...transit,
      version: (current.version || 1) + 1,
      updatedAt: new Date().toISOString(),
    }

    this.routes[index] = updated
    this.saveToLocalStorage()
    return updated
  }

  public deleteRoute(id: string): boolean {
    const prevCount = this.routes.length
    this.routes = this.routes.filter((r) => r.id !== id)
    if (this.routes.length !== prevCount) {
      this.saveToLocalStorage()
      return true
    }
    return false
  }

  /**
   * Generates a reversed return route (e.g. Kabul to Bandar Abbas)
   * by reversing legs, swapping origin/destination, and maintaining transit metrics.
   */
  public generateReverseRoute(sourceRoute: RouteMaster): RouteMaster {
    const reversedLegs: RouteLeg[] = sourceRoute.legs
      .slice()
      .reverse()
      .map((leg, idx) => ({
        id: `rev-leg-${idx + 1}`,
        legOrder: idx + 1,
        fromLocationId: leg.toLocationId,
        fromLocationSnapshot: leg.toLocationSnapshot,
        toLocationId: leg.fromLocationId,
        toLocationSnapshot: leg.fromLocationSnapshot,
        mode: leg.mode,
        minDays: leg.minDays,
        maxDays: leg.maxDays,
        avgDays: leg.avgDays,
        distanceKm: leg.distanceKm,
        notes: leg.notes ? `Return leg: ${leg.notes}` : undefined,
      }))

    const transit = this.calculateRouteTransit(reversedLegs)

    const newReverseRoute: RouteMaster = {
      id: `rt-rev-${Date.now()}`,
      code: `REV-${sourceRoute.code}`,
      name: `Return: ${sourceRoute.destinationSnapshot.canonicalName} to ${sourceRoute.originSnapshot.canonicalName}`,
      namePersian: sourceRoute.namePersian ? `مسیر برگشت: ${sourceRoute.namePersian}` : undefined,
      originId: sourceRoute.destinationId,
      originSnapshot: sourceRoute.destinationSnapshot,
      destinationId: sourceRoute.originId,
      destinationSnapshot: sourceRoute.originSnapshot,
      transitMode: sourceRoute.transitMode,
      legs: reversedLegs,
      ...transit,
      isActive: true,
      version: 1,
      notes: `Auto-generated reverse route based on ${sourceRoute.name}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.routes.unshift(newReverseRoute)
    this.saveToLocalStorage()
    return newReverseRoute
  }

  /**
   * Produces an immutable RouteSnapshot to attach to an active shipment.
   */
  public buildRouteSnapshot(route: RouteMaster): RouteSnapshot {
    return {
      routeId: route.id,
      routeCode: route.code,
      routeName: route.name,
      version: route.version,
      transitMode: route.transitMode,
      legs: JSON.parse(JSON.stringify(route.legs)),
      totalMinDays: route.totalMinDays,
      totalMaxDays: route.totalMaxDays,
      totalAvgDays: route.totalAvgDays,
      totalDistanceKm: route.totalDistanceKm,
      frozenAt: new Date().toISOString(),
    }
  }

  // --- DATA QUALITY & AUDIT ---

  public runDataQualityAudit(): LocationQualityAudit {
    let missingTimezone = 0
    let missingUnlocode = 0
    let missingIata = 0
    const duplicateCandidates: LocationQualityAudit['duplicateCandidates'] = []

    for (let i = 0; i < this.locations.length; i++) {
      const loc = this.locations[i]
      if (!loc.timezone) missingTimezone++
      if ((loc.type === 'PORT' || loc.type === 'SEAPORT') && !loc.unlocode) missingUnlocode++
      if (loc.type === 'AIRPORT' && !loc.iataCode) missingIata++

      // Check for pairwise potential duplicates
      for (let j = i + 1; j < this.locations.length; j++) {
        const other = this.locations[j]
        const clean1 = loc.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        const clean2 = other.name.toLowerCase().replace(/[^a-z0-9]/g, '')

        if (clean1 === clean2) {
          duplicateCandidates.push({
            name1: loc.name,
            id1: loc.id,
            name2: other.name,
            id2: other.id,
            reason: 'Identical normalized name',
          })
        } else if (loc.unlocode && other.unlocode && loc.unlocode === other.unlocode) {
          duplicateCandidates.push({
            name1: loc.name,
            id1: loc.id,
            name2: other.name,
            id2: other.id,
            reason: `Shared UN/LOCODE: ${loc.unlocode}`,
          })
        }
      }
    }

    return {
      totalLocations: this.locations.length,
      missingTimezone,
      missingUnlocode,
      missingIata,
      duplicateCandidates,
      unlinkedHistoricalTextCount: 0,
    }
  }
}

export const routeLocationService = RouteLocationService.getInstance()
