"use client"

import { Account, Company, LedgerEntry, Invoice, InvoiceItem, LedgerSettings } from '@/lib/types'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

const DEFAULT_LEDGER_SETTINGS: LedgerSettings = {
  companyLogo: '/logo.png',
  backgroundImage: '/ledger-background.png',
}

// Sample data from HAJI-ABDUL-WASE-KHAN-ALOKOZAY ACCOUNT LEDGER PDF
const SAMPLE_LEDGER_ENTRIES: LedgerEntry[] = [
  { id: '1', sNo: 1, date: '05-09-1404', shipperDescription: 'ANI TRADERS', invoiceNo: 'IN NO. 002', dateOfShip: '05-09-1404', billOfLanding: 'SCLJEANSA02230', surrenderedBL: false, containerNo: 'MYRU450180-0', consignee: 'داود ابراهیمی', quantity: '1087 CTNS: DRY FIGS (BEST), 531 CTNS: GOLDEN RAISINS (BEST), 90 BAGS: POMEGRANATE SEEDS | 1708 CNTS', debit: 3200, credit: 0, balance: 3200 },
  { id: '2', sNo: 2, date: '10-09-1404', shipperDescription: 'M/S KALU MAL MADAN LAL', invoiceNo: 'IN NO. 020', dateOfShip: '10-09-1404', billOfLanding: 'SNJEANSA25056560', surrenderedBL: false, containerNo: 'TRIU8065361', consignee: 'اسحاق نندار', quantity: '2499 CNT: DRY FIGS (BEST)', debit: 3200, credit: 0, balance: 6400 },
  { id: '3', sNo: 3, date: '10-09-1404', shipperDescription: 'M/S KALU MAL MADAN LAL', invoiceNo: 'IN NO. 026', dateOfShip: '10-09-1404', billOfLanding: 'SNJEANSA25056501', surrenderedBL: false, containerNo: 'TRIU8676150', consignee: 'جان اقا فقیر محمد', quantity: '2010 CNT: DRY FIGS (MED)', debit: 3200, credit: 0, balance: 9600 },
  { id: '4', sNo: 4, date: '12-09-1404', shipperDescription: 'O.A.ASSOCIATES', invoiceNo: 'IN NO.031', dateOfShip: '12-09-1404', billOfLanding: 'ELSBNDJEA200781', surrenderedBL: false, containerNo: 'HLXU870056-9', consignee: 'وفا ظهیری لمیتد', quantity: '1388 CTN: GOLDEN RAISINS (BEST) | 8 CTNS DRY APRICOTS (MED)', debit: 3200, credit: 0, balance: 12800 },
  { id: '5', sNo: 5, date: '12-09-1404', shipperDescription: 'SIO INTERNATIONAL', invoiceNo: 'IN NO.004', dateOfShip: '12-09-1404', billOfLanding: 'ACLJEANSA1196625', surrenderedBL: false, containerNo: '01X 40\'RF /ACLU4918436', consignee: 'ماما خانزده', quantity: '2209 CTNS: DRY FGS (MED) NW 22090 KGS.', debit: 3200, credit: 0, balance: 16000 },
  { id: '6', sNo: 6, date: '23-09-1404', shipperDescription: 'MEHRA DRY FRUIT IMPEX', invoiceNo: 'IN NO.010', dateOfShip: '23-09-1404', billOfLanding: 'ACLJEANSA1183725', surrenderedBL: false, containerNo: 'TRIU8511530', consignee: 'نوی ارغند', quantity: '1470 CTNS GOLDEN RAISINS (BEST)', debit: 3200, credit: 0, balance: 19200 },
  { id: '7', sNo: 7, date: '09-09-1404', shipperDescription: 'GOPAL INTERNATIONAL', invoiceNo: 'IN NO: 011', dateOfShip: '09-09-1404', billOfLanding: 'ACLJEAMUN1190525', surrenderedBL: false, containerNo: 'TDRU9000322', consignee: 'نوی ارغند', quantity: '2251 CTNS: DRY FIGS (BEST), NW 22510 KGS.', debit: 3200, credit: 0, balance: 22400 },
  { id: '8', sNo: 8, date: '10-09-1404', shipperDescription: 'M/S KALU MAL MADAN LAL', invoiceNo: 'IN NO: 009', dateOfShip: '10-09-1404', billOfLanding: 'FULBNDNSA25000677', surrenderedBL: false, containerNo: '1X40\'RH BLJU608087-1', consignee: 'ملت', quantity: '1485 CTNS: GOLDEN RAISINS (BEST), NW 23760 KGS.', debit: 3200, credit: 0, balance: 25600 },
  { id: '9', sNo: 9, date: '12-09-1404', shipperDescription: 'CRYSTAL ENTERPRISES', invoiceNo: 'IN NO: 037', dateOfShip: '12-09-1404', billOfLanding: 'FULBNDNSA25000671', surrenderedBL: false, containerNo: 'SZLU900072-4', consignee: 'جان اقا فقیر محمد', quantity: '1500: DRY APRCOTS', debit: 3200, credit: 0, balance: 28800 },
  { id: '10', sNo: 10, date: '20-09-1404', shipperDescription: 'KAILASH CHAND MANOJ KUMAR', invoiceNo: 'IN NO: 009', dateOfShip: '20-09-1404', billOfLanding: 'BMLWGCOD01104', surrenderedBL: false, containerNo: 'BLJU608087-1', consignee: 'احسان وفا', quantity: '2457 CNTS DRY FIGS (BEST)', debit: 3200, credit: 0, balance: 32000 },
  { id: '11', sNo: 11, date: '10-09-1404', shipperDescription: 'KAILASH TRADERS', invoiceNo: 'IN NO: 022', dateOfShip: '10-09-1404', billOfLanding: 'FULBNDNSA25000676', surrenderedBL: false, containerNo: 'BLJU608071', consignee: 'اسحاق نندار', quantity: '1103 CTNS: GOLDEN RAISINS (BEST), NW 17648 KGS | 639 CTNS: GOLDEN RAISINS (BEST), NW 5112 KGS | TOTAL - 1742', debit: 3200, credit: 0, balance: 35200 },
  { id: '12', sNo: 12, date: '20-09-1404', shipperDescription: 'M/S KALU MAL MADAN LAL', invoiceNo: 'IN NO.013', dateOfShip: '20-09-1404', billOfLanding: 'BMLWGCOD01102', surrenderedBL: false, containerNo: 'BMOU9788955', consignee: 'نوی ارغند', quantity: '1090 CNT: GREEN RAISINS (BEST)', debit: 3200, credit: 0, balance: 38400 },
  { id: '13', sNo: 13, date: '19-09-1404', shipperDescription: 'BRIDGE AGRO', invoiceNo: 'IN NO.038', dateOfShip: '19-09-1404', billOfLanding: 'CCL-E-202009', surrenderedBL: false, containerNo: '1X40\'HC IRNU9307100', consignee: 'جان اقا فقیر محمد', quantity: '520 BAGS: TUKMARIA, NW 26000 KGS', debit: 2450, credit: 0, balance: 40850 },
  { id: '14', sNo: 14, date: '23-09-1404', shipperDescription: 'CRYSTAL ENTERPRISES', invoiceNo: 'IN NO.039', dateOfShip: '23-09-1404', billOfLanding: 'BMLWGCOD01111', surrenderedBL: false, containerNo: 'HJCU6090534', consignee: 'جان اقا فقیر محمد', quantity: '1320 CTNS: DRY APRICOTS/6 CTNS: APRICOT NUTS KERNEL 100 CTNS: GREEN RAISINS/6 CTNS: PISTACHIOS KERNEL, 60/10 CTNS: WALNUTS KERNEL | 1448', debit: 3200, credit: 0, balance: 44050 },
  { id: '15', sNo: 15, date: '17-09-1404', shipperDescription: 'M/S KALU MAL MADAN LAL', invoiceNo: 'IN NO.012', dateOfShip: '17-09-1404', billOfLanding: 'CCL/JEA/NSA-3574/26', surrenderedBL: false, containerNo: '1X40\'HC DAYU6109888', consignee: 'نوی ارغند', quantity: '2374 CTNS: DRY FIGS (BEST), NW 23740 KGS', debit: 2450, credit: 0, balance: 46500 },
  { id: '16', sNo: 16, date: '11-10-1404', shipperDescription: 'MEHRA DRY FRUIT IMPEX', invoiceNo: 'INVNO: 010', dateOfShip: '11-10-1404', billOfLanding: 'BMLWGCOD01108', surrenderedBL: false, containerNo: 'BMOU9789972', consignee: 'ملت', quantity: '1428 CTNS GOLDEN RAISINS (BEST)', debit: 3200, credit: 0, balance: 49700 },
  { id: '17', sNo: 17, date: '11-10-1404', shipperDescription: 'SAG TRANSLINER PVT LTD', invoiceNo: 'INVNO: 038, 039', dateOfShip: '11-10-1404', billOfLanding: 'BNDNSA-01128, BNDNSA-01128A', surrenderedBL: false, containerNo: 'VBSU0390220', consignee: 'WAFA ZAHIRI LTD', quantity: '696 CTNS GOLDEN RAISINS (BEST) | 696 CTNS GOLDEN RAISINS (BEST)', debit: 3400, credit: 0, balance: 53100 },
  { id: '18', sNo: 18, date: '05-09-1404', shipperDescription: 'K.R TRADING CORPORATION', invoiceNo: 'IN NO. 014', dateOfShip: '05-09-1404', billOfLanding: 'CCL/JEA/NSA-3309/26', surrenderedBL: false, containerNo: '1X40\'HC CRSU9124919', consignee: 'ظاهرقادری لمیتد', quantity: '540 BAGS: HARD ALMONDS (YIELD=23%), NW 27000 KGS.', debit: 2450, credit: 0, balance: 55550 },
  { id: '19', sNo: 19, date: '12-09-1404', shipperDescription: 'K.R TRADING CORPORATION', invoiceNo: 'IN NO: 016', dateOfShip: '12-09-1404', billOfLanding: 'CCL/BND/JEA-3492/26', surrenderedBL: false, containerNo: '1X40\'HC TLHU6291004', consignee: 'ظاهرقادری لمیتد', quantity: '560 BAGS HARD ALMONDS (YIELD=23%)', debit: 2450, credit: 0, balance: 58000 },
  { id: '20', sNo: 20, date: '05-09-1404', shipperDescription: 'BAKHTAR IMPORTS AND EXPORTS L.L.C', invoiceNo: 'IN NO. 031, 033, 032, 030', dateOfShip: '05-09-1404', billOfLanding: 'HLCUDX3251252200', surrenderedBL: false, containerNo: 'PSLU 6031508', consignee: 'جان اقا فقیر محمد', quantity: '93 CTNS: DRIED APRICOTS A+/ 249 CTNS: ALMONDS A+ 265 CTNS: ALMONDS A+ (NO SHELL)/ 170 CTNS/ 100 CTNS 304 CTNS: BLACK MULBERRY A+ |SOHAN HALVA 60 CTNS |WATER POT PLASTIC 50 BAGS |2173', debit: 11950, credit: 0, balance: 69950 },
  { id: '21', sNo: 21, date: '10-09-1404', shipperDescription: 'MEHRA INTERNATIONAL', invoiceNo: 'INVNO: 023', dateOfShip: '10-09-1404', billOfLanding: 'BMLWG01143', surrenderedBL: false, containerNo: 'VSBU0390045', consignee: 'اسحاق نندار', quantity: '2106 CTNS: GOLDEN RAISINS (BEST)', debit: 3200, credit: 0, balance: 73150 },
  { id: '22', sNo: 22, date: '05-09-1404', shipperDescription: 'BAKHTAR IMPORTS AND EXPORTS L.L.C', invoiceNo: 'INV: 027, 028, 029', dateOfShip: '05-09-1404', billOfLanding: 'MEDUH9176155', surrenderedBL: false, containerNo: 'TRIU8220200', consignee: 'جان اقا فقیر محمد', quantity: '2089 CNTS: / 24539 KGS', debit: 11950, credit: 0, balance: 85100 },
  { id: '23', sNo: 23, date: '14-09-1404', shipperDescription: 'BAKHSHI GLOBAL INC.', invoiceNo: 'IN NO: 034 | IN NO: 035', dateOfShip: '14-09-1404', billOfLanding: 'FFS-JEA-250702', surrenderedBL: false, containerNo: 'CRLU1374177', consignee: 'جان اقا فقیر محمد', quantity: '2154 CNTS', debit: 12800, credit: 0, balance: 97900 },
  { id: '24', sNo: 24, date: '19-09-1404', shipperDescription: 'نغدی وصول سوی توسط امداد احسان', invoiceNo: '', dateOfShip: '', billOfLanding: '', surrenderedBL: false, containerNo: '', consignee: '', quantity: '', debit: 0, credit: 20000, balance: 77900 },
  { id: '25', sNo: 25, date: '03-10-1404', shipperDescription: 'نغدی رسید توسط نوی تجارت مورشا', invoiceNo: '', dateOfShip: '', billOfLanding: '', surrenderedBL: false, containerNo: '', consignee: '', quantity: '', debit: 0, credit: 5000, balance: 72900 },
  { id: '26', sNo: 26, date: '11-10-1404', shipperDescription: 'نغدی وصول سوی توسط امداد احسان', invoiceNo: '', dateOfShip: '', billOfLanding: '', surrenderedBL: false, containerNo: '', consignee: '', quantity: '', debit: 0, credit: 10000, balance: 62900 },
  { id: '27', sNo: 27, date: '02-11-1404', shipperDescription: 'نغدی وصول سوی توسط امداد احسان', invoiceNo: '', dateOfShip: '', billOfLanding: '', surrenderedBL: false, containerNo: '', consignee: '', quantity: '', debit: 0, credit: 15000, balance: 47900 },
  { id: '28', sNo: 28, date: '16-11-1404', shipperDescription: 'نغدی وصول سوی توسط امداد احسان', invoiceNo: '', dateOfShip: '', billOfLanding: '', surrenderedBL: false, containerNo: '', consignee: '', quantity: '', debit: 0, credit: 10000, balance: 37900 },
  { id: '29', sNo: 29, date: '16-11-1404', shipperDescription: 'نغدی وصول سوی افغانی 100,000 به تبادله 65.50 دالر | جمله 1530 دالر | اسناد صحیح الله', invoiceNo: '', dateOfShip: '', billOfLanding: '', surrenderedBL: false, containerNo: '', consignee: '', quantity: '', debit: 0, credit: 1530, balance: 36370 },
  { id: '30', sNo: 30, date: '16-12-1404', shipperDescription: 'نغدی وصول سوی افغانی 742,400 به تبادله 62.70 دالر | جمله 11,840 دالر | مبرنو د 8 بارنامه او اسناد', invoiceNo: '', dateOfShip: '', billOfLanding: '', surrenderedBL: false, containerNo: '', consignee: '', quantity: '', debit: 0, credit: 11840, balance: 24530 },
  { id: '31', sNo: 31, date: '17-02-1405', shipperDescription: 'نغدی وصول سوی دست شب فقیر عبدالرحمن توسط احمد $3000 دالره حساب حاجی عبدالوصی خان الکوزی', invoiceNo: '', dateOfShip: '', billOfLanding: '', surrenderedBL: false, containerNo: '', consignee: '', quantity: '', debit: 0, credit: 10000, balance: 14530 },
  { id: '32', sNo: 32, date: '03-03-1405', shipperDescription: 'حاجی عبدالوصی خان الکوزی لمیتد', invoiceNo: '', dateOfShip: '', billOfLanding: '', surrenderedBL: false, containerNo: '', consignee: '', quantity: '', debit: 0, credit: 3000, balance: 11530 },
]

