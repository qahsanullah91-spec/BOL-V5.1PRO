"use client"

import '@/lib/polyfills'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { safeLazy } from '@/lib/safe-lazy'
import { AppProvider, useApp } from '@/lib/app-context'
import { Header } from '@/components/header'
import { LoginScreen } from '@/components/login-screen'
import { ErrorBoundary } from '@/components/error-boundary'
import { toast } from 'sonner'
import { smartMergeLedgerRecords } from '@/lib/services/ledger-sync-utils'

function ViewLoadingSkeleton() {
  return (
    <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4 animate-in fade-in duration-100">
      <div className="w-12 h-12 rounded-2xl bg-blue-900/20 border border-blue-500/30 flex items-center justify-center animate-pulse">
        <img src="/logo.png" alt="Sky Ariana" className="w-8 h-8 object-contain" />
      </div>
      <div className="h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
      </div>
      <p className="text-[11px] font-bold text-slate-400">Loading module...</p>
    </div>
  )
}

const BOLEditor = dynamic(safeLazy(() => import('@/components/bill-of-lading/bol-editor').then(m => m.BOLEditor)), { loading: ViewLoadingSkeleton })
const AccountsView = dynamic(safeLazy(() => import('@/components/accounts-view').then(m => m.AccountsView)), { loading: ViewLoadingSkeleton })
const CompaniesView = dynamic(safeLazy(() => import('@/components/companies-view').then(m => m.CompaniesView)), { loading: ViewLoadingSkeleton })
const LedgerView = dynamic(safeLazy(() => import('@/components/ledger-view').then(m => m.LedgerView)), { loading: ViewLoadingSkeleton })

const MasterDataView = dynamic(safeLazy(() => import('@/components/master-data/master-data-view').then(m => m.MasterDataView)), { loading: ViewLoadingSkeleton })
const SettingsView = dynamic(safeLazy(() => import('@/components/settings-view').then(m => m.SettingsView)), { loading: ViewLoadingSkeleton })
const ShipmentOperationsDashboard = dynamic(safeLazy(() => import('@/components/shipments/shipment-operations-dashboard').then(m => m.ShipmentOperationsDashboard)), { loading: ViewLoadingSkeleton })
const ControlTowerView = dynamic(safeLazy(() => import('@/components/control-tower/control-tower-view').then(m => m.ControlTowerView)), { loading: ViewLoadingSkeleton })
const ShipperDashboardView = dynamic(safeLazy(() => import('@/components/shipper-dashboard').then(m => m.ShipperDashboardView)), { loading: ViewLoadingSkeleton })
const InvoiceView = dynamic(safeLazy(() => import('@/components/invoice-view').then(m => m.InvoiceView)), { loading: ViewLoadingSkeleton })
const ReportsView = dynamic(safeLazy(() => import('@/components/reports-view').then(m => m.ReportsView)), { loading: ViewLoadingSkeleton })
const AnalyticsDashboardView = dynamic(safeLazy(() => import('@/components/analytics-dashboard-view').then(m => m.AnalyticsDashboardView)), { loading: ViewLoadingSkeleton })
const ExportCalculatorView = dynamic(safeLazy(() => import('@/components/export-calculator-view').then(m => m.ExportCalculatorView)), { loading: ViewLoadingSkeleton })
const WhatsAppOperationsView = dynamic(safeLazy(() => import('@/components/whatsapp/whatsapp-operations-view').then(m => m.WhatsAppOperationsView)), { loading: ViewLoadingSkeleton })
const AdminCustomerPortalView = dynamic(safeLazy(() => import('@/components/customer-portal/admin-customer-portal-view').then(m => m.AdminCustomerPortalView)), { loading: ViewLoadingSkeleton })
const DocumentComplianceWorkspace = dynamic(safeLazy(() => import('@/components/document-compliance/document-compliance-workspace').then(m => m.DocumentComplianceWorkspace)), { loading: ViewLoadingSkeleton })
const CustomerPortalView = dynamic(safeLazy(() => import('@/components/customer-portal/customer-portal-view').then(m => m.CustomerPortalView)), { loading: ViewLoadingSkeleton })
const AccountingWorkspace = dynamic(safeLazy(() => import('@/components/accounting/accounting-workspace').then(m => m.AccountingWorkspace)), { loading: ViewLoadingSkeleton })
const AccountingFinanceView = dynamic(safeLazy(() => import('@/components/finance/accounting-finance-view').then(m => m.AccountingFinanceView)), { loading: ViewLoadingSkeleton })
const WorkflowWorkspace = dynamic(safeLazy(() => import('@/components/workflow/workflow-workspace').then(m => m.WorkflowWorkspace)), { loading: ViewLoadingSkeleton })
const NotificationWorkspace = dynamic(safeLazy(() => import('@/components/notifications/notification-workspace').then(m => m.NotificationWorkspace)), { loading: ViewLoadingSkeleton })
const DataProtectionCenter = dynamic(safeLazy(() => import('@/components/data-protection/data-protection-center').then(m => m.DataProtectionCenter)), { loading: ViewLoadingSkeleton })
const AuditTrailCenter = dynamic(safeLazy(() => import('@/components/audit/audit-trail-center').then(m => m.AuditTrailCenter)), { loading: ViewLoadingSkeleton })
const DailyOperationsCenter = dynamic(safeLazy(() => import('@/components/daily-operations/daily-operations-center').then(m => m.DailyOperationsCenter)), { loading: ViewLoadingSkeleton })
import type { CustomerPortalSession } from '@/lib/types/customer-portal'

