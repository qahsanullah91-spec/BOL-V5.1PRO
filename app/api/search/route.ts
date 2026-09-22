import { NextResponse } from "next/server"
import { getAllLocalBOLs } from "@/lib/services/local-storage-service"
import { getAllInvoices, getAllAccounts } from "@/lib/services/invoice-storage-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = (searchParams.get("q") || "").toLowerCase().trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const results = []

    // 1. Search BOLs
    const bols = await getAllLocalBOLs()
    const bolResults = bols
      .filter((bol: any) => 
        (bol.bol_number?.toLowerCase().includes(query)) ||
        (bol.shipper_name?.toLowerCase().includes(query)) ||
        (bol.consignee_name?.toLowerCase().includes(query)) ||
        (bol.cargo_description?.toLowerCase().includes(query))
      )
      .slice(0, 10)
      .map((bol: any) => ({
        id: bol.id || bol.bol_number,
        type: "bol",
        title: bol.bol_number || "Draft BOL",
        subtitle: `${bol.shipper_name || "Unknown Shipper"} -> ${bol.consignee_name || "Unknown Consignee"}`,
        date: bol.created_at || bol.issue_date,
      }))
    results.push(...bolResults)

    // 2. Search Invoices
    const invoices = await getAllInvoices()
    const invoiceResults = invoices
      .filter((inv: any) =>
        (inv.invoice_number?.toLowerCase().includes(query)) ||
        (inv.bol_number?.toLowerCase().includes(query)) ||
        (inv.client_name?.toLowerCase().includes(query))
      )
      .slice(0, 5)
      .map((inv: any) => ({
        id: inv.id,
        type: "invoice",
        title: inv.invoice_number,
        subtitle: `Client: ${inv.client_name || "Unknown"} (Amount: ${inv.currency === 'USD' ? '$' : 'AFN '}${inv.total_amount})`,
        date: inv.date,
      }))
    results.push(...invoiceResults)

    // 3. Search Accounts
    const accounts = await getAllAccounts()
    const accountResults = accounts
      .filter((acc: any) => 
        (acc.name?.toLowerCase().includes(query)) ||
        (acc.company_name?.toLowerCase().includes(query))
      )
      .slice(0, 5)
      .map((acc: any) => ({
        id: acc.id,
        type: "account",
        title: acc.name,
        subtitle: `${acc.company_name || ""} (Balance: ${acc.balance_usd || 0} USD)`,
        date: acc.created_at,
      }))
    results.push(...accountResults)

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Global Search Error:", error)
    return NextResponse.json({ error: "Failed to search" }, { status: 500 })
  }
}
