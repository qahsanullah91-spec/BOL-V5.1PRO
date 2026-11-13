import { NextRequest, NextResponse } from 'next/server'
import { extractStructuredData, normalizeGeminiModel } from '@/lib/ai/ai-provider'
import {
  BOL_EXTRACTION_JSON_SCHEMA,
  LEDGER_EXTRACTION_JSON_SCHEMA,
} from '@/lib/ai/schemas/bol-schema'
import { WhatsAppParser } from '@/lib/services/whatsapp-parser'
import { runComprehensiveVerification } from '@/lib/ai/smart-verification'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text = '', type = 'bol', model, payload } = body

    // 1. Verification Audit Mode
    if (type === 'verify') {
      const auditResult = await runComprehensiveVerification({
        account: payload?.account,
        transactions: payload?.transactions,
        shipment: payload?.shipment,
        useAiSynthesis: payload?.useAiSynthesis ?? true,
      })
      return NextResponse.json({
        success: true,
        audit: auditResult,
      })
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Text content is required for structured extraction.' },
        { status: 400 }
      )
    }

    const effectiveModel = normalizeGeminiModel(model)

    // 2. Bill of Lading Structured Extraction
    if (type === 'bol') {
      const prompt = `Extract all Bill of Lading shipment, border transit, and multi-modal routing particulars from this text:\n\n${text}`
      const extracted = await extractStructuredData<Record<string, any>>(
        prompt,
        BOL_EXTRACTION_JSON_SCHEMA,
        {
          systemPrompt:
            'You are Sky Ariana AI Logistics Extractor. Extract exact consignee, shipper, Afghan border station (e.g. Islam Qala, Torghundi, Hairatan, Spin Boldak), truck/driver details, cargo weights, carton count, and multi-modal transit routes. Output strict JSON matching the schema.',
        }
      )

      if (extracted?.data) {
        return NextResponse.json({
          success: true,
          method: 'gemini',
          modelUsed: extracted.modelUsed,
          data: extracted.data,
        })
      }

      // Offline deterministic fallback via WhatsAppParser
      const fallbackParsed = WhatsAppParser.parseText(text)
      const mapped = fallbackParsed.mappedRow || {}
      return NextResponse.json({
        success: true,
        method: 'offline_deterministic',
        modelUsed: 'local_deterministic_parser',
        data: {
          consignee_name: mapped.consignee || 'Afghan Consignee',
          cargo_description: mapped.commodity || text.slice(0, 100),
          number_of_packages: mapped.packages ? `${mapped.packages} Cartons` : undefined,
          net_weight: mapped.netWeight ? `${mapped.netWeight} KGS` : undefined,
          gross_weight: mapped.grossWeight ? `${mapped.grossWeight} KGS` : undefined,
          truck_number: mapped.truckNumber,
          driver_name: mapped.driver,
          driver_rent: mapped.rate,
          transit_border_station: mapped.route || 'Islam Qala',
          rate_per_kgs: mapped.rate ? `$${mapped.rate} / KG` : undefined,
          goods_value: undefined,
        },
        warnings: ['Gemini API unavailable; generated via local deterministic parser.'],
      })
    }

    // 3. Financial Ledger Structured Extraction
    if (type === 'ledger') {
      const prompt = `Extract financial transaction details (amount, currency USD/AFN, date, description, type) from this record:\n\n${text}`
      const extracted = await extractStructuredData<Record<string, any>>(
        prompt,
        LEDGER_EXTRACTION_JSON_SCHEMA,
        {
          systemPrompt:
            'You are Sky Ariana AI Accounting Extractor. Enforce strict currency segregation (USD vs AFN) and identify debit vs credit accurately.',
        }
      )

      if (extracted?.data) {
        return NextResponse.json({
          success: true,
          method: 'gemini',
          modelUsed: extracted.modelUsed,
          data: extracted.data,
        })
      }

      // Deterministic regex fallback for financial transaction
      const isUSD = /\$|usd|dollar/i.test(text)
      const isAFN = /afn|afghani|افغانی/i.test(text)
      const currency = isAFN ? 'AFN' : 'USD'

      const amountMatch = text.match(/([\d,]+(?:\.\d+)?)/)
      const rawNum = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0

      const isPayment = /paid|payment|credit|دریافت|رسید/i.test(text)

      return NextResponse.json({
        success: true,
        method: 'offline_deterministic',
        modelUsed: 'local_deterministic_parser',
        data: {
          account_name: 'Cash / Transfer Account',
          transaction_date: new Date().toISOString().split('T')[0],
          transaction_type: isPayment ? 'payment' : 'charge',
          description: text.trim().slice(0, 120),
          debit: isPayment ? 0 : rawNum,
          credit: isPayment ? rawNum : 0,
          currency,
          payment_method: 'Cash',
        },
        warnings: ['Gemini API unavailable; generated via local deterministic parser.'],
      })
    }

    return NextResponse.json(
      { success: false, error: `Unsupported extraction type: ${type}` },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal extraction error' },
      { status: 500 }
    )
  }
}
