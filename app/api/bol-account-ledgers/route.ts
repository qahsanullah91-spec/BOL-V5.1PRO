import { NextResponse } from "next/server"
import {
  getBolAccountLedgerDatabase,
  saveBolAccountLedgerDatabase,
} from "@/lib/services/bol-account-ledger-storage-service"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  let user: any = null
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient()
    const { data, error: authError } = await supabase.auth.getUser()
    if (authError || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    user = data.user
  }

  try {
    const data = await getBolAccountLedgerDatabase()
    
    const role = (user?.user_metadata?.role || user?.app_metadata?.role || request.headers.get("x-user-role") || "").toLowerCase()
    const shipperIdentity = user?.user_metadata?.shipper_name || user?.email || request.headers.get("x-shipper-name")

    if ((role === "shipper" || role === "client") && shipperIdentity && data) {
      const sFilter = shipperIdentity.trim().toLowerCase()
      const filteredCompanies = (data.customCompanies || []).filter((cName: string) => {
        const lower = cName.toLowerCase()
        return lower === sFilter || lower.includes(sFilter) || sFilter.includes(lower)
      })

      const filteredRecords: Record<string, any[]> = {}
      if (data.ledgerRecords && typeof data.ledgerRecords === "object") {
        Object.keys(data.ledgerRecords).forEach((k) => {
          const kLower = k.toLowerCase()
          if (kLower === sFilter || kLower.includes(sFilter) || sFilter.includes(kLower)) {
            filteredRecords[k] = data.ledgerRecords[k]
          }
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          ...data,
          customCompanies: filteredCompanies,
          ledgerRecords: filteredRecords,
        },
        source: "local-file-filtered"
      })
    }

    return NextResponse.json({ success: true, data, source: "local-file" })
  } catch (error) {
    console.error("[bol-account-ledgers API] GET error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load BOL account ledger data" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  let user: any = null
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient()
    const { data, error: authError } = await supabase.auth.getUser()
    if (authError || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    user = data.user
  }

  const role = (user?.user_metadata?.role || user?.app_metadata?.role || request.headers.get("x-user-role") || "").toLowerCase()
  if (role === "shipper" || role === "client" || role === "viewer") {
    return NextResponse.json({ error: "Forbidden: Unauthorized to modify BOL account ledgers" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data = await saveBolAccountLedgerDatabase({
      customCompanies: Array.isArray(body.customCompanies) ? body.customCompanies : [],
      ledgerRecords: body.ledgerRecords && typeof body.ledgerRecords === "object" ? body.ledgerRecords : {},
      deletedLedgerEntries: Array.isArray(body.deletedLedgerEntries) ? body.deletedLedgerEntries : undefined,
    })

    if (body.ledgerRecords && typeof body.ledgerRecords === "object") {
      try {
        const { ledgerDbService } = await import("@/lib/services/ledger-db-service")
        await ledgerDbService.syncFromLegacyAccountLedgers(body.ledgerRecords)
      } catch (e) {
        console.warn("[bol-account-ledgers API] sync to ledgerDbService error:", e)
      }
    }

    return NextResponse.json({ success: true, data, source: "local-file" })
  } catch (error) {
    console.error("[bol-account-ledgers API] POST error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save BOL account ledger data" },
      { status: 400 }
    )
  }
}
