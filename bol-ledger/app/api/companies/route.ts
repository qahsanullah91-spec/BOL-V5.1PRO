import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// GET all companies for an account
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    const allCompanies = await db.select().from(companies).where(eq(companies.accountId, accountId))
    return NextResponse.json(allCompanies)
  } catch (error) {
    console.error('[v0] Error fetching companies:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

// CREATE a new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountId, name } = body

    if (!accountId || !name) {
      return NextResponse.json({ error: 'Account ID and name are required' }, { status: 400 })
    }

    const id = uuidv4()
    await db.insert(companies).values({
      id,
      accountId,
      name,
    })

    const created = await db.select().from(companies).where(eq(companies.id, id))
    return NextResponse.json(created[0], { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating company:', error)
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}

// UPDATE a company
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name } = body

    if (!id) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
    }

    await db.update(companies).set({ name, updatedAt: new Date() }).where(eq(companies.id, id))

    const updated = await db.select().from(companies).where(eq(companies.id, id))
    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('[v0] Error updating company:', error)
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

// DELETE a company
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
    }

    await db.delete(companies).where(eq(companies.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error deleting company:', error)
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  }
}
