export interface IranOfficeSettings {
  iran_office_building?: string
  iran_office_location?: string
  iran_office_pobox?: string
  iran_office_telefax?: string
  iran_office_cellphone?: string
  iran_office_email?: string
}

export interface CustomWatermarkItem {
  id: string
  label: string
  category: string
  url: string // Data URL or relative URL
  opacity: number
  format: 'svg' | 'png' | 'jpeg' | 'webp'
  createdAt: string
  version: number
  fileSizeBytes?: number
}

export interface BolDocumentSettings {
  settings_version: string // e.g. "5.0.0"
  lastUpdated: string

  // General Company Profile
  companyName: string
  companyNamePersian: string
  companySubtitle: string
  companyPhone: string
  companyEmail: string
  companyAddress: string
  companyLicence: string

  // Iran Office Information
  iranOffice: IranOfficeSettings

  // Logo & Branding
  logoUrl: string
  logoDesignId?: string
  brandLockupUrl?: string

  // Watermark Settings (Global Defaults)
  defaultBgImageUrl: string
  defaultBgOpacity: number
  watermarkFavorites: string[] // List of preset labels e.g. ["Premium Mountain", "Harbor Morning"]
  watermarkRecents: string[] // Recent preset labels
  customWatermarks: CustomWatermarkItem[]

  // Stamp & Signature
  defaultShowStamp: boolean
  stampScale: number // 0.8 to 1.5
  stampPosition: 'carrier-box' | 'bottom-right'

  // PDF & Print Preferences
  pdfQuality: 'standard' | 'high' | 'archive' // standard (1.5x), high (2x), archive (3x)
  pdfImageCompression: boolean
  printPaper: 'A4'
  printOrientation: 'portrait'
  printScale: number // 100%

  // Document Defaults
  defaultCurrency: 'USD' | 'AFN'
  defaultLanguage: 'en' | 'fa' | 'ps'
  defaultTransitBorderNote?: string
}

export const DEFAULT_BOL_SETTINGS: BolDocumentSettings = {
  settings_version: '5.0.0',
  lastUpdated: new Date().toISOString(),

  companyName: 'SKY ARIANA LIMITED',
  companyNamePersian: 'شرکت حمل و نقل بین المللی سکای آریانا لمیتد',
  companySubtitle: 'Import & Export - International Transportation',
  companyPhone: '+93 700 000 000',
  companyEmail: 'info@company.com',
  companyAddress: '2nd Floor, 16 No. Office, Shahidano, Chowk...',
  companyLicence: '2401-2198',

  iranOffice: {
    iran_office_building: 'CUBIC BUILDING',
    iran_office_location: 'BANDAR ABBASS - IRAN',
    iran_office_pobox: '7913973295',
    iran_office_telefax: '+98 76 32226028',
    iran_office_cellphone: '+98 09172325086',
    iran_office_email: 'info@balambarbaran.com',
  },

  logoUrl: '/images/sky-ariana-logo.png',
  logoDesignId: 'modern-flat',
  brandLockupUrl: '/images/sky-ariana-brand-lockup.png',

  defaultBgImageUrl: '/images/mountain-watermark-premium.png',
  defaultBgOpacity: 0.22,
  watermarkFavorites: ['Premium Mountain', 'Harbor Morning'],
  watermarkRecents: ['Harbor Morning', 'Premium Mountain', 'Horizon Route'],
  customWatermarks: [],

  defaultShowStamp: true,
  stampScale: 1.0,
  stampPosition: 'carrier-box',

  pdfQuality: 'high',
  pdfImageCompression: true,
  printPaper: 'A4',
  printOrientation: 'portrait',
  printScale: 100,

  defaultCurrency: 'USD',
  defaultLanguage: 'en',
  defaultTransitBorderNote: 'ISLAM QALA / TORGHUNDI',
}

export type SettingsTabId =
  | 'general'
  | 'watermark'
  | 'branding'
  | 'stamp'
  | 'pdf-print'
  | 'defaults'
  | 'backup'

export interface SettingsTabMeta {
  id: SettingsTabId
  label: string
  labelPersian: string
  description: string
}

export type LogoDesignId =
  | 'modern-flat'
  | 'modern-3d'
  | 'modern-typography'
  | 'vintage-founding-2011'
  | 'classic-heritage-full'
  | 'classic-horizontal'
  | 'classic-stack'
  | 'circular-seal'
  | 'custom'

