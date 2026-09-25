"use client"

import Image from 'next/image'
import { useRef, useState, useMemo } from 'react'
import { QuickShipmentModal } from '@/components/shipments/quick-shipment-modal'
import {
  LogOut,
  Settings,
  ArrowLeft,
  Package,
  MessageSquare,
  Users,
  BookOpen,
  Landmark,
  FileCheck2,
  Activity,
  ChevronDown,
  BarChart3,
  Calculator,
  Compass,
  Database,
  Zap,
  ShieldCheck,
  History,
  CalendarCheck2,
  Sparkles,
  Tag,
  Truck,
  Boxes,
  ShieldAlert,
  Ship,
  Plane,
  AlertTriangle,
  Lock,
  TrendingUp,
  FolderArchive,
  LayoutGrid,
  Search,
  Globe,
  Check,
} from "lucide-react"
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import { HeaderCloudSyncButton } from '@/components/sync/header-cloud-sync-button'
import { ServerStatusPill } from '@/components/server/server-status-pill'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { GlobalSearch } from '@/components/global-search'
import { preloadModule } from '@/lib/startup/module-preloader'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  showBack?: boolean
  title?: string
  subtitle?: string
}

export interface EnterpriseModuleItem {
  id: string
  title: string
  shortLabel: string
  subtitle: string
  icon: React.ElementType
  category: 'ops' | 'finance' | 'commercial' | 'system'
  color: string
}

