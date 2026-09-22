import { NextResponse } from "next/server"
import { getAccountLedgerDatabase, saveAccountLedgerDatabase } from "@/lib/services/account-ledger-storage-service"
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
    const data = await getAccountLedgerDatabase()
    
    const role = (user?.user_metadata?.role || user?.app_metadata?.role || request.headers.get("x-user-role") || "").toLowerCase()
    const shipperIdentity = user?.user_metadata?.shipper_name || user?.email || request.headers.get("x-shipper-name")

    if ((role === "shipper" || role === "client") && shipperIdentity && data) {
      const sFilter = shipperIdentity.trim().toLowerCase()
      const filteredAccounts = (data.accounts || []).filter((accName: string) => {
        const aName = accName.toLowerCase()
        return aName === sFilter || aName.includes(sFilter) || sFilter.includes(aName)
      })

      const filteredLedgerEntries: Record<string, any[]> = {}
      if (data.ledgerEntries && typeof data.ledgerEntries === "object") {
        Object.keys(data.ledgerEntries).forEach((k) => {
          const kLower = k.toLowerCase()
          if (kLower === sFilter || kLower.includes(sFilter) || sFilter.includes(kLower)) {
            filteredLedgerEntries[k] = data.ledgerEntries[k]
          }
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          ...data,
          accounts: filteredAccounts,
          ledgerEntries: filteredLedgerEntries,
        },
        source: "local-file-filtered"
      })
    }

    return NextResponse.json({ success: true, data, source: "local-file" })
  } catch (error) {
    console.error("[account-ledgers API] GET error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load account ledger data" },
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
    return NextResponse.json({ error: "Forbidden: Unauthorized to modify account ledgers" }, { status: 403 })
  }

  try {
    const body = await request.json()

    const data = await saveAccountLedgerDatabase({
      accounts: Array.isArray(body.accounts) ? body.accounts : [],
      ledgerEntries: body.ledgerEntries && typeof body.ledgerEntries === "object" ? body.ledgerEntries : {},
      ledgerProfiles: body.ledgerProfiles && typeof body.ledgerProfiles === "object" ? body.ledgerProfiles : {},
      receipts: body.receipts && typeof body.receipts === "object" ? body.receipts : {},
      deletedLedgerEntries: Array.isArray(body.deletedLedgerEntries) ? body.deletedLedgerEntries : undefined,
    })

    if (body.ledgerEntries && typeof body.ledgerEntries === "object") {
      try {
        const { ledgerDbService } = await import("@/lib/services/ledger-db-service")
        await ledgerDbService.syncFromLegacyAccountLedgers(body.ledgerEntries)
      } catch (e) {
        console.warn("[account-ledgers API] sync to ledgerDbService error:", e)
      }
    }

    return NextResponse.json({ success: true, data, source: "local-file" })
  } catch (error) {
    console.error("[account-ledgers API] POST error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save account ledger data" },
      { status: 400 }
    )
  }
}
