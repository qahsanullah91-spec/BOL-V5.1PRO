"use client"

import type React from "react"
import {
  Grid3X3,
  List,
  Table,
  AlignJustify,
  Columns3,
  Milestone,
  BadgeDollarSign,
  Route,
  Layers,
  BarChart3,
} from "lucide-react"

export type ViewMode =
  | "grid"
  | "list"
  | "table"
  | "compact"
  | "kanban"
  | "timeline"
  | "finance"
  | "route"
  | "gallery"
  | "analytics"

export interface ViewModeConfig {
  id: ViewMode
  label: string
  labelFa: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  badgeText?: string
}

export const VIEW_MODE_OPTIONS: ViewModeConfig[] = [
  {
    id: "grid",
    label: "Grid",
    labelFa: "کارت‌های شبکه‌ای",
    title: "Grid Cards (کارت‌های استاندارد)",
    description: "Responsive cards with full shipment details",
    icon: Grid3X3,
  },
  {
    id: "list",
    label: "List",
    labelFa: "لیست تفصیلی",
    title: "Detailed List (لیست افقی تفصیلی)",
    description: "Expanded rows with route & party tags",
    icon: List,
  },
  {
    id: "table",
    label: "Table",
    labelFa: "جدول داده‌ها",
    title: "Master Data Table (جدول جامع داده‌ها)",
    description: "Multi-column data table with invoice numbers",
    icon: Table,
  },
  {
    id: "compact",
    label: "Compact",
    labelFa: "ردیف‌های فشرده",
    title: "Ultra-Dense Rows (ردیف‌های فشرده اکسل)",
    description: "36px high-density rows for rapid scanning",
    icon: AlignJustify,
  },
  {
    id: "kanban",
    label: "Kanban",
    labelFa: "تخته کانبان",
    title: "Kanban Pipeline Board (تخته کانبان مراحل)",
    description: "5-stage operational workflow pipeline",
    icon: Columns3,
  },
  {
    id: "timeline",
    label: "Timeline",
    labelFa: "خط زمانی",
    title: "Chronological Timeline (خط زمانی رویدادها)",
    description: "Chronological date-grouped activity stream",
    icon: Milestone,
  },
  {
    id: "finance",
    label: "Finance",
    labelFa: "مالی و کرایه",
    title: "Financial & Invoicing (نمای مالی و کرایه بارنامه)",
    description: "Driver rent, declared value & invoices",
    icon: BadgeDollarSign,
  },
  {
    id: "route",
    label: "Routes",
    labelFa: "مسیرها و گمرکات",
    title: "Route & Border Stations (مسیر و گمرکات مرزی)",
    description: "Border crossings: Islam Qala, Torghundi, Hairatan",
    icon: Route,
  },
  {
    id: "gallery",
    label: "Gallery",
    labelFa: "گالری اسناد و PDF",
    title: "Document Showcase Gallery (نمای بصری اسناد و PDF)",
    description: "Mini A4 preview cards with official stamps",
    icon: Layers,
  },
  {
    id: "analytics",
    label: "Analytics",
    labelFa: "ماتریس تحلیلی مدیران",
    title: "Executive Operations Matrix (ماتریس تحلیلی مدیران)",
    description: "Executive KPIs, top shippers & volume analytics",
    icon: BarChart3,
  },
]

export interface SavedBolViewCommonProps {
  documents: any[]
  visibleCount: number
  sortBy: string
  isServerMode?: boolean
  selectedDocIds?: string[]
  onToggleSelect?: (id: string) => void
  onEdit: (doc: any) => void
  onDownload: (doc: any) => void
  onPreview: (doc: any) => void
  onDuplicate?: (doc: any) => void
  onOpenPdf: (doc: any) => void
  onDelete?: (doc: any, e?: React.MouseEvent) => void
  onArchive: (doc: any, e?: React.MouseEvent) => void
  onRestore: (doc: any) => void
  onHardDelete: (doc: any, e?: React.MouseEvent) => void
  onFiles: (doc: any) => void
  onSendToCMR?: (doc: any) => void
}