export const ENTERPRISE_MODULES: EnterpriseModuleItem[] = [
  // --- 1. FREIGHT & OPERATIONS ---
  {
    id: 'shipments',
    title: 'Control Tower',
    shortLabel: 'Control Tower',
    subtitle: 'Live logistics tracking & active shipments',
    icon: Activity,
    category: 'ops',
    color: 'text-blue-500 dark:text-blue-400',
  },
  {
    id: 'daily-operations',
    title: 'Daily Operations',
    shortLabel: 'Daily Ops',
    subtitle: "Today's tasks, follow-ups, documents & EOD report",
    icon: CalendarCheck2,
    category: 'ops',
    color: 'text-rose-500 dark:text-rose-400',
  },
  {
    id: 'ocean-operations',
    title: 'Ocean Operations',
    shortLabel: 'Ocean Ops',
    subtitle: 'Sea freight, shipping lines, voyages & container tracking',
    icon: Ship,
    category: 'ops',
    color: 'text-cyan-500 dark:text-cyan-400',
  },
  {
    id: 'air-freight',
    title: 'Air Freight & AWB',
    shortLabel: 'Air Freight',
    subtitle: 'Air cargo, flight schedules, MAWB & HAWB management',
    icon: Plane,
    category: 'ops',
    color: 'text-sky-500 dark:text-sky-400',
  },
  {
    id: 'fleet-operations',
    title: 'Fleet & Trucking',
    shortLabel: 'Fleet Ops',
    subtitle: 'Truck fleet, drivers, border trips & driver rent',
    icon: Truck,
    category: 'ops',
    color: 'text-orange-500 dark:text-orange-400',
  },
  {
    id: 'warehouse-cargo',
    title: 'Warehouse & Cargo',
    shortLabel: 'Warehouse',
    subtitle: 'Cross-docking, tally sheets, receiving & cargo storage',
    icon: Boxes,
    category: 'ops',
    color: 'text-amber-500 dark:text-amber-400',
  },
  {
    id: 'customs-transit',
    title: 'Customs & Border',
    shortLabel: 'Customs',
    subtitle: 'Border station clearance, transit bonds & gate passes',
    icon: ShieldAlert,
    category: 'ops',
    color: 'text-indigo-400 dark:text-indigo-300',
  },
  {
    id: 'booking-containers',
    title: 'Booking & Containers',
    shortLabel: 'Bookings',
    subtitle: 'Shipping line booking requests & container allocations',
    icon: Package,
    category: 'ops',
    color: 'text-teal-500 dark:text-teal-400',
  },
  {
    id: 'claims-incidents',
    title: 'Claims & Incidents',
    shortLabel: 'Claims Desk',
    subtitle: 'Cargo damage, shortage, detention disputes & insurance files',
    icon: AlertTriangle,
    category: 'ops',
    color: 'text-amber-400 dark:text-amber-300',
  },

  // --- 2. FINANCE & ACCOUNTING ---
  {
    id: 'accounting',
    title: 'General Accounting',
    shortLabel: 'Accounting',
    subtitle: 'Customer & supplier ledgers, running debit & credit balances',
    icon: BookOpen,
    category: 'finance',
    color: 'text-emerald-500 dark:text-emerald-400',
  },
  {
    id: 'accounting-finance',
    title: 'Finance & Balance Sheet',
    shortLabel: 'Finance',
    subtitle: 'Profit & loss, balance sheet, trial balance & assets',
    icon: Landmark,
    category: 'finance',
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'treasury',
    title: 'Treasury & Bank / Cash',
    shortLabel: 'Treasury',
    subtitle: 'Bank accounts, cash tills, currency exchange & fund transfers',
    icon: Landmark,
    category: 'finance',
    color: 'text-emerald-600 dark:text-emerald-300',
  },
  {
    id: 'period-closing',
    title: 'Period Closing & Locks',
    shortLabel: 'Period Closing',
    subtitle: 'Fiscal period locks, reconciliations & year-end roll',
    icon: Lock,
    category: 'finance',
    color: 'text-blue-500 dark:text-blue-300',
  },
  {
    id: 'management-reports',
    title: 'Management Reporting',
    shortLabel: 'Mgmt Reports',
    subtitle: 'Executive statements, gross margin audits & commercial KPIs',
    icon: TrendingUp,
    category: 'finance',
    color: 'text-indigo-500 dark:text-indigo-400',
  },
  {
    id: 'reports',
    title: 'Report Center & P&L',
    shortLabel: 'Reports & P&L',
    subtitle: 'Exportable statements, tax reports & operational P&L',
    icon: BarChart3,
    category: 'finance',
    color: 'text-amber-500 dark:text-amber-400',
  },
  {
    id: 'analytics',
    title: 'Business Analytics',
    shortLabel: 'Analytics',
    subtitle: 'Trade lane volumes, corridor metrics & financial trends',
    icon: Compass,
    category: 'finance',
    color: 'text-teal-400 dark:text-teal-300',
  },
  {
    id: 'export-calculator',
    title: 'Transit Calculator',
    shortLabel: 'Calculator',
    subtitle: 'Multi-leg freight cost estimator & tariff calculation',
    icon: Calculator,
    category: 'finance',
    color: 'text-emerald-400 dark:text-emerald-300',
  },

  // --- 3. COMMERCIAL & SALES ---
  {
    id: 'crm-sales',
    title: 'CRM & Sales Pipeline',
    shortLabel: 'CRM & Sales',
    subtitle: 'Leads, inquiries, opportunities, Customer 360 & service desk',
    icon: Users,
    category: 'commercial',
    color: 'text-amber-500 dark:text-amber-400',
  },
  {
    id: 'rates-quotations',
    title: 'Rates & Quotations',
    shortLabel: 'Rates & Quotes',
    subtitle: 'Freight pricing engine, buy/sell rate cards & quotations',
    icon: Tag,
    category: 'commercial',
    color: 'text-indigo-400 dark:text-indigo-300',
  },
  {
    id: 'routes-locations',
    title: 'Routes & Locations',
    shortLabel: 'Routes Master',
    subtitle: 'Corridors, border stations, sea ports & airports',
    icon: Compass,
    category: 'commercial',
    color: 'text-cyan-400 dark:text-cyan-300',
  },
  {
    id: 'customer-portal-admin',
    title: 'Customer Portal Admin',
    shortLabel: 'Portal Admin',
    subtitle: 'Client login management, access controls & visibility',
    icon: Users,
    category: 'commercial',
    color: 'text-purple-400 dark:text-purple-300',
  },
  {
    id: 'shipper-portal',
    title: 'Shipper Portal View',
    shortLabel: 'Shipper Portal',
    subtitle: 'Customer self-service tracking & cargo delivery view',
    icon: Globe,
    category: 'commercial',
    color: 'text-blue-400 dark:text-blue-300',
  },

  // --- 4. COMPLIANCE, FILES & SYSTEMS ---
  {
    id: 'document-compliance',
    title: 'Document Compliance',
    shortLabel: 'Compliance',
    subtitle: 'Shipping documents, transit approvals & regulatory seals',
    icon: FileCheck2,
    category: 'system',
    color: 'text-indigo-500 dark:text-indigo-400',
  },
  {
    id: 'file-center',
    title: 'File & Attachment Center',
    shortLabel: 'Files',
    subtitle: 'Digital shipment folders & attachment document management',
    icon: FolderArchive,
    category: 'system',
    color: 'text-cyan-500 dark:text-cyan-400',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Operations',
    shortLabel: 'WhatsApp',
    subtitle: 'Client WhatsApp status dispatch, cargo alerts & chat history',
    icon: MessageSquare,
    category: 'system',
    color: 'text-green-500 dark:text-green-400',
  },
  {
    id: 'workflow',
    title: 'Workflow Engine',
    shortLabel: 'Workflow',
    subtitle: 'Shipment milestone triggers, task gates & operations engine',
    icon: Zap,
    category: 'system',
    color: 'text-amber-400 dark:text-amber-300',
  },
  {
    id: 'communications',
    title: 'Communications Center',
    shortLabel: 'Communications',
    subtitle: 'Central dispatch alerts, stakeholder messages & notices',
    icon: MessageSquare,
    category: 'system',
    color: 'text-emerald-500 dark:text-emerald-400',
  },
  {
    id: 'master-data',
    title: 'Master Data Center',
    shortLabel: 'Master Data',
    subtitle: 'Shippers, consignees, shipping lines, airlines & truckers',
    icon: Database,
    category: 'system',
    color: 'text-indigo-400 dark:text-indigo-300',
  },
  {
    id: 'audit-history',
    title: 'Audit Trail & History',
    shortLabel: 'Audit Trail',
    subtitle: 'Immutable chronological change logs & user audit history',
    icon: History,
    category: 'system',
    color: 'text-purple-500 dark:text-purple-400',
  },
  {
    id: 'data-protection',
    title: 'Data Protection & Backup',
    shortLabel: 'Backup & DR',
    subtitle: 'Local-first encrypted backups, GCS snapshots & disaster recovery',
    icon: ShieldCheck,
    category: 'system',
    color: 'text-emerald-500 dark:text-emerald-400',
  },
  {
    id: 'ai-assistant',
    title: 'Sky AI Operations Assistant',
    shortLabel: 'Ask AI',
    subtitle: 'Intelligent AI copilot for shipment ops, ledgers & audit checks',
    icon: Sparkles,
    category: 'system',
    color: 'text-purple-400 dark:text-purple-300',
  },
  {
    id: 'settings',
    title: 'System Settings',
    shortLabel: 'Settings',
    subtitle: 'Company profile, currency defaults, print layouts & user config',
    icon: Settings,
    category: 'system',
    color: 'text-slate-400 dark:text-slate-300',
  },
]