export type LogoDesignCategory = 'modern' | 'classic' | 'seal' | 'custom'

export interface LogoDesignPreset {
  id: string
  name: string
  nameFa: string
  category: LogoDesignCategory
  badge: string
  badgeColor: string
  previewUrl: string
  lockupUrl: string
  emblemUrl: string
  aspectRatio: string
  description: string
  descriptionFa: string
  isOldLogo?: boolean
}

export const OFFICIAL_LOGO_PRESETS: LogoDesignPreset[] = [
  {
    id: 'modern-flat',
    name: 'Modern Flat Vector (Official)',
    nameFa: 'طرح مدرن فلت رسمی',
    category: 'modern',
    badge: 'Standard / پیش‌فرض',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    previewUrl: '/images/logos/sky-ariana-modern-flat.png',
    lockupUrl: '/images/sky-ariana-brand-lockup.png',
    emblemUrl: '/images/logos/sky-ariana-modern-flat-emblem.png',
    aspectRatio: 'aspect-[3.6/1]',
    description: 'Clean contemporary vector lockup with blue typography and circular SKY seal.',
    descriptionFa: 'طراحی مینیمال و معاصر با نشان دایره‌ای و تایپوگرافی رسمی آبی.',
  },
  {
    id: 'modern-3d',
    name: 'Modern 3D Metallic Gloss',
    nameFa: 'طرح مدرن ۳ بعدی متالیک کروم',
    category: 'modern',
    badge: '3D Chrome / سه‌بعدی',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    previewUrl: '/images/logos/sky-ariana-modern-3d.png',
    lockupUrl: '/images/logos/sky-ariana-modern-3d-lockup.png',
    emblemUrl: '/images/logos/sky-ariana-modern-3d-emblem.png',
    aspectRatio: 'aspect-[3.6/1]',
    description: 'High-impact 3D metallic chrome blue emblem with extruded Persian brand lettering.',
    descriptionFa: 'نشان متالیک سه بعدی کروم با حروف‌نگاری برجسته و درخشان فارسی و انگلیسی.',
  },
  {
    id: 'modern-typography',
    name: 'Modern Typography Minimal (No Seal)',
    nameFa: 'تایپوگرافی مدرن مینیمال (متن خالص)',
    category: 'modern',
    badge: 'Minimal / مینیمال',
    badgeColor: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    previewUrl: '/images/logos/sky-ariana-modern-typography.png',
    lockupUrl: '/images/logos/sky-ariana-modern-typography.png',
    emblemUrl: '/images/logos/sky-ariana-circular-seal.png',
    aspectRatio: 'aspect-[2.6/1]',
    description: 'Pure typography masthead with geometric Kufic title and blue English transport subline.',
    descriptionFa: 'تایپوگرافی خالص با عنوان کوفی هندسی و زیرنویس انگلیسی حمل و نقل بدون نشان.',
  },
  {
    id: 'vintage-founding-2011',
    name: 'Founding Vintage Heritage (Since 2011)',
    nameFa: 'طرح اصیل سنتی اولیه (تأسیس ۲۰۱۱)',
    category: 'classic',
    badge: 'Since 2011 / از سال ۲۰۱۱',
    badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    previewUrl: '/images/logos/sky-ariana-vintage-heritage.png',
    lockupUrl: '/images/logos/sky-ariana-vintage-heritage-lockup.png',
    emblemUrl: '/images/logos/sky-ariana-vintage-heritage-emblem.png',
    aspectRatio: 'aspect-[3.6/1]',
    description: 'Authentic Sky Ariana founding 2011 emblem with global logistics wreath, fleet, and corporate typography.',
    descriptionFa: 'طرح ماندگار و خاطره‌انگیز سال ۲۰۱۱ با نشان ترانزیت جهانی، ناوگان باربری و تایپوگرافی رسمی.',
    isOldLogo: true,
  },
  {
    id: 'classic-heritage-full',
    name: 'Classic Vintage Full Heritage (Old Logo)',
    nameFa: 'لوگوی کلاسیک اصیل با مشخصات کامل',
    category: 'classic',
    badge: 'Old Logo / طرح کامل سنتی',
    badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    previewUrl: '/images/logos/sky-ariana-classic-heritage.png',
    lockupUrl: '/images/logos/sky-ariana-classic-heritage.png',
    emblemUrl: '/images/logos/sky-ariana-circular-seal.png',
    aspectRatio: 'aspect-[2.65/1]',
    description: 'Original Sky Ariana heritage lockup with circular SKY seal, geometric Kufic masthead, English banner, and full legal name in Persian.',
    descriptionFa: 'طرح اصیل و نوستالژیک کامل با نشان گرد، تایپوگرافی کوفی، نوار انگلیسی و نام کامل ثبتی شرکت.',
    isOldLogo: true,
  },
  {
    id: 'classic-horizontal',
    name: 'Classic Vintage Horizontal (Old Logo)',
    nameFa: 'لوگوی کلاسیک قدیمی (افقی)',
    category: 'classic',
    badge: 'Old Logo / طرح کلاسیک',
    badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    previewUrl: '/images/logos/sky-ariana-classic-horizontal.png',
    lockupUrl: '/images/sky-ariana-brand-lockup.png',
    emblemUrl: '/images/logos/sky-ariana-modern-flat-emblem.png',
    aspectRatio: 'aspect-[3.6/1]',
    description: 'Original Sky Ariana heritage horizontal logo with geometric Kufic title and blue service banner.',
    descriptionFa: 'طرح اصیل و نوستالژیک افقی با تایپوگرافی کوفی هندسی و نوار حمل و نقل بین‌المللی.',
    isOldLogo: true,
  },
  {
    id: 'classic-stack',
    name: 'Classic Vintage Stacked (Old Logo)',
    nameFa: 'لوگوی کلاسیک قدیمی (عمودی متمرکز)',
    category: 'classic',
    badge: 'Old Logo / طرح سنتی',
    badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    previewUrl: '/images/logos/sky-ariana-classic-stack.png',
    lockupUrl: '/images/logos/sky-ariana-classic-stack.png',
    emblemUrl: '/images/logos/sky-ariana-modern-flat-emblem.png',
    aspectRatio: 'aspect-[1.33/1]',
    description: 'Original Sky Ariana heritage vertical stack with central emblem, Kufic masthead, and full legal name.',
    descriptionFa: 'طرح سنتی اصیل با نشان گرد در بالا، عنوان کوفی و نام کامل ثبت شرکت.',
    isOldLogo: true,
  },
  {
    id: 'circular-seal',
    name: 'Official Circular Seal & Monogram',
    nameFa: 'نشان دایره‌ای رسمی شرکت',
    category: 'seal',
    badge: 'Seal / نشان رسمی',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    previewUrl: '/images/logos/sky-ariana-circular-seal.png',
    lockupUrl: '/images/sky-ariana-brand-lockup.png',
    emblemUrl: '/images/logos/sky-ariana-circular-seal.png',
    aspectRatio: 'aspect-square',
    description: 'High-resolution circular brand seal with dual concentric rings and SKY geometry.',
    descriptionFa: 'نشان دایره‌ای رسمی با دو حلقه متمرکز و مونوگرام هندسی SKY.',
  },
  {
    id: 'circular-seal-3d',
    name: 'Official 3D Metallic Blue Seal & Emblem',
    nameFa: 'نشان سه‌بعدی متالیک کروم شرکت',
    category: 'seal',
    badge: '3D Emblem / نشان ۳ بعدی',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    previewUrl: '/images/logos/sky-ariana-modern-3d-emblem.png',
    lockupUrl: '/images/logos/sky-ariana-modern-3d-lockup.png',
    emblemUrl: '/images/logos/sky-ariana-modern-3d-emblem.png',
    aspectRatio: 'aspect-square',
    description: 'Striking 3D metallic chrome blue emblem with reflective circular beveled border.',
    descriptionFa: 'نشان برجسته سه‌بعدی متالیک با قاب دور متالیک و درخشش آبی کروم.',
  },
  {
    id: 'circular-seal-gold',
    name: 'Official Circular Gold Luxury Seal & Monogram',
    nameFa: 'نشان طلایی سلطنتی و مونوگرام لوکس',
    category: 'seal',
    badge: 'Gold Seal / نشان طلایی',
    badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    previewUrl: '/images/logos/sky-ariana-gold-seal.png',
    lockupUrl: '/images/sky-ariana-brand-lockup.png',
    emblemUrl: '/images/logos/sky-ariana-gold-seal.png',
    aspectRatio: 'aspect-square',
    description: 'Prestigious gold metallic circular monogram seal for VIP & luxury customs documents.',
    descriptionFa: 'نشان سلطنتی طلایی متالیک برای اسناد گمرکی و حمل‌های بین‌المللی ویژه.',
  },
]
