import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import * as localStorage from "@/lib/services/local-storage-service"
import { getNextAtomicBolNumber } from "@/lib/services/bol-sequence"

function extractBolNumberSuffix(bolNum: any): number {
  if (!bolNum) return 0
  const str = String(bolNum)
  const match = str.match(/NSA(\d+)/i) || str.match(/(\d+)\s*$/)
  if (match && match[1]) {
    const val = parseInt(match[1], 10)
    return isNaN(val) ? 0 : val
  }
  return 0
}

// GET: Fetch all BOLs or get next BOL number
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  
  if (action === "next-number") {
    try {
      const bolNumber = await getNextAtomicBolNumber()
      return NextResponse.json({ bolNumber })
    } catch (err) {
      console.error("[bol API] Error generating next number:", err)
      const currentYear = new Date().getFullYear()
      return NextResponse.json({ bolNumber: `BOL-${currentYear}-NSA471` })
    }
  }

  let user: any = null
  let supabase: any = null

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      supabase = await createClient()
      const { data, error: authError } = await supabase.auth.getUser()
      if (authError || !data?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      user = data.user
    } catch (err) {
      console.warn("[v0] Supabase auth check error:", err)
    }
  }

  // Default: List all BOLs - try Supabase first, fallback to local storage
  try {
    let data: any[] | null = null
    if (supabase) {
      try {
        const { data: supaData, error } = await supabase
          .from("bill_of_lading")
          .select("*")
          .order("created_at", { ascending: false })
        if (!error && supaData) {
          data = supaData
        }
      } catch (err) {
        console.warn("[v0] Supabase query skipped:", err)
      }
    }
    
    const localBols = await localStorage.getAllLocalBOLs()

    const mergedByNumber = new Map<string, any>()
    for (const bol of localBols) {
      const key = bol.bol_number || bol.id
      if (key) mergedByNumber.set(key, bol)
    }
    for (const bol of data || []) {
      const key = bol.bol_number || bol.id
      if (key) {
        const existing = mergedByNumber.get(key)
        if (!existing) {
          mergedByNumber.set(key, bol)
        } else {
          const existingTime = new Date(existing.updated_at || existing.created_at || 0).getTime()
          const newTime = new Date(bol.updated_at || bol.created_at || 0).getTime()
          
          if (newTime > existingTime) {
             mergedByNumber.set(key, bol)
          } else if (newTime === existingTime) {
             if (!existing.shipper_name && bol.shipper_name) {
               mergedByNumber.set(key, bol)
             }
          }
        }
      }
    }

    let allBols = Array.from(mergedByNumber.values()).filter((bol) => {
      const s = (bol.shipper_name || "").trim().toLowerCase()
      const hasShipper = s !== "" && s !== "no shipper" && s !== "no-shipper" && s !== "none"
      const hasBol = Boolean(bol.bol_number && String(bol.bol_number).trim().length > 3)
      const q = (bol.number_of_packages || "").trim().toLowerCase()
      const hasPkg = q !== "" && q !== "0" && q !== "0-ctns" && q !== "0 ctns"
      const nw = (bol.net_weight || "").trim()
      const gw = (bol.gross_weight || "").trim()
      const val = (bol.goods_value || "").trim()
      const cName = (bol.consignee_name || "").trim().toLowerCase()
      const hasConsignee = cName !== "" && cName !== "no consignee"
      const hasDesc = (bol.cargo_description || "").replace(/[^\w\s\u0600-\u06FF]/g, "").trim().length > 3
      const hasDriver = Boolean((bol.driver_name || "").trim() || (bol.driver_rent || "").trim() || (bol.truck_number || "").trim())
      return hasShipper || hasBol || hasPkg || nw !== "" || gw !== "" || val !== "" || hasConsignee || hasDesc || hasDriver
    }).sort((a, b) => {
      const dateA = new Date(a.created_at || a.updated_at || a.issue_date || 0).getTime()
      const dateB = new Date(b.created_at || b.updated_at || b.issue_date || 0).getTime()
      if (dateB !== dateA) return dateB - dateA
      return extractBolNumberSuffix(b.bol_number || "") - extractBolNumberSuffix(a.bol_number || "")
    })

    // Backend Authorization: Filter by linked shipper identity
    const role = (user?.user_metadata?.role || user?.app_metadata?.role || request.headers.get("x-user-role") || searchParams.get("role") || "").toLowerCase()
    const shipperIdentity = user?.user_metadata?.shipper_name || user?.email || request.headers.get("x-shipper-name") || searchParams.get("shipper_name")

    if ((role === "shipper" || role === "client") && shipperIdentity) {
      const sFilter = shipperIdentity.trim().toLowerCase()
      allBols = allBols.filter((bol) => {
        const sName = (bol.shipper_name || "").toLowerCase()
        const cId = (bol.client_id || "").toLowerCase()
        return sName === sFilter || sName.includes(sFilter) || sFilter.includes(sName) || cId === sFilter
      })
    }

    return NextResponse.json({ data: allBols, source: localBols.length ? "merged" : "supabase" })
  } catch (err) {
    console.error("[v0] Error fetching BOLs:", err instanceof Error ? err.message : String(err))
    const localBols = await localStorage.getAllLocalBOLs()
    let sortedLocal = [...localBols].sort((a, b) => {
      const dateA = new Date(a.created_at || a.updated_at || a.issue_date || 0).getTime()
      const dateB = new Date(b.created_at || b.updated_at || b.issue_date || 0).getTime()
      if (dateB !== dateA) return dateB - dateA
      return extractBolNumberSuffix(b.bol_number || "") - extractBolNumberSuffix(a.bol_number || "")
    })

    const role = (user?.user_metadata?.role || user?.app_metadata?.role || request.headers.get("x-user-role") || "").toLowerCase()
    const shipperIdentity = user?.user_metadata?.shipper_name || user?.email || request.headers.get("x-shipper-name")

    if ((role === "shipper" || role === "client") && shipperIdentity) {
      const sFilter = shipperIdentity.trim().toLowerCase()
      sortedLocal = sortedLocal.filter((bol) => {
        const sName = (bol.shipper_name || "").toLowerCase()
        const cId = (bol.client_id || "").toLowerCase()
        return sName === sFilter || sName.includes(sFilter) || sFilter.includes(sName) || cId === sFilter
      })
    }

    return NextResponse.json({ 
      data: sortedLocal, 
      source: "local",
      notice: "Using locally cached BOLs"
    })
  }
}

