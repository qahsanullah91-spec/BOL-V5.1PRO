import { NextResponse } from "next/server"
import { getPublicHealth, getFullHealthReport } from "@/lib/database/health"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isFull = searchParams.get("full") === "true"

    if (isFull) {
      const fullReport = await getFullHealthReport()
      const statusCode = fullReport.status === "error" ? 503 : 200
      return NextResponse.json(fullReport, { status: statusCode })
    }

    const health = await getPublicHealth(false)
    return NextResponse.json(health, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { status: "unhealthy", error: error?.message || "Internal error" },
      { status: 500 }
    )
  }
}

