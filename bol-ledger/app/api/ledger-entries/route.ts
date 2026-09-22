import { db } from '@/lib/db'
import { accounts, companies, ledgerEntries } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// GET all ledger entries for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
    }

    const entries = await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.companyId, companyId))
      .orderBy(ledgerEntries.date)

    return NextResponse.json(entries)
  } catch (error) {
    console.error('[v0] Error fetching ledger entries:', error)
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}

// CREATE a new ledger entry or batch import entries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle batch import
    if (body.entries && Array.isArray(body.entries)) {
      const entriesToCreate = body.entries.map((entry: any) => ({
        id: uuidv4(),
        companyId: entry.company_id,
        date: entry.date,
        shipperDescription: entry.shipper_description || '',
        invoiceNo: entry.invoice_no || '',
        dateOfShip: entry.date_of_ship || '',
        billOfLanding: entry.bill_of_landing || '',
        containerNo: entry.container_no || '',
        consignee: entry.consignee || '',
        quantity: entry.quantity || '',
        debit: String(entry.debit || 0),
        credit: String(entry.credit || 0),
        balance: String(entry.balance || 0),
        pdfUrl: entry.pdf_url || null,
        pdfPathname: entry.pdf_pathname || null,
      }))

      if (entriesToCreate.length === 0) {
        return NextResponse.json({ error: 'No valid entries to import' }, { status: 400 })
      }

      // Insert all entries in a transaction-like manner
      for (const entry of entriesToCreate) {
        await db.insert(ledgerEntries).values(entry)
      }

      return NextResponse.json({
        success: true,
        imported: entriesToCreate.length,
        message: `Successfully imported ${entriesToCreate.length} entries`,
      }, { status: 201 })
    }

    // Handle single entry creation
    const {
      companyId,
      date,
      shipperDescription,
      invoiceNo,
      dateOfShip,
      billOfLanding,
      containerNo,
      consignee,
      quantity,
      debit,
      credit,
      balance,
      pdfUrl,
      pdfPathname,
    } = body

    if (!companyId || !date) {
      return NextResponse.json({ error: 'Company ID and date are required' }, { status: 400 })
    }

    const id = uuidv4()
    await db.insert(ledgerEntries).values({
      id,
      companyId,
      date,
      shipperDescription,
      invoiceNo,
      dateOfShip,
      billOfLanding,
      containerNo,
      consignee,
      quantity,
      debit: String(debit || 0),
      credit: String(credit || 0),
      balance: String(balance || 0),
      pdfUrl,
      pdfPathname,
    })

    const created = await db.select().from(ledgerEntries).where(eq(ledgerEntries.id, id))
    return NextResponse.json(created[0], { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating ledger entry:', error)
    const message = error instanceof Error ? error.message : 'Failed to create entry'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// UPDATE a ledger entry
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 })
    }

    await db
      .update(ledgerEntries)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(ledgerEntries.id, id))

    const updated = await db.select().from(ledgerEntries).where(eq(ledgerEntries.id, id))
    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('[v0] Error updating ledger entry:', error)
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
  }
}

// DELETE a ledger entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 })
    }

    await db.delete(ledgerEntries).where(eq(ledgerEntries.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error deleting ledger entry:', error)
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }
}