export function Header({ title, subtitle }: HeaderProps) {
  const { currentUser, logout, view, setView } = useApp()
  const previousView = useRef<typeof view>('accounts')
  const [showQuickShipment, setShowQuickShipment] = useState(false)
  const [megaSearch, setMegaSearch] = useState('')

  // BOL & Account Ledger main workspace views
  const isBolWorkspace = view === 'bol' || view === 'accounts' || view === 'companies' || view === 'ledger'

  // Identify active category and current module details
  const currentModule = useMemo(() => {
    return ENTERPRISE_MODULES.find((m) => m.id === view)
  }, [view])

  const isOpsActive = useMemo(() => {
    return ENTERPRISE_MODULES.filter((m) => m.category === 'ops').some((m) => m.id === view)
  }, [view])

  const isFinanceActive = useMemo(() => {
    return ENTERPRISE_MODULES.filter((m) => m.category === 'finance').some((m) => m.id === view)
  }, [view])

  const isCommercialActive = useMemo(() => {
    return ENTERPRISE_MODULES.filter((m) => m.category === 'commercial').some((m) => m.id === view)
  }, [view])

  const isSystemActive = useMemo(() => {
    return ENTERPRISE_MODULES.filter((m) => m.category === 'system' && m.id !== 'whatsapp' && m.id !== 'workflow' && m.id !== 'ai-assistant').some((m) => m.id === view)
  }, [view])

  // Filtered modules for Mega Menu search
  const filteredMegaModules = useMemo(() => {
    if (!megaSearch.trim()) return ENTERPRISE_MODULES
    const q = megaSearch.toLowerCase().trim()
    return ENTERPRISE_MODULES.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.shortLabel.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
    )
  }, [megaSearch])

  const handleNavigate = (modId: any) => {
    if (view === modId) return
    previousView.current = view
    setView(modId)
  }

  return (
    <header className="workspace-header sticky top-0 z-40 h-14 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 no-print select-none">
      <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between gap-1.5 sm:gap-2 px-3 sm:px-4">
        
        {/* ================================================================= */}
        {/* LEFT: Logo & Return to BOL                                        */}
        {/* ================================================================= */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            onClick={() => handleNavigate('bol')}
            title="Return to BOL Workspace"
          >
            <Image
              src="/logo.png"
              alt="AQ Companies"
              width={34}
              height={34}
              className="shrink-0 object-contain drop-shadow-xs"
              priority
            />
            <div className="hidden 2xl:block">
              <span className="block text-xs font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                {title || 'AQ Companies'}
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Logistics & BOL
              </span>
            </div>
          </div>

          {currentUser?.role !== 'shipper' && !isBolWorkspace && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2.5 text-xs font-semibold border-blue-500/30 bg-blue-50/50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/40 cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
              onClick={() => handleNavigate('bol')}
              title="Return to BOL Workspace"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-bold hidden sm:inline">Back to BOL</span>
              <span className="font-bold sm:hidden">BOL</span>
            </Button>
          )}
        </div>

        {/* ================================================================= */}
        {/* CENTER: Enterprise Categorized Navigation & All-Modules Dropdown   */}
        {/* ================================================================= */}
        {currentUser && currentUser.role !== 'shipper' && (
          <nav className="flex items-center gap-1 shrink-0">
            
            {/* ------------------------------------------------------------- */}
            {/* 1. ALL MODULES ENTERPRISE LAUNCHER (MEGA-DROPDOWN)            */}
            {/* ------------------------------------------------------------- */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 shadow-2xs shrink-0 whitespace-nowrap"
                  title="All Modules & Enterprise Suite Launcher"
                >
                  <LayoutGrid className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-extrabold hidden md:inline">Modules</span>
                  <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="w-[880px] max-w-[96vw] max-h-[82vh] overflow-hidden flex flex-col p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl z-50"
              >
                {/* Search Bar & Header inside Mega Dropdown */}
                <div className="shrink-0 mb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        Enterprise Module Launcher
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        32 Modules
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        4 Suites
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      Click any module to jump directly
                    </span>
                  </div>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search 32 enterprise modules... (e.g. ocean, invoice, claims, fleet, rates)"
                      value={megaSearch}
                      onChange={(e) => setMegaSearch(e.target.value)}
                      className="w-full pl-9 pr-14 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    {megaSearch && (
                      <button
                        type="button"
                        onClick={() => setMegaSearch('')}
                        className="absolute right-3 top-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* 4 Categorized Columns (Scrollable Area) */}
                <div className="flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    
                    {/* Column 1: Freight Operations */}
                    <div className="space-y-1.5 p-2 rounded-xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800/80">
                      <div className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 px-2 py-1">
                        <Truck className="h-3.5 w-3.5" />
                        <span>Operations</span>
                      </div>
                      {filteredMegaModules
                        .filter((m) => m.category === 'ops')
                        .map((mod) => {
                          const Icon = mod.icon
                          const isActive = view === mod.id
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => handleNavigate(mod.id)}
                              className={`w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? 'text-white' : mod.color}`} />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs truncate flex items-center justify-between">
                                  <span>{mod.title}</span>
                                  {isActive && <Check className="h-3 w-3 text-white shrink-0 ml-1" />}
                                </div>
                                <div className={`text-[10px] leading-tight truncate ${isActive ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                  {mod.subtitle}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                    </div>

                    {/* Column 2: Finance & Accounting */}
                    <div className="space-y-1.5 p-2 rounded-xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800/80">
                      <div className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-2 py-1">
                        <Landmark className="h-3.5 w-3.5" />
                        <span>Finance</span>
                      </div>
                      {filteredMegaModules
                        .filter((m) => m.category === 'finance')
                        .map((mod) => {
                          const Icon = mod.icon
                          const isActive = view === mod.id
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => handleNavigate(mod.id)}
                              className={`w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? 'text-white' : mod.color}`} />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs truncate flex items-center justify-between">
                                  <span>{mod.title}</span>
                                  {isActive && <Check className="h-3 w-3 text-white shrink-0 ml-1" />}
                                </div>
                                <div className={`text-[10px] leading-tight truncate ${isActive ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                  {mod.subtitle}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                    </div>

                    {/* Column 3: Commercial & Sales */}
                    <div className="space-y-1.5 p-2 rounded-xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800/80">
                      <div className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 px-2 py-1">
                        <Tag className="h-3.5 w-3.5" />
                        <span>Sales & CRM</span>
                      </div>
                      {filteredMegaModules
                        .filter((m) => m.category === 'commercial')
                        .map((mod) => {
                          const Icon = mod.icon
                          const isActive = view === mod.id
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => handleNavigate(mod.id)}
                              className={`w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? 'text-white' : mod.color}`} />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs truncate flex items-center justify-between">
                                  <span>{mod.title}</span>
                                  {isActive && <Check className="h-3 w-3 text-white shrink-0 ml-1" />}
                                </div>
                                <div className={`text-[10px] leading-tight truncate ${isActive ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                  {mod.subtitle}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                    </div>

                    {/* Column 4: Compliance & System */}
                    <div className="space-y-1.5 p-2 rounded-xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800/80">
                      <div className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5 px-2 py-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Docs & Tools</span>
                      </div>
                      {filteredMegaModules
                        .filter((m) => m.category === 'system')
                        .map((mod) => {
                          const Icon = mod.icon
                          const isActive = view === mod.id
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => handleNavigate(mod.id)}
                              className={`w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-purple-700 text-white shadow-xs'
                                  : 'hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? 'text-white' : mod.color}`} />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs truncate flex items-center justify-between">
                                  <span>{mod.title}</span>
                                  {isActive && <Check className="h-3 w-3 text-white shrink-0 ml-1" />}
                                </div>
                                <div className={`text-[10px] leading-tight truncate ${isActive ? 'text-purple-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                  {mod.subtitle}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                    </div>

                  </div>
                </div>

                {/* Footer bar */}
                <div className="shrink-0 pt-2.5 mt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[9px] border border-slate-200 dark:border-slate-700">⌘K</kbd> anywhere for Omni-Search</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">All systems active & synced</span>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ------------------------------------------------------------- */}
            {/* 2. FREIGHT & OPERATIONS DROPDOWN                              */}
            {/* ------------------------------------------------------------- */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    isOpsActive
                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
                  }`}
                  title="Freight & Transport Operations Suite"
                >
                  <Truck className={`h-3.5 w-3.5 shrink-0 ${isOpsActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                  <span>
                    {isOpsActive && currentModule?.category === 'ops'
                      ? currentModule.shortLabel
                      : 'Operations'}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 text-xs p-1.5 rounded-xl shadow-xl z-50">
                <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Freight & Transport Operations
                </DropdownMenuLabel>
                {ENTERPRISE_MODULES.filter((m) => m.category === 'ops').map((mod) => {
                  const Icon = mod.icon
                  const isActive = view === mod.id
                  return (
                    <DropdownMenuItem
                      key={mod.id}
                      onClick={() => handleNavigate(mod.id)}
                      className={`cursor-pointer font-medium flex items-center justify-between py-2 px-2.5 rounded-lg ${
                        isActive ? 'bg-blue-600 text-white font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : mod.color}`} />
                        <span className="truncate">{mod.title}</span>
                      </div>
                      {isActive && <Check className="h-3.5 w-3.5 text-white shrink-0" />}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ------------------------------------------------------------- */}
            {/* 3. FINANCE & ACCOUNTING DROPDOWN                              */}
            {/* ------------------------------------------------------------- */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    isFinanceActive
                      ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
                  }`}
                  title="Finance, Ledger & Accounting Suite"
                >
                  <Landmark className={`h-3.5 w-3.5 shrink-0 ${isFinanceActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                  <span>
                    {isFinanceActive && currentModule?.category === 'finance'
                      ? currentModule.shortLabel
                      : 'Finance'}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 text-xs p-1.5 rounded-xl shadow-xl z-50">
                <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Finance, Accounting & Ledgers
                </DropdownMenuLabel>
                {ENTERPRISE_MODULES.filter((m) => m.category === 'finance').map((mod) => {
                  const Icon = mod.icon
                  const isActive = view === mod.id
                  return (
                    <DropdownMenuItem
                      key={mod.id}
                      onClick={() => handleNavigate(mod.id)}
                      className={`cursor-pointer font-medium flex items-center justify-between py-2 px-2.5 rounded-lg ${
                        isActive ? 'bg-emerald-600 text-white font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : mod.color}`} />
                        <span className="truncate">{mod.title}</span>
                      </div>
                      {isActive && <Check className="h-3.5 w-3.5 text-white shrink-0" />}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ------------------------------------------------------------- */}
            {/* 4. COMMERCIAL & CRM DROPDOWN                                  */}
            {/* ------------------------------------------------------------- */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    isCommercialActive
                      ? 'bg-amber-600 text-white shadow-xs shadow-amber-500/30'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
                  }`}
                  title="Commercial, Sales Pipeline & Pricing Suite"
                >
                  <Tag className={`h-3.5 w-3.5 shrink-0 ${isCommercialActive ? 'text-white' : 'text-amber-500 dark:text-amber-400'}`} />
                  <span>
                    {isCommercialActive && currentModule?.category === 'commercial'
                      ? currentModule.shortLabel
                      : 'Sales & CRM'}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 text-xs p-1.5 rounded-xl shadow-xl z-50">
                <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Commercial, CRM & Rates
                </DropdownMenuLabel>
                {ENTERPRISE_MODULES.filter((m) => m.category === 'commercial').map((mod) => {
                  const Icon = mod.icon
                  const isActive = view === mod.id
                  return (
                    <DropdownMenuItem
                      key={mod.id}
                      onClick={() => handleNavigate(mod.id)}
                      className={`cursor-pointer font-medium flex items-center justify-between py-2 px-2.5 rounded-lg ${
                        isActive ? 'bg-amber-600 text-white font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : mod.color}`} />
                        <span className="truncate">{mod.title}</span>
                      </div>
                      {isActive && <Check className="h-3.5 w-3.5 text-white shrink-0" />}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ------------------------------------------------------------- */}
            {/* 5. COMPLIANCE & SYSTEM DROPDOWN                               */}
            {/* ------------------------------------------------------------- */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    isSystemActive
                      ? 'bg-purple-700 text-white shadow-xs shadow-purple-500/30'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
                  }`}
                  title="Compliance, Documents & System Tools"
                >
                  <FileCheck2 className={`h-3.5 w-3.5 shrink-0 ${isSystemActive ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
                  <span>
                    {isSystemActive && currentModule?.category === 'system'
                      ? currentModule.shortLabel
                      : 'Docs & Tools'}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 text-xs p-1.5 rounded-xl shadow-xl z-50">
                <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Compliance, Tools & Administration
                </DropdownMenuLabel>
                {ENTERPRISE_MODULES.filter((m) => m.category === 'system').map((mod) => {
                  const Icon = mod.icon
                  const isActive = view === mod.id
                  return (
                    <DropdownMenuItem
                      key={mod.id}
                      onClick={() => handleNavigate(mod.id)}
                      className={`cursor-pointer font-medium flex items-center justify-between py-2 px-2.5 rounded-lg ${
                        isActive ? 'bg-purple-700 text-white font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : mod.color}`} />
                        <span className="truncate">{mod.title}</span>
                      </div>
                      {isActive && <Check className="h-3.5 w-3.5 text-white shrink-0" />}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Direct Ask AI Pill */}
            <button
              type="button"
              onClick={() => handleNavigate('ai-assistant')}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                view === 'ai-assistant'
                  ? 'bg-purple-700 text-white shadow-xs shadow-purple-500/30'
                  : 'text-purple-700 hover:text-purple-950 hover:bg-purple-50 dark:text-purple-300 dark:hover:text-white dark:hover:bg-purple-950/40'
              }`}
              title="Sky AI Operations Assistant"
            >
              <Sparkles className={`h-3.5 w-3.5 shrink-0 ${view === 'ai-assistant' ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
              <span className="hidden xl:inline">Ask AI</span>
            </button>

            {/* 2XL Shortcut Buttons for High-Frequency Ops */}
            <button
              type="button"
              onMouseEnter={() => preloadModule('whatsapp', () => import('@/components/whatsapp/whatsapp-operations-view'))}
              onClick={() => handleNavigate('whatsapp')}
              className={`hidden 2xl:flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                view === 'whatsapp'
                  ? 'bg-green-600 text-white shadow-xs shadow-green-500/30'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
              title="WhatsApp Live Operations Center"
            >
              <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${view === 'whatsapp' ? 'text-white' : 'text-green-600 dark:text-green-400'}`} />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onMouseEnter={() => preloadModule('crm-sales', () => import('@/components/crm/crm-sales-center'))}
              onClick={() => handleNavigate('crm-sales')}
              className={`hidden 2xl:flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                view === 'crm-sales'
                  ? 'bg-amber-600 text-white shadow-xs shadow-amber-500/30'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
              title="CRM, Sales Pipeline & Customer Service Desk"
            >
              <Users className={`h-3.5 w-3.5 shrink-0 ${view === 'crm-sales' ? 'text-white' : 'text-amber-500'}`} />
              <span>CRM & Sales</span>
            </button>

            <button
              type="button"
              onMouseEnter={() => preloadModule('workflow', () => import('@/components/workflow/workflow-workspace'))}
              onClick={() => handleNavigate('workflow')}
              className={`hidden 2xl:flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                view === 'workflow'
                  ? 'bg-amber-600 text-white shadow-xs shadow-amber-500/30'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
              title="Workflow Operations Engine"
            >
              <Zap className={`h-3.5 w-3.5 shrink-0 ${view === 'workflow' ? 'text-white fill-white' : 'text-amber-500 fill-amber-500'}`} />
              <span>Workflow</span>
            </button>

          </nav>
        )}

        {/* ================================================================= */}
        {/* RIGHT: Quick Tools, Utilities, User Profile & System Status       */}
        {/* ================================================================= */}
        {currentUser && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Global Omni Search */}
            <div className="hidden md:block shrink-0">
              <GlobalSearch className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-500 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700/80 transition-all rounded-lg border border-slate-200 dark:border-slate-700 w-28 sm:w-36 md:w-40 lg:w-44 xl:w-52 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs group shrink-0" />
            </div>

            {/* Quick New Shipment Button */}
            <Button
              variant="default"
              size="sm"
              className="h-8 gap-1 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs cursor-pointer px-2.5 shrink-0 whitespace-nowrap"
              onClick={() => setShowQuickShipment(true)}
              title="Create Fast Shipment"
            >
              <Package className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">New</span>
            </Button>
            <QuickShipmentModal
              open={showQuickShipment}
              onOpenChange={setShowQuickShipment}
              onSaved={() => handleNavigate('bol')}
            />

            {/* Server Status Pill */}
            <div className="hidden lg:block shrink-0">
              <ServerStatusPill onOpenSettings={() => handleNavigate('settings')} />
            </div>

            {/* Cloud Sync Button */}
            <div className="shrink-0">
              <HeaderCloudSyncButton onOpenSettings={() => handleNavigate('settings')} />
            </div>

            {/* Notification Bell */}
            <div className="shrink-0">
              <NotificationBell
                onOpenCenter={() => handleNavigate('communications')}
                onOpenSettings={() => handleNavigate('settings')}
              />
            </div>

            {/* Theme Toggle */}
            <div className="shrink-0">
              <ThemeToggle />
            </div>

            {/* User Profile Executive Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  title={`${currentUser.name} (${currentUser.role})`}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white shadow-2xs shrink-0"
                  >
                    {currentUser.name.trim().slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden xl:inline text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[80px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50">
                <DropdownMenuLabel className="font-normal p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-bold leading-none text-slate-900 dark:text-slate-100">{currentUser.name}</p>
                    <p className="text-[10px] leading-none text-slate-500 capitalize">{currentUser.role} • Sky Ariana</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigate('settings')} className="cursor-pointer gap-2 py-2">
                  <Settings className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs font-medium">System Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate('audit-history')} className="cursor-pointer gap-2 py-2">
                  <History className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-xs font-medium">Audit History</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate('data-protection')} className="cursor-pointer gap-2 py-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-medium">Backup & DR</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer gap-2 py-2 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/40">
                  <LogOut className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-semibold">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick Standalone Settings Button (Visible on XL screens) */}
            <div className="hidden xl:block shrink-0">
              <Button
                variant={view === 'settings' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer shrink-0"
                onClick={() => handleNavigate('settings')}
                title="System Settings"
              >
                {view === 'settings' ? <ArrowLeft className="h-3.5 w-3.5" /> : <Settings className="h-3.5 w-3.5" />}
              </Button>
            </div>

            {/* Quick Standalone Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer shrink-0"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
