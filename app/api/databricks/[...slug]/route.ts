import { NextRequest, NextResponse } from 'next/server'

const DATABRICKS_BACKEND_URL = process.env.DATABRICKS_BACKEND_URL || 'http://127.0.0.1:8008'

interface RouteContext {
  params: Promise<{
    slug?: string[]
  }>
}

// Fallback dataset when local backend is starting or offline
const FALLBACK_BOLS = [
  ["BOL-2026-001", "Al-Bari Steel Ltd", "Herat", "Islam Qala", "Mashhad", "Steel Rebar & Billets", "450 Bundles", 32500.0, 31800.0, 2450.0, "Delivered", "2026-11-01"],
  ["BOL-2026-002", "Ariana Food Trading", "Kabul", "Torghundi", "Ashgabat", "Fresh Fruit & Dry Fruits", "1200 Cartons", 18200.0, 17500.0, 1850.0, "In Transit", "2026-11-03"],
  ["BOL-2026-003", "Balkh Cotton Processing", "Mazar-i-Sharif", "Hairatan", "Termez", "Cotton Yarn 20s", "800 Bales", 24000.0, 23500.0, 1950.0, "Customs Cleared", "2026-11-05"],
  ["BOL-2026-004", "Kandahar Pomegranate Corp", "Kandahar", "Spin Boldak", "Chaman", "Organic Pomegranates", "1500 Crates", 21000.0, 20200.0, 1600.0, "Delivered", "2026-11-07"],
  ["BOL-2026-005", "Pamir Minerals Export", "Kunduz", "Hairatan", "Tashkent", "Talc Powder & Minerals", "600 Bags", 28000.0, 27400.0, 2200.0, "In Transit", "2026-11-10"],
  ["BOL-2026-006", "Global Transit Logistics", "Herat", "Islam Qala", "Dogharoon", "Industrial Machinery Parts", "42 Cases", 15400.0, 14900.0, 3100.0, "Port Origin", "2026-11-12"],
]

const FALLBACK_COLUMNS = [
  "bol_number", "consignee", "origin", "transit_border", "destination",
  "commodity", "packages", "gross_weight_kg", "net_weight_kg", "freight_charge_usd", "status", "created_at"
]

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params
  const path = slug ? slug.join('/') : ''
  const searchParams = request.nextUrl.searchParams.toString()
  const targetUrl = `${DATABRICKS_BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ''}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3500)
    
    const backendRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (backendRes.ok) {
      const data = await backendRes.json()
      return NextResponse.json(data)
    }
  } catch (error) {
    // Graceful fallback if python backend is momentarily offline
  }

  // Fallbacks
  if (path === 'health') {
    return NextResponse.json({
      status: 'healthy (fallback_proxy)',
      simulation_mode: true,
      app_service_principal: false,
      warehouse_configured: true,
      lakebase_pool_active: false,
      vector_search_ready: true,
      timestamp: new Date().toISOString(),
    })
  }

  if (path.includes('me')) {
    return NextResponse.json({
      user_name: 'developer@skyariana.com',
      id: 'sky-dev-001',
      display_name: 'Sky Ariana Lead Logistics Analyst',
      active: true,
      mode: 'simulation_fallback',
      roles: ['app_admin', 'logistics_auditor', 'bol_officer']
    })
  }

  if (path.includes('search')) {
    const query = request.nextUrl.searchParams.get('query') || 'logistics'
    return NextResponse.json({
      results: [
        {
          id: 'doc-vec-fallback-1',
          document_text: `Bill of Lading manifest for BOL-2026-001 (Al-Bari Steel Ltd): Steel Rebar & Billets, Net Weight: 31800 kg via Islam Qala. Query: ${query}`,
          metadata: { bol_number: 'BOL-2026-001', border: 'Islam Qala', commodity: 'Steel Rebar & Billets', destination: 'Mashhad' },
          score: 0.965
        },
        {
          id: 'doc-vec-fallback-2',
          document_text: `Bill of Lading manifest for BOL-2026-002 (Ariana Food Trading): Fresh Fruit & Dry Fruits, Net Weight: 17500 kg via Torghundi. Query: ${query}`,
          metadata: { bol_number: 'BOL-2026-002', border: 'Torghundi', commodity: 'Fresh Fruit & Dry Fruits', destination: 'Ashgabat' },
          score: 0.912
        }
      ],
      index: 'simulated_logistics_index',
      mode: 'fallback'
    })
  }

  return NextResponse.json({ error: 'Endpoint not found on Databricks proxy' }, { status: 404 })
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params
  const path = slug ? slug.join('/') : ''
  const targetUrl = `${DATABRICKS_BACKEND_URL}/${path}`
  let body: any = {}

  try {
    body = await request.json()
  } catch {
    body = {}
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    const backendRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (backendRes.ok) {
      const data = await backendRes.json()
      return NextResponse.json(data)
    }
  } catch (error) {
    // Fallback logic below
  }

  if (path.includes('sql')) {
    const queryStr = (body.query || '').toUpperCase()
    if (queryStr.includes('COUNT')) {
      return NextResponse.json({ columns: ['total_shipments', 'active_transit'], rows: [[FALLBACK_BOLS.length, 2]] })
    }
    if (queryStr.includes('SUM') || queryStr.includes('METRIC')) {
      const totalWt = FALLBACK_BOLS.reduce((acc, r) => acc + (r[8] as number), 0)
      const totalFreight = FALLBACK_BOLS.reduce((acc, r) => acc + (r[9] as number), 0)
      return NextResponse.json({ columns: ['total_net_weight_kg', 'total_freight_usd'], rows: [[totalWt, totalFreight]] })
    }
    return NextResponse.json({ columns: FALLBACK_COLUMNS, rows: FALLBACK_BOLS })
  }

  if (path.includes('chat')) {
    const msg = (body.message || '').toLowerCase()
    let reply = `[Mosaic AI Llama-3.3-70b-instruct]: Query received: "${body.message}". All cross-border shipments and customs transit documents conform to Sky Ariana international regulations.`
    if (msg.includes('rate') || msg.includes('freight') || msg.includes('cost')) {
      reply = 'Based on recent border station tariff rates, standard freight from Herat (Islam Qala) to Mashhad averages $75/MT for steel and dry cargo. Demurrage allowances standard is 72 hours free time at terminal.'
    } else if (msg.includes('border') || msg.includes('customs') || msg.includes('transit')) {
      reply = 'Current transit border status: Islam Qala (Normal, avg clearance 4.2h), Torghundi (Normal, avg clearance 3.8h), Hairatan (High flow, rail-to-truck transfer operating 24/7). All T1 customs declarations require valid chamber stamps.'
    }
    return NextResponse.json({ reply, model: 'databricks-meta-llama-3-3-70b-instruct', mode: 'simulation' })
  }

  if (path.includes('lakebase')) {
    return NextResponse.json({
      status: 'recorded',
      actor: 'developer@skyariana.com',
      storage: 'fallback_mock',
      id: Math.floor(Math.random() * 1000)
    })
  }

  return NextResponse.json({ status: 'ok', fallback: true })
}
