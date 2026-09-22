import { db } from '@/lib/db'
import { accounts, companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// GET all accounts
export async function GET() {
  try {
    const allAccounts = await db.select().from(accounts)
    return NextResponse.json(allAccounts)
  } catch (error) {
    console.error('[v0] Error fetching accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

// CREATE a new account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Account name is required' }, { status: 400 })
    }

    const id = uuidv4()
    await db.insert(accounts).values({
      id,
      name,
    })

    const created = await db.select().from(accounts).where(eq(accounts.id, id))
    return NextResponse.json(created[0], { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating account:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}

// UPDATE an account
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name } = body

    if (!id) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    await db.update(accounts).set({ name, updatedAt: new Date() }).where(eq(accounts.id, id))

    const updated = await db.select().from(accounts).where(eq(accounts.id, id))
    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('[v0] Error updating account:', error)
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}

// DELETE an account
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    await db.delete(accounts).where(eq(accounts.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error deleting account:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
