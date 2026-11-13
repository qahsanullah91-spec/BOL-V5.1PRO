"use client"

import React, { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Building2,
  MapPin,
  Phone,
  Mail,
  Check,
  Plus,
  Trash2,
  Download,
  Filter,
  CheckCircle2,
  Edit3,
  Copy,
  AlertTriangle,
  X,
  Sparkles,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

export interface SavedPartyItem {
  id: string
  name: string
  address?: string
  contact?: string
  email?: string
  savedAt?: string
}

interface PartyDirectoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: "CONSIGNEE" | "SHIPPER" | "NOTIFY_PARTY"
  parties: SavedPartyItem[]
  selectedPartyId?: string
  onSelectParty: (party: SavedPartyItem) => void
  onSaveNewParty?: (party: SavedPartyItem) => void
  onUpdateParty?: (party: SavedPartyItem) => void
  onDeleteParty?: (id: string) => void
}

const ALPHABET = [
  "ALL",
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "0-9"
]

function getInitials(name: string): string {
  const parts = name.replace(/[@#*]+/g, "").trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return (parts[0]?.slice(0, 2) || "CO").toUpperCase()
}

export function PartyDirectoryModal({
  open,
  onOpenChange,
  role,
  parties,
  selectedPartyId,
  onSelectParty,
  onSaveNewParty,
  onUpdateParty,
  onDeleteParty,
}: PartyDirectoryModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLetter, setSelectedLetter] = useState("ALL")
  const [filterMode, setFilterMode] = useState<"ALL" | "COMPLETE" | "NEEDS_ADDRESS">("ALL")
  
  // Drawer states
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingParty, setEditingParty] = useState<SavedPartyItem | null>(null)

  // New party form state
  const [newName, setNewName] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [newContact, setNewContact] = useState("")
  const [newEmail, setNewEmail] = useState("")

  // Edit party form state
  const [editName, setEditName] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editContact, setEditContact] = useState("")
  const [editEmail, setEditEmail] = useState("")

  const roleLabels = {
    CONSIGNEE: {
      title: "Consignee Master Directory",
      faTitle: "دایرکتوری جامع گیرندگان کالا",
      badgeColor: "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      avatarBg: "from-emerald-600 to-teal-700 text-white",
      btnColor: "bg-emerald-600 hover:bg-emerald-700 text-white",
      entityLabel: "Consignee",
    },
    SHIPPER: {
      title: "Shipper Master Directory",
      faTitle: "دایرکتوری جامع فرستندگان کالا",
      badgeColor: "bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      avatarBg: "from-blue-600 to-indigo-700 text-white",
      btnColor: "bg-blue-600 hover:bg-blue-700 text-white",
      entityLabel: "Shipper",
    },
    NOTIFY_PARTY: {
      title: "Notify Party Directory",
      faTitle: "دایرکتوری طرف اطلاع",
      badgeColor: "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      avatarBg: "from-amber-600 to-orange-700 text-white",
      btnColor: "bg-amber-600 hover:bg-amber-700 text-white",
      entityLabel: "Notify Party",
    },
  }[role]

  // Counts
  const { completeCount, missingAddressCount } = useMemo(() => {
    let complete = 0
    let missing = 0
    for (const p of parties) {
      if ((p.address || "").trim()) {
        complete++
      } else {
        missing++
      }
    }
    return { completeCount: complete, missingAddressCount: missing }
  }, [parties])

  // Filtered & Sorted parties list
  const filteredParties = useMemo(() => {
    let list = [...parties]

    // Clean name sorting
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""))

    // Status filter
    if (filterMode === "COMPLETE") {
      list = list.filter((p) => (p.address || "").trim().length > 0)
    } else if (filterMode === "NEEDS_ADDRESS") {
      list = list.filter((p) => !(p.address || "").trim())
    }

    // Filter by alphabet letter
    if (selectedLetter !== "ALL") {
      if (selectedLetter === "0-9") {
        list = list.filter((p) => /^[0-9]/.test((p.name || "").trim()))
      } else {
        list = list.filter((p) => (p.name || "").trim().toUpperCase().startsWith(selectedLetter))
      }
    }

    // Filter by search query
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((p) =>
        [p.name, p.address, p.contact, p.email]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q))
      )
    }

    return list
  }, [parties, selectedLetter, searchQuery, filterMode])

  const handleCreateParty = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) {
      toast.error("Please enter a company name.")
      return
    }

    const cleanName = newName.replace(/[\s@#*]+$/, "").trim()
    const created: SavedPartyItem = {
      id: `party-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      address: newAddress.trim(),
      contact: newContact.trim(),
      email: newEmail.trim(),
      savedAt: new Date().toISOString(),
    }

    if (onSaveNewParty) {
      onSaveNewParty(created)
    }

    toast.success(`Added "${created.name}" to directory!`)
    setNewName("")
    setNewAddress("")
    setNewContact("")
    setNewEmail("")
    setIsAddingNew(false)
  }

  const handleStartEdit = (party: SavedPartyItem) => {
    setEditingParty(party)
    setEditName(party.name || "")
    setEditAddress(party.address || "")
    setEditContact(party.contact || "")
    setEditEmail(party.email || "")
    setIsAddingNew(false)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingParty || !editName.trim()) {
      toast.error("Please enter a company name.")
      return
    }

    const cleanName = editName.replace(/[\s@#*]+$/, "").trim()
    const updated: SavedPartyItem = {
      ...editingParty,
      name: cleanName,
      address: editAddress.trim(),
      contact: editContact.trim(),
      email: editEmail.trim(),
      savedAt: new Date().toISOString(),
    }

    if (onUpdateParty) {
      onUpdateParty(updated)
    }

    toast.success(`Updated "${updated.name}" successfully!`)
    setEditingParty(null)
  }

  const handleCopyDetails = (party: SavedPartyItem) => {
    const lines = [
      party.name,
      party.address,
      party.contact ? `Tel: ${party.contact}` : "",
      party.email ? `Email: ${party.email}` : "",
    ].filter(Boolean)

    navigator.clipboard.writeText(lines.join("\n"))
    toast.success("Party details copied to clipboard!", {
      description: party.name,
    })
  }

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(parties, null, 2))
    const dlAnchor = document.createElement("a")
    dlAnchor.setAttribute("href", dataStr)
    dlAnchor.setAttribute("download", `skybol-${role.toLowerCase()}-directory-${parties.length}.json`)
    dlAnchor.click()
    toast.success(`Exported ${parties.length} directory records to JSON.`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl">
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${roleLabels.badgeColor}`}>
                {roleLabels.entityLabel}
              </span>
              <Badge variant="secondary" className="font-mono text-xs font-black">
                {parties.length} Total Verified Records
              </Badge>
              <span className="text-xs text-slate-500 font-[vazirmatn] font-bold" dir="rtl">
                {roleLabels.faTitle}
              </span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>{roleLabels.title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Browse, search, edit, and instantly apply full company name and address records into your current Bill of Lading.
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              className="h-8.5 text-xs font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
              title="Download entire directory file as JSON"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Export JSON
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setIsAddingNew(!isAddingNew)
                setEditingParty(null)
              }}
              className={`h-8.5 text-xs font-bold shadow-2xs cursor-pointer transition-all ${
                isAddingNew ? "bg-slate-700 hover:bg-slate-800 text-white" : roleLabels.btnColor
              }`}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {isAddingNew ? "Cancel" : "Add New"}
            </Button>
          </div>
        </div>

        {/* Add New Party Drawer / Form */}
        {isAddingNew && (
          <form
            onSubmit={handleCreateParty}
            className="p-4 sm:p-5 bg-blue-50/80 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/50 animate-in slide-in-from-top-3 duration-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-blue-950 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" /> Register New {roleLabels.entityLabel} in Master Directory
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Company Name *</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. RAHMAT NAZAR LTD"
                  className="h-8.5 text-xs bg-white dark:bg-slate-900 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Contact Person / Phone</label>
                <Input
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  placeholder="e.g. +93 700 300 979"
                  className="h-8.5 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Full Physical Address & License Info *</label>
                <Textarea
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. T.L NO: 682-27 SHORANDAM INDUSTRIAL AREA KANDAHAR AFGHANISTAN."
                  className="min-h-[50px] text-xs bg-white dark:bg-slate-900 leading-relaxed"
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Email Address (Optional)</label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. info@company.com"
                  className="h-8.5 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex items-end justify-end">
                <Button type="submit" size="sm" className={`h-8.5 text-xs font-bold ${roleLabels.btnColor}`}>
                  <Check className="w-3.5 h-3.5 mr-1" /> Save to Master Directory
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Edit Existing Party Drawer / Form */}
        {editingParty && (
          <form
            onSubmit={handleSaveEdit}
            className="p-4 sm:p-5 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-300 dark:border-amber-900/60 animate-in slide-in-from-top-3 duration-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-600" /> Edit {roleLabels.entityLabel}: {editingParty.name}
              </h4>
              <button
                type="button"
                onClick={() => setEditingParty(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                ✕ Cancel Edit
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Company Name *</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Company name..."
                  className="h-8.5 text-xs bg-white dark:bg-slate-900 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Contact Person / Phone</label>
                <Input
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                  placeholder="e.g. +93 700 300 979"
                  className="h-8.5 text-xs bg-white dark:bg-slate-900 font-mono"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Full Physical Address & License Info</label>
                <Textarea
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. T.L NO: 682-27 SHORANDAM INDUSTRIAL AREA KANDAHAR AFGHANISTAN."
                  className="min-h-[50px] text-xs bg-white dark:bg-slate-900 leading-relaxed"
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. info@company.com"
                  className="h-8.5 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex items-end justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingParty(null)}
                  className="h-8.5 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> Update Directory Record
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Search, Filter Tabs & Alphabet Toolbar */}
        <div className="p-4 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search all ${parties.length} directory records (by name, country, city, address, phone)...`}
                className="pl-9 pr-9 h-10 text-xs sm:text-sm font-semibold rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilterMode("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterMode === "ALL"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                All ({parties.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("COMPLETE")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  filterMode === "COMPLETE"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200/80"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete ({completeCount})</span>
              </button>
              {missingAddressCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterMode("NEEDS_ADDRESS")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filterMode === "NEEDS_ADDRESS"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200/80"
                  }`}
                  title="Click to view records with missing address"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Missing Info ({missingAddressCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Alphabet quick jump row */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <span className="text-[10px] font-black uppercase text-slate-400 mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> A-Z:
            </span>
            {ALPHABET.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedLetter(letter)}
                className={`px-2 py-0.5 rounded-lg font-black transition-all cursor-pointer shrink-0 text-xs ${
                  selectedLetter === letter
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs scale-105"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* Directory List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
          {filteredParties.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <div className="text-sm font-bold">No {roleLabels.entityLabel.toLowerCase()}s found</div>
              <p className="text-xs max-w-sm mx-auto">
                No records match "{searchQuery}" {selectedLetter !== "ALL" ? `starting with ${selectedLetter}` : ""}.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedLetter("ALL")
                  setFilterMode("ALL")
                }}
                className="text-xs font-bold mt-2"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredParties.map((party) => {
                const isSelected = selectedPartyId === party.id
                const hasAddress = Boolean(party.address && party.address.trim())
                const hasContact = Boolean(party.contact && party.contact.trim())
                const initials = getInitials(party.name)

                return (
                  <div
                    key={party.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "bg-blue-50/90 dark:bg-blue-950/40 border-blue-400 shadow-md ring-2 ring-blue-500/20"
                        : "bg-white dark:bg-slate-850 hover:bg-slate-50/90 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-800 shadow-2xs"
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Card Header with Initials Avatar & Name */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${roleLabels.avatarBg} flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight break-words">
                              {party.name.replace(/[\s@#*]+$/, "").trim()}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {hasAddress ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Record
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Incomplete Info
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Active on BOL
                          </span>
                        )}
                      </div>

                      {/* Address Block */}
                      {hasAddress ? (
                        <div className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed line-clamp-2 select-all font-medium">
                            {party.address}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs">
                          <span className="flex items-center gap-1.5 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Address missing on file
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(party)}
                            className="text-[11px] font-black text-blue-700 hover:text-blue-900 dark:text-blue-400 underline cursor-pointer"
                          >
                            + Add Address
                          </button>
                        </div>
                      )}

                      {/* Contact & Email */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                        {hasContact ? (
                          <div className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{party.contact}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(party)}
                            className="flex items-center gap-1 text-slate-400 hover:text-blue-600 text-[10px]"
                          >
                            <Phone className="w-3 h-3 text-slate-300" />
                            <span>No phone — Click to add</span>
                          </button>
                        )}

                        {party.email && (
                          <div className="flex items-center gap-1 truncate max-w-[200px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{party.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {party.id.startsWith("pdf-") || party.id.startsWith("gemini-") ? "Master Seed" : "Saved Directory"}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Copy Details */}
                        <button
                          type="button"
                          onClick={() => handleCopyDetails(party)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Copy details to clipboard"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Party */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(party)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                          title="Edit company name, address or contact"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Party */}
                        {onDeleteParty && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete "${party.name}" from saved directory?`)) {
                                onDeleteParty(party.id)
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Delete party from directory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Apply to BOL */}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            onSelectParty(party)
                            onOpenChange(false)
                          }}
                          className={`h-7.5 px-3 text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isSelected ? "Applied" : "Apply to BOL"}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Summary Bar */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Showing {filteredParties.length} of {parties.length} records
            </span>
            {searchQuery && (
              <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Matches "{searchQuery}"
              </span>
            )}
            {selectedLetter !== "ALL" && (
              <span className="text-[11px] text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                Letter: {selectedLetter}
              </span>
            )}
            {filterMode !== "ALL" && (
              <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Filter: {filterMode === "COMPLETE" ? "Complete Only" : "Missing Info"}
              </span>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs font-bold"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