function MainContent() {
  const { view, setView, accounts, selectAccount, selectCompany, isAuthenticated, currentUser, currentAccount, currentCompany } = useApp()
  const [previewSession, setPreviewSession] = useState<CustomerPortalSession | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search)
      const syncCode = searchParams.get("sync") || searchParams.get("sync_code")
      if (syncCode) {
        const toastId = toast.loading(`Connecting & syncing documents for ${syncCode}...`)
        const performSync = async () => {
          try {
            let data: any = null
            try {
              const res = await fetch(`/api/sync?code=${encodeURIComponent(syncCode)}`)
              if (res.ok) {
                const body = await res.json()
                data = body.data || body
              }
            } catch (e) {}



            if (data && Array.isArray(data.documents) && data.documents.length > 0) {
              const storedLocal1 = window.localStorage.getItem("sky-bol-browser-documents")
              const storedLocal2 = window.localStorage.getItem("skybol:saved-documents")
              const storedLocal3 = window.localStorage.getItem("skybol:backup-documents")
              const list1: any[] = storedLocal1 ? JSON.parse(storedLocal1) : []
              const list2: any[] = storedLocal2 ? JSON.parse(storedLocal2) : []
              const list3: any[] = storedLocal3 ? JSON.parse(storedLocal3) : []

              const mergedMap = new Map<string, any>()
              for (const d of data.documents) {
                const k = d.bol_number || d.id
                if (k) mergedMap.set(k, d)
              }
              for (const d of [...list1, ...list2, ...list3]) {
                const k = d.bol_number || d.id
                if (k && !mergedMap.has(k)) mergedMap.set(k, d)
              }

              const allMerged = Array.from(mergedMap.values()).filter((d: any) => {
                const s = (d.shipper_name || "").trim().toLowerCase()
                const hasShipper = s !== "" && s !== "no shipper" && s !== "no-shipper" && s !== "none"
                const q = (d.number_of_packages || "").trim().toLowerCase()
                const hasPkg = q !== "" && q !== "0" && q !== "0-ctns" && q !== "0 ctns"
                const nw = (d.net_weight || "").trim()
                const gw = (d.gross_weight || "").trim()
                const val = (d.goods_value || "").trim()
                const cName = (d.consignee_name || "").trim().toLowerCase()
                const hasConsignee = cName !== "" && cName !== "no consignee"
                const hasDesc = (d.cargo_description || "").replace(/[^\w\s\u0600-\u06FF]/g, "").trim().length > 5
                return hasShipper || hasPkg || nw !== "" || gw !== "" || val !== "" || (hasConsignee && hasDesc)
              })
              const jsonStr = JSON.stringify(allMerged)
              window.localStorage.setItem("sky-bol-browser-documents", jsonStr)
              window.localStorage.setItem("skybol:saved-documents", jsonStr)
              window.localStorage.setItem("skybol:backup-documents", jsonStr)

              if (Array.isArray(data.customCompanies || data.accounts)) {
                const incoming = (data.customCompanies || data.accounts) as string[]
                const raw = window.localStorage.getItem("skybol:account-custom-companies")
                const cur = raw ? JSON.parse(raw) : []
                window.localStorage.setItem("skybol:account-custom-companies", JSON.stringify(Array.from(new Set([...cur, ...incoming]))))
              }
              if (data.ledgerRecords) {
                const raw = window.localStorage.getItem("skybol:account-ledgers")
                const cur = raw ? JSON.parse(raw) : {}
                const merged = smartMergeLedgerRecords(data.ledgerRecords, cur)
                window.localStorage.setItem("skybol:account-ledgers", JSON.stringify(merged))
              }
              if (data.companySettings) {
                window.localStorage.setItem("skybol:company-settings", JSON.stringify(data.companySettings))
                window.localStorage.setItem("skybol:pdf-company-settings", JSON.stringify(data.companySettings))
              }

              window.dispatchEvent(new CustomEvent("skybol:documents-updated", { detail: {} }))
              window.dispatchEvent(new CustomEvent("skybol:account-ledger-updated", { detail: {} }))

              toast.success(`🎉 Synced ${allMerged.length} BOLs successfully to this device!`, { id: toastId })
              
              const cleanUrl = window.location.pathname
              window.history.replaceState({}, document.title, cleanUrl)
            } else {
              toast.error("Could not locate documents for this sync link.", { id: toastId })
            }
          } catch (e) {
            toast.error("Cloud sync connection error.", { id: toastId })
          }
        }
        performSync()
      } else {
        // Automatic master database hydration for all devices
        const autoHydrateAllDevices = async () => {
          try {
            const raw1 = window.localStorage.getItem("skybol:saved-documents")
            const raw2 = window.localStorage.getItem("sky-bol-browser-documents")
            const docs1 = raw1 ? JSON.parse(raw1) : []
            const docs2 = raw2 ? JSON.parse(raw2) : []
            const localCount = Math.max(docs1.length, docs2.length)

            const res = await fetch("/api/sync", { cache: "no-store" })
            if (res.ok) {
              const body = await res.json()
              const data = body.data || body
              if (Array.isArray(data.documents) && data.documents.length > 0) {
                // If local storage has documents, merge preserving newest records and never dropping newly created BOLs
                const mergedMap = new Map<string, any>()
                const addOrMerge = (d: any) => {
                  const k = (d.bol_number || d.id || "").trim()
                  if (!k) return
                  const existing = mergedMap.get(k)
                  if (!existing) {
                    mergedMap.set(k, d)
                  } else {
                    const timeExisting = new Date(existing.updated_at || existing.created_at || existing.issue_date || 0).getTime()
                    const timeNew = new Date(d.updated_at || d.created_at || d.issue_date || 0).getTime()
                    if (timeNew >= timeExisting) {
                      mergedMap.set(k, { ...existing, ...d })
                    }
                  }
                }

                for (const d of data.documents) addOrMerge(d)
                for (const d of [...docs1, ...docs2]) addOrMerge(d)

                const allMerged = Array.from(mergedMap.values()).filter((d: any) => {
                  const s = (d.shipper_name || "").trim().toLowerCase()
                  const hasShipper = s !== "" && s !== "no shipper" && s !== "no-shipper" && s !== "none"
                  const hasBol = Boolean(d.bol_number && String(d.bol_number).trim().length > 3)
                  const q = (d.number_of_packages || "").trim().toLowerCase()
                  const hasPkg = q !== "" && q !== "0" && q !== "0-ctns" && q !== "0 ctns"
                  const nw = (d.net_weight || "").trim()
                  const gw = (d.gross_weight || "").trim()
                  const val = (d.goods_value || "").trim()
                  const cName = (d.consignee_name || "").trim().toLowerCase()
                  const hasConsignee = cName !== "" && cName !== "no consignee"
                  const hasDesc = (d.cargo_description || "").replace(/[^\w\s\u0600-\u06FF]/g, "").trim().length > 3
                  const hasDriver = Boolean((d.driver_name || "").trim() || (d.driver_rent || "").trim() || (d.truck_number || "").trim())
                  return hasShipper || hasBol || hasPkg || nw !== "" || gw !== "" || val !== "" || hasConsignee || hasDesc || hasDriver
                })
                const jsonStr = JSON.stringify(allMerged)
                window.localStorage.setItem("sky-bol-browser-documents", jsonStr)
                window.localStorage.setItem("skybol:saved-documents", jsonStr)
                window.localStorage.setItem("skybol:backup-documents", jsonStr)

                if (Array.isArray(data.customCompanies || data.accounts)) {
                  const incoming = (data.customCompanies || data.accounts) as string[]
                  const curRaw = window.localStorage.getItem("skybol:account-custom-companies")
                  const cur = curRaw ? JSON.parse(curRaw) : []
                  window.localStorage.setItem("skybol:account-custom-companies", JSON.stringify(Array.from(new Set([...cur, ...incoming]))))
                }
                if (data.ledgerRecords) {
                  const curRaw = window.localStorage.getItem("skybol:account-ledgers")
                  const cur = curRaw ? JSON.parse(curRaw) : {}
                  const merged = smartMergeLedgerRecords(data.ledgerRecords, cur)
                  window.localStorage.setItem("skybol:account-ledgers", JSON.stringify(merged))
                }
                if (data.companySettings && !window.localStorage.getItem("skybol:company-settings")) {
                  window.localStorage.setItem("skybol:company-settings", JSON.stringify(data.companySettings))
                  window.localStorage.setItem("skybol:pdf-company-settings", JSON.stringify(data.companySettings))
                }

                window.dispatchEvent(new CustomEvent("skybol:documents-updated", { detail: {} }))
                window.dispatchEvent(new CustomEvent("skybol:account-ledger-updated", { detail: {} }))
              }
            }
          } catch (e) {}
        }
        void autoHydrateAllDevices()
      }
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  const ledgerPanel = currentAccount && currentCompany && view !== 'accounts' && view !== 'companies'
    ? <LedgerView />
    : currentAccount && view !== 'accounts'
      ? <CompaniesView />
      : <AccountsView />

  const handlePreviewCustomer = async (customerId: string) => {
    try {
      const res = await fetch("/api/portal/admin/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, adminName: currentUser?.name || "Administrator" }),
      })
      const data = await res.json()
      if (res.ok && data.session) {
        setPreviewSession(data.session)
        setView('customer-portal')
      } else {
        toast.error("Failed to generate preview session")
      }
    } catch {
      toast.error("Connection error")
    }
  }

  const isShipper = currentUser?.role === 'shipper' || view === 'shipper-portal'
  const isStandaloneView =
    isShipper ||
    view === 'settings' ||
    view === 'shipments' ||
    view === 'invoice' ||
    view === 'invoice-pad' ||
    view === 'reports' ||
    view === 'analytics' ||
    view === 'export-calculator' ||
    view === 'whatsapp' ||
    view === 'customer-portal-admin' ||
    view === 'customer-portal' ||
    view === 'accounting' ||
    view === 'document-compliance' ||
    view === 'accounting-finance' ||
    view === 'master-data' ||
    view === 'workflow' ||
    view === 'notifications' ||
    view === 'data-protection' ||
    view === 'audit-history'

  return (
    <div className="liquid-workspace min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 min-w-0">
        {isShipper ? (
          <div key="shipper-portal" className="animate-page-crossfade">
            <ShipperDashboardView />
          </div>
        ) : (
          <>
            <div className={isStandaloneView ? 'hidden' : 'animate-page-crossfade'}>
              <BOLEditor accountLedgerPanel={ledgerPanel} />
            </div>
            {view === 'settings' && (
              <div key="settings" className="animate-page-crossfade">
                <SettingsView />
              </div>
            )}
            {view === 'document-compliance' && (
              <div key="document-compliance" className="animate-page-crossfade">
                <DocumentComplianceWorkspace />
              </div>
            )}
            {view === 'shipments' && (
              <div key="shipments" className="animate-page-crossfade">
                <ControlTowerView
                  onOpenBol={(bolNumber?: string) => {
                    setView('bol')
                  }}
                  onOpenLedger={(accountName?: string) => {
                    if (accountName) {
                      const foundAccount = accounts.find((a) => a.name.toLowerCase() === accountName.toLowerCase())
                      if (foundAccount) {
                        selectAccount(foundAccount)
                        if (foundAccount.companies && foundAccount.companies.length > 0) {
                          selectCompany(foundAccount.companies[0])
                        }
                      }
                    }
                    setView('ledger')
                  }}
                  onOpenOperationsReport={() => {
                    setView('reports')
                  }}
                />
              </div>
            )}
            {(view === 'invoice' || view === 'invoice-pad') && (
              <div key={view} className="animate-page-crossfade">
                <InvoiceView />
              </div>
            )}
            {view === 'reports' && (
              <div key="reports" className="animate-page-crossfade">
                <ReportsView />
              </div>
            )}
            {view === 'analytics' && (
              <div key="analytics" className="animate-page-crossfade">
                <AnalyticsDashboardView />
              </div>
            )}
            {view === 'export-calculator' && (
              <div key="export-calculator" className="animate-page-crossfade">
                <ExportCalculatorView />
              </div>
            )}
            {view === 'whatsapp' && (
              <div key="whatsapp" className="animate-page-crossfade">
                <WhatsAppOperationsView
                  onOpenBol={() => setView('bol')}
                  onOpenLedger={(accountName?: string) => {
                    if (accountName) {
                      const foundAccount = accounts.find((a) => a.name.toLowerCase() === accountName.toLowerCase())
                      if (foundAccount) {
                        selectAccount(foundAccount)
                        if (foundAccount.companies && foundAccount.companies.length > 0) {
                          selectCompany(foundAccount.companies[0])
                        }
                      }
                    }
                    setView('ledger')
                  }}
                />
              </div>
            )}
            {view === 'customer-portal-admin' && (
              <div key="customer-portal-admin" className="animate-page-crossfade">
                <AdminCustomerPortalView onPreviewCustomer={handlePreviewCustomer} />
              </div>
            )}
            {view === 'accounting' && (
              <div key="accounting" className="animate-page-crossfade">
                <AccountingWorkspace />
              </div>
            )}
            {view === 'accounting-finance' && (
              <div key="accounting-finance" className="animate-page-crossfade">
                <AccountingFinanceView />
              </div>
            )}
            {view === 'master-data' && (
              <div key="master-data" className="animate-page-crossfade">
                <MasterDataView />
              </div>
            )}
            {view === 'workflow' && (
              <div key="workflow" className="animate-page-crossfade">
                <WorkflowWorkspace />
              </div>
            )}
            {view === 'notifications' && (
              <div key="notifications" className="animate-page-crossfade">
                <NotificationWorkspace />
              </div>
            )}
            {view === 'data-protection' && (
              <div key="data-protection" className="animate-page-crossfade">
                <DataProtectionCenter />
              </div>
            )}
            {view === 'audit-history' && (
              <div key="audit-history" className="animate-page-crossfade">
                <AuditTrailCenter />
              </div>
            )}
            {view === 'daily-operations' && (
              <div key="daily-operations" className="animate-page-crossfade">
                <DailyOperationsCenter />
              </div>
            )}
            {view === 'customer-portal' && previewSession && (
              <div key="customer-portal-preview" className="animate-page-crossfade">
                <CustomerPortalView
                  session={previewSession}
                  onSignOut={() => {
                    setPreviewSession(null)
                    setView('customer-portal-admin')
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

import { FirstRunWizard } from '@/components/restore/first-run-wizard'

export default function Home() {
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null)
  const [hasGAuth, setHasGAuth] = useState<boolean>(false)

  useEffect(() => {
    // Check if the user has explicitly bypassed first run in local storage
    if (typeof window !== "undefined" && window.localStorage.getItem("skybol:first-run-completed") === "true") {
      setIsFirstRun(false)
      return
    }

    const checkSystemStatus = async () => {
      try {
        const res = await fetch("/api/system/status")
        if (res.ok) {
          const data = await res.json()
          setIsFirstRun(data.isFirstRun)
          setHasGAuth(data.hasGoogleDriveAuth)
        } else {
          setIsFirstRun(false) // fallback
        }
      } catch (e) {
        setIsFirstRun(false)
      }
    }
    checkSystemStatus()
  }, [])

  if (isFirstRun === null) {
    return <ViewLoadingSkeleton />
  }

  if (isFirstRun) {
    return (
      <ErrorBoundary>
        <FirstRunWizard 
          onComplete={() => setIsFirstRun(false)} 
          hasGoogleDriveAuth={hasGAuth} 
        />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  )
}
