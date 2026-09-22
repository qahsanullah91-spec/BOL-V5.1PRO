"use client"

import Image from 'next/image'
import { useRef, useState } from 'react'
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
  MoreHorizontal,
  BarChart3,
  Calculator,
  Compass,
  FileText,
  Database,
  Zap,
  ShieldCheck,
  History,
  CalendarCheck2,
} from "lucide-react"
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import { HeaderCloudSyncButton } from '@/components/sync/header-cloud-sync-button'
import { ServerStatusPill } from '@/components/server/server-status-pill'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { GlobalSearch } from '@/components/global-search'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  showBack?: boolean
  title?: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { currentUser, logout, view, setView } = useApp()
  const previousView = useRef<typeof view>('accounts')
  const [showQuickShipment, setShowQuickShipment] = useState(false)

  const isMoreActive =
    view === 'daily-operations' ||
    view === 'customer-portal-admin' ||
    view === 'accounting-finance' ||
    view === 'reports' ||
      view === 'master-data' ||
    view === 'analytics' ||
    view === 'export-calculator' ||
    view === 'shipper-portal' ||
    view === 'data-protection' ||
    view === 'audit-history'

  return (
    <header className="workspace-header sticky top-0 z-40 h-14 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 no-print select-none">
      <div className="mx-auto flex h-full max-w-[1850px] items-center justify-between gap-2 px-3 sm:px-4">
        
        {/* ================================================================= */}
        {/* LEFT: Logo & Workspace Identity                                   */}
        {/* ================================================================= */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            onClick={() => setView('bol')}
            title="Return to BOL Workspace"
          >
            <Image
              src="/logo.png"
              alt="Sky Ariana"
              width={34}
              height={34}
              className="shrink-0 object-contain drop-shadow-xs"
              priority
            />
            <div className="hidden xl:block">
              <span className="block text-xs font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                {title || 'Sky Ariana'}
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Logistics & BOL
              </span>
            </div>
          </div>

          {currentUser?.role !== 'shipper' && view !== 'bol' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
              onClick={() => setView('bol')}
              title="Return to BOL Workspace"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">Back to BOL</span>
            </Button>
          )}
        </div>

        {/* ================================================================= */}
        {/* CENTER: Primary Navigation Tabs                                   */}
        {/* ================================================================= */}
        {currentUser && currentUser.role !== 'shipper' && (
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {/* 1. Control Tower */}
            <button
              type="button"
              onClick={() => {
                if (view === 'shipments') setView(previousView.current || 'bol')
                else {
                  previousView.current = view
                  setView('shipments')
                }
              }}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                view === 'shipments'
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
            >
              <Activity className={`h-3.5 w-3.5 ${view === 'shipments' ? 'text-white animate-pulse' : 'text-blue-600 dark:text-blue-400'}`} />
              <span>Control Tower</span>
            </button>

            {/* Daily Operations */}
            <button
              type="button"
              onClick={() => {
                if (view === 'daily-operations') setView(previousView.current || 'bol')
                else {
                  previousView.current = view
                  setView('daily-operations')
                }
              }}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                view === 'daily-operations'
                  ? 'bg-rose-600 text-white shadow-xs shadow-rose-500/30'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
              title="Daily Operations Center: Today's tasks, follow-ups, documents & EOD report"
            >
              <CalendarCheck2 className={`h-3.5 w-3.5 ${view === 'daily-operations' ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`} />
              <span>Daily Ops</span>
            </button>

            {/* 2. Accounting Workspace */}
            <button
              type="button"
              onClick={() => {
                if (view === 'accounting') setView(previousView.current || 'bol')
                else {
                  previousView.current = view
                  setView('accounting')
                }
              }}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                view === 'accounting'
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className={`h-3.5 w-3.5 ${view === 'accounting' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span>Accounting</span>
            </button>

            {/* 3. Compliance Center */}
            <button
              type="button"
              onClick={() => {
                if (view === 'document-compliance') setView(previousView.current || 'bol')
                else {
                  previousView.current = view
                  setView('document-compliance')
                }
              }}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                view === 'document-compliance'
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
            >
              <FileCheck2 className={`h-3.5 w-3.5 ${view === 'document-compliance' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <span>Compliance</span>
            </button>

            {/* 4. WhatsApp Operations */}
            <button
              type="button"
              onClick={() => {
                if (view === 'whatsapp') setView(previousView.current || 'bol')
                else {
                  previousView.current = view
                  setView('whatsapp')
                }
              }}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                view === 'whatsapp'
                  ? 'bg-green-600 text-white shadow-xs shadow-green-500/30'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className={`h-3.5 w-3.5 ${view === 'whatsapp' ? 'text-white' : 'text-green-600 dark:text-green-400'}`} />
              <span className="hidden md:inline">WhatsApp</span>
            </button>

            {/* 5. Workflow Operations Engine */}
            <button
              type="button"
              onClick={() => {
                if (view === 'workflow') setView(previousView.current || 'bol')
                else {
                  previousView.current = view
                  setView('workflow')
                }
              }}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                view === 'workflow'
                  ? 'bg-amber-600 text-white shadow-xs shadow-amber-500/30'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
            >
              <Zap className={`h-3.5 w-3.5 ${view === 'workflow' ? 'text-white fill-white' : 'text-amber-500 fill-amber-500'}`} />
              <span>Workflow</span>
            </button>

            {/* 6. More Modules Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1 h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isMoreActive
                      ? 'bg-slate-200 dark:bg-slate-700 text-foreground'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
                  }`}
                  title="Additional Modules"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="hidden lg:inline text-[11px]">More</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 text-xs p-1">
                <DropdownMenuItem
                  className="cursor-pointer font-medium text-rose-600 dark:text-rose-400"
                  onClick={() => { previousView.current = view; setView('daily-operations') }}
                >
                  <CalendarCheck2 className="h-3.5 w-3.5 mr-2 text-rose-600" />
                  <span className="font-bold">Daily Operations Center</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer font-medium"
                  onClick={() => { previousView.current = view; setView('customer-portal-admin') }}
                >
                  <Users className="h-3.5 w-3.5 mr-2 text-purple-600" />
                  <span>Customer Portal Admin</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer font-medium"
                  onClick={() => { previousView.current = view; setView('accounting-finance') }}
                >
                  <Landmark className="h-3.5 w-3.5 mr-2 text-blue-600" />
                  <span>Finance & Ledger Center</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer font-medium"
                  onClick={() => { previousView.current = view; setView('reports') }}
                >
                  <BarChart3 className="h-3.5 w-3.5 mr-2 text-amber-600" />
                  <span>Report Center & P&L</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer font-medium"
                  onClick={() => { previousView.current = view; setView('analytics') }}
                >
                  <Compass className="h-3.5 w-3.5 mr-2 text-teal-600" />
                  <span>Business Analytics</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer font-medium"
                  onClick={() => { previousView.current = view; setView('export-calculator') }}
                >
                  <Calculator className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                  <span>Transit & Quote Calculator</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer font-medium"
                  onClick={() => { previousView.current = view; setView('master-data') }}
                >
                  <Database className="h-3.5 w-3.5 mr-2 text-indigo-600" />
                  <span>Master Data Center</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer font-medium"
                  onClick={() => { previousView.current = view; setView('data-protection') }}
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                  <span>Data Protection & Recovery</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer font-medium"
                  onClick={() => { previousView.current = view; setView('audit-history') }}
                >
                  <History className="h-3.5 w-3.5 mr-2 text-indigo-600" />
                  <span>Audit Trail & History</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer font-medium"
                  onClick={() => { previousView.current = view; setView('settings') }}
                >
                  <Settings className="h-3.5 w-3.5 mr-2 text-slate-600" />
                  <span>System Settings</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        )}

        {/* ================================================================= */}
        {/* RIGHT: Quick Tools, Utilities, User Profile & System Status       */}
        {/* ================================================================= */}
        {currentUser && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Global Omni Search */}
            <div className="hidden md:block">
              <GlobalSearch />
            </div>

            {/* Quick New Shipment Button */}
            <Button
              variant="default"
              size="sm"
              className="h-8 gap-1 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs cursor-pointer px-2.5"
              onClick={() => setShowQuickShipment(true)}
              title="Create Fast Shipment"
            >
              <Package className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
            </Button>
            <QuickShipmentModal
              open={showQuickShipment}
              onOpenChange={setShowQuickShipment}
              onSaved={() => setView('bol')}
            />

            {/* Server Status Pill */}
            <div className="hidden lg:block">
              <ServerStatusPill onOpenSettings={() => setView('settings')} />
            </div>

            {/* Cloud Sync Button */}
            <HeaderCloudSyncButton onOpenSettings={() => setView('settings')} />

            {/* Notification Bell */}
            <NotificationBell
              onOpenCenter={() => setView('notifications')}
              onOpenSettings={() => setView('settings')}
            />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Pill */}
            <div
              className="flex items-center gap-1.5 pl-1 pr-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60"
              title={`${currentUser.name} (${currentUser.role})`}
            >
              <span
                aria-hidden="true"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white"
              >
                {currentUser.name.trim().slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden xl:inline text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                {currentUser.name.split(' ')[0]}
              </span>
            </div>

            {/* Settings Icon Button */}
            <Button
              variant={view === 'settings' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
              onClick={() => {
                if (view === 'settings') setView(previousView.current || 'bol')
                else {
                  previousView.current = view
                  setView('settings')
                }
              }}
              title="System Settings"
            >
              {view === 'settings' ? <ArrowLeft className="h-3.5 w-3.5" /> : <Settings className="h-3.5 w-3.5" />}
            </Button>

            {/* Logout Icon Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
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