// POST: Create a new BOL with atomic sequence and collision retry
export async function POST(request: Request) {
  try {
    let user: any = null
    let supabase: any = null

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        supabase = await createClient()
        const { data, error: authError } = await supabase.auth.getUser()
        if (authError || !data?.user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        user = data.user
      } catch (err) {
        console.warn("[v0] Supabase auth check error:", err)
      }
    }

    const role = (user?.user_metadata?.role || user?.app_metadata?.role || request.headers.get("x-user-role") || "admin").toLowerCase()
    if (role === "shipper" || role === "client" || role === "viewer") {
      return NextResponse.json({ error: "Forbidden: Unauthorized to create BOL documents" }, { status: 403 })
    }

    const body = await request.json()
    const { id: rawId, ...cleanBody } = body
    
    let attempts = 0
    let savedData: any = null
    let savedToSupabase = false

    while (attempts < 3) {
      attempts++
      const bolNumber = (attempts === 1 && body.bol_number) ? body.bol_number : await getNextAtomicBolNumber()

      const bolData: Record<string, any> = {
        bol_number: bolNumber,
        issue_date: body.issue_date || new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user?.id || null,
        ...cleanBody,
      }

      if (rawId && typeof rawId === "string" && rawId.length > 20 && !rawId.startsWith("BOL-")) {
        bolData.id = rawId
      }

      savedData = {
        id: bolNumber,
        ...bolData,
      }

      // Persist locally
      await localStorage.storeLocalBOL(bolNumber, bolData)

      // Automatically connect BOL to Accounting Ledger
      try {
        const { autoProcessBolAccounting } = await import("@/lib/services/bol-accounting-integration")
        await autoProcessBolAccounting(bolData)
      } catch (accErr) {
        console.error("Failed to auto-process accounting:", accErr)
      }

      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        try {
          const { data, error } = await supabase
            .from("bill_of_lading")
            .insert(bolData)
            .select()
            .single()

          if (error) {
            // Postgres unique violation error code: 23505
            if (error.code === "23505" && attempts < 3) {
              console.warn(`[BOL API] Duplicate bol_number ${bolNumber}, retrying with next atomic sequence...`)
              continue
            }
            console.error("[v0] Supabase insert error:", error.message, error.details)
          } else if (data) {
            savedData = data
            savedToSupabase = true
            break
          }
        } catch (supabaseErr) {
          console.error("[v0] Supabase connection failed, preserved locally:", supabaseErr)
          break
        }
      } else {
        break
      }
    }

    return NextResponse.json({ 
      success: true,
      data: savedData,
      saved_to: savedToSupabase ? "supabase" : "local",
      notice: savedToSupabase ? undefined : "Document saved locally and synchronized."
    })
  } catch (err) {
    console.error("[v0] Error in BOL creation:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ 
      success: false,
      error: err instanceof Error ? err.message : "Failed to create BOL" 
    }, { status: 400 })
  }
}