const SAMPLE_ACCOUNTS: Account[] = [
  {
    id: 'account-1',
    name: 'HAJI-ABDUL-WASE-KHAN-ALOKOZAY',
    companies: [
      {
        id: 'company-1',
        name: 'SKY ARIANA TRANSPORT',
        ledgerEntries: SAMPLE_LEDGER_ENTRIES,
      },
    ],
  },
]

interface AppState {
  accounts: Account[]
  invoices: Invoice[]
  currentAccount: Account | null
  currentCompany: Company | null
  view: 'accounts' | 'companies' | 'ledger' | 'invoice'
}

interface AppContextType extends AppState {
  addAccount: (name: string) => void
  deleteAccount: (id: string) => void
  selectAccount: (account: Account) => void
  addCompany: (accountId: string, name: string) => void
  deleteCompany: (accountId: string, companyId: string) => void
  selectCompany: (company: Company) => void
  addLedgerEntry: (accountId: string, companyId: string, entry: Omit<LedgerEntry, 'id' | 'sNo' | 'balance'>) => void
  updateLedgerEntry: (accountId: string, companyId: string, entryId: string, entry: Partial<LedgerEntry>) => void
  deleteLedgerEntry: (accountId: string, companyId: string, entryId: string) => void
  importLedgerEntries: (accountId: string, companyId: string, entries: Omit<LedgerEntry, 'id' | 'sNo' | 'balance'>[]) => void
  updateLedgerSettings: (accountId: string, companyId: string, settings: Partial<LedgerSettings>) => void
  toggleSurrenderedBL: (accountId: string, companyId: string, entryId: string) => void
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void
  updateInvoice: (invoiceId: string, invoice: Partial<Invoice>) => void
  deleteInvoice: (invoiceId: string) => void
  setView: (view: AppState['view']) => void
  goBack: () => void
  getLedgerSettings: () => LedgerSettings
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    accounts: SAMPLE_ACCOUNTS,
    invoices: [],
    currentAccount: null,
    currentCompany: null,
    view: 'accounts',
  })

  const addAccount = useCallback((name: string) => {
    const newAccount: Account = {
      id: crypto.randomUUID(),
      name,
      companies: [],
    }
    setState(prev => ({
      ...prev,
      accounts: [...prev.accounts, newAccount],
    }))
  }, [])

  const deleteAccount = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== id),
      currentAccount: prev.currentAccount?.id === id ? null : prev.currentAccount,
    }))
  }, [])

  const selectAccount = useCallback((account: Account) => {
    setState(prev => ({
      ...prev,
      currentAccount: account,
      currentCompany: null,
      view: 'companies',
    }))
  }, [])

  const addCompany = useCallback((accountId: string, name: string) => {
    const newCompany: Company = {
      id: crypto.randomUUID(),
      name,
      ledgerEntries: [],
    }
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.map(a =>
        a.id === accountId ? { ...a, companies: [...a.companies, newCompany] } : a
      ),
      currentAccount: prev.currentAccount?.id === accountId
        ? { ...prev.currentAccount, companies: [...prev.currentAccount.companies, newCompany] }
        : prev.currentAccount,
    }))
  }, [])

  const deleteCompany = useCallback((accountId: string, companyId: string) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.map(a =>
        a.id === accountId ? { ...a, companies: a.companies.filter(c => c.id !== companyId) } : a
      ),
      currentAccount: prev.currentAccount?.id === accountId
        ? { ...prev.currentAccount, companies: prev.currentAccount.companies.filter(c => c.id !== companyId) }
        : prev.currentAccount,
      currentCompany: prev.currentCompany?.id === companyId ? null : prev.currentCompany,
    }))
  }, [])

  const selectCompany = useCallback((company: Company) => {
    setState(prev => ({
      ...prev,
      currentCompany: company,
      view: 'ledger',
    }))
  }, [])

  const calculateBalances = (entries: LedgerEntry[]): LedgerEntry[] => {
    let runningBalance = 0
    return entries.map((entry, index) => {
      runningBalance = runningBalance + entry.debit - entry.credit
      return { ...entry, sNo: index + 1, balance: runningBalance }
    })
  }

  const addLedgerEntry = useCallback((accountId: string, companyId: string, entry: Omit<LedgerEntry, 'id' | 'sNo' | 'balance'>) => {
    const newEntry: LedgerEntry = {
      ...entry,
      id: crypto.randomUUID(),
      sNo: 0,
      balance: 0,
    }

    setState(prev => {
      const updatedAccounts = prev.accounts.map(a => {
        if (a.id !== accountId) return a
        return {
          ...a,
          companies: a.companies.map(c => {
            if (c.id !== companyId) return c
            const newEntries = calculateBalances([...c.ledgerEntries, newEntry])
            return { ...c, ledgerEntries: newEntries }
          }),
        }
      })

      const updatedCurrentAccount = prev.currentAccount?.id === accountId
        ? updatedAccounts.find(a => a.id === accountId) || null
        : prev.currentAccount

      const updatedCurrentCompany = updatedCurrentAccount?.companies.find(c => c.id === companyId) || null

      return {
        ...prev,
        accounts: updatedAccounts,
        currentAccount: updatedCurrentAccount,
        currentCompany: updatedCurrentCompany,
      }
    })
  }, [])

  const updateLedgerEntry = useCallback((accountId: string, companyId: string, entryId: string, entry: Partial<LedgerEntry>) => {
    setState(prev => {
      const updatedAccounts = prev.accounts.map(a => {
        if (a.id !== accountId) return a
        return {
          ...a,
          companies: a.companies.map(c => {
            if (c.id !== companyId) return c
            const updatedEntries = c.ledgerEntries.map(e =>
              e.id === entryId ? { ...e, ...entry } : e
            )
            return { ...c, ledgerEntries: calculateBalances(updatedEntries) }
          }),
        }
      })

      const updatedCurrentAccount = prev.currentAccount?.id === accountId
        ? updatedAccounts.find(a => a.id === accountId) || null
        : prev.currentAccount

      const updatedCurrentCompany = updatedCurrentAccount?.companies.find(c => c.id === companyId) || null

      return {
        ...prev,
        accounts: updatedAccounts,
        currentAccount: updatedCurrentAccount,
        currentCompany: updatedCurrentCompany,
      }
    })
  }, [])

  const deleteLedgerEntry = useCallback((accountId: string, companyId: string, entryId: string) => {
    setState(prev => {
      const updatedAccounts = prev.accounts.map(a => {
        if (a.id !== accountId) return a
        return {
          ...a,
          companies: a.companies.map(c => {
            if (c.id !== companyId) return c
            const filteredEntries = c.ledgerEntries.filter(e => e.id !== entryId)
            return { ...c, ledgerEntries: calculateBalances(filteredEntries) }
          }),
        }
      })

      const updatedCurrentAccount = prev.currentAccount?.id === accountId
        ? updatedAccounts.find(a => a.id === accountId) || null
        : prev.currentAccount

      const updatedCurrentCompany = updatedCurrentAccount?.companies.find(c => c.id === companyId) || null

      return {
        ...prev,
        accounts: updatedAccounts,
        currentAccount: updatedCurrentAccount,
        currentCompany: updatedCurrentCompany,
      }
    })
  }, [])

  const importLedgerEntries = useCallback((accountId: string, companyId: string, entries: Omit<LedgerEntry, 'id' | 'sNo' | 'balance'>[]) => {
    const newEntries: LedgerEntry[] = entries.map(entry => ({
      ...entry,
      id: crypto.randomUUID(),
      sNo: 0,
      balance: 0,
    }))

    setState(prev => {
      const updatedAccounts = prev.accounts.map(a => {
        if (a.id !== accountId) return a
        return {
          ...a,
          companies: a.companies.map(c => {
            if (c.id !== companyId) return c
            const allEntries = calculateBalances([...c.ledgerEntries, ...newEntries])
            return { ...c, ledgerEntries: allEntries }
          }),
        }
      })

      const updatedCurrentAccount = prev.currentAccount?.id === accountId
        ? updatedAccounts.find(a => a.id === accountId) || null
        : prev.currentAccount

      const updatedCurrentCompany = updatedCurrentAccount?.companies.find(c => c.id === companyId) || null

      return {
        ...prev,
        accounts: updatedAccounts,
        currentAccount: updatedCurrentAccount,
        currentCompany: updatedCurrentCompany,
      }
    })
  }, [])

  const addInvoice = useCallback((invoice: Omit<Invoice, 'id'>) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: crypto.randomUUID(),
    }
    setState(prev => ({
      ...prev,
      invoices: [...prev.invoices, newInvoice],
    }))
  }, [])

  const updateInvoice = useCallback((invoiceId: string, invoice: Partial<Invoice>) => {
    setState(prev => ({
      ...prev,
      invoices: prev.invoices.map(i =>
        i.id === invoiceId ? { ...i, ...invoice } : i
      ),
    }))
  }, [])

  const deleteInvoice = useCallback((invoiceId: string) => {
    setState(prev => ({
      ...prev,
      invoices: prev.invoices.filter(i => i.id !== invoiceId),
    }))
  }, [])

  const setView = useCallback((view: AppState['view']) => {
    setState(prev => ({ ...prev, view }))
  }, [])

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.view === 'ledger' || prev.view === 'invoice') {
        return { ...prev, view: 'companies', currentCompany: null }
      }
      if (prev.view === 'companies') {
        return { ...prev, view: 'accounts', currentAccount: null }
      }
      return prev
    })
  }, [])

  const updateLedgerSettings = useCallback((accountId: string, companyId: string, settings: Partial<LedgerSettings>) => {
    setState(prev => {
      const updatedAccounts = prev.accounts.map(a => {
        if (a.id !== accountId) return a
        return {
          ...a,
          companies: a.companies.map(c => {
            if (c.id !== companyId) return c
            return {
              ...c,
              ledgerSettings: {
                ...DEFAULT_LEDGER_SETTINGS,
                ...c.ledgerSettings,
                ...settings,
              },
            }
          }),
        }
      })

      const updatedCurrentAccount = prev.currentAccount?.id === accountId
        ? updatedAccounts.find(a => a.id === accountId) || null
        : prev.currentAccount

      const updatedCurrentCompany = updatedCurrentAccount?.companies.find(c => c.id === companyId) || null

      return {
        ...prev,
        accounts: updatedAccounts,
        currentAccount: updatedCurrentAccount,
        currentCompany: updatedCurrentCompany,
      }
    })
  }, [])

  const toggleSurrenderedBL = useCallback((accountId: string, companyId: string, entryId: string) => {
    setState(prev => {
      const updatedAccounts = prev.accounts.map(a => {
        if (a.id !== accountId) return a
        return {
          ...a,
          companies: a.companies.map(c => {
            if (c.id !== companyId) return c
            const updatedEntries = c.ledgerEntries.map(e =>
              e.id === entryId ? { ...e, surrenderedBL: !e.surrenderedBL } : e
            )
            return { ...c, ledgerEntries: updatedEntries }
          }),
        }
      })

      const updatedCurrentAccount = prev.currentAccount?.id === accountId
        ? updatedAccounts.find(a => a.id === accountId) || null
        : prev.currentAccount

      const updatedCurrentCompany = updatedCurrentAccount?.companies.find(c => c.id === companyId) || null

      return {
        ...prev,
        accounts: updatedAccounts,
        currentAccount: updatedCurrentAccount,
        currentCompany: updatedCurrentCompany,
      }
    })
  }, [])

  const getLedgerSettings = useCallback((): LedgerSettings => {
    return state.currentCompany?.ledgerSettings || DEFAULT_LEDGER_SETTINGS
  }, [state.currentCompany])

  return (
    <AppContext.Provider
      value={{
        ...state,
        addAccount,
        deleteAccount,
        selectAccount,
        addCompany,
        deleteCompany,
        selectCompany,
        addLedgerEntry,
        updateLedgerEntry,
        deleteLedgerEntry,
        importLedgerEntries,
        updateLedgerSettings,
        toggleSurrenderedBL,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        setView,
        goBack,
        getLedgerSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
