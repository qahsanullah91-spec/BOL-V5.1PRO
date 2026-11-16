import { NextRequest, NextResponse } from 'next/server'
import {
  listConversations,
  getConversation,
  saveConversation,
  renameConversation,
  deleteConversation,
  searchConversations,
} from '@/lib/ai/conversation-service'
import { AIUserSessionContext } from '@/lib/types/ai-assistant'

function extractSessionUser(request: NextRequest, body?: any): AIUserSessionContext | undefined {
  const userId = request.headers.get('x-user-id') || body?.userContext?.userId || body?.userContext?.id
  const role = request.headers.get('x-user-role') || body?.userContext?.role || 'viewer'
  if (!userId) return undefined
  return {
    userId,
    username: request.headers.get('x-user-name') || body?.userContext?.username || 'user',
    name: body?.userContext?.name || 'Staff User',
    role,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const userId = searchParams.get('userId') || undefined
    const id = searchParams.get('id')
    const userRole = searchParams.get('role') || 'viewer'
    const userContext: AIUserSessionContext | undefined = userId
      ? { userId, username: userId, name: userId, role: userRole }
      : undefined

    if (id) {
      const convo = await getConversation(id, userContext)
      if (!convo) {
        return NextResponse.json({ success: false, error: 'Conversation not found or access denied.' }, { status: 404 })
      }
      return NextResponse.json({ success: true, conversation: convo })
    }

    if (query) {
      const results = await searchConversations(query, userContext)
      return NextResponse.json({ success: true, conversations: results })
    }

    const list = await listConversations(userContext)
    return NextResponse.json({ success: true, conversations: list })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversation, userContext } = body
    if (!conversation || !conversation.id) {
      return NextResponse.json(
        { success: false, error: 'Valid conversation object required' },
        { status: 400 }
      )
    }

    const user = extractSessionUser(request, body) || userContext
    const saved = await saveConversation(conversation, user)
    return NextResponse.json({ success: true, conversation: saved })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, userContext } = body
    if (!id || !title) {
      return NextResponse.json(
        { success: false, error: 'id and title required' },
        { status: 400 }
      )
    }

    const user = extractSessionUser(request, body) || userContext
    const ok = await renameConversation(id, title, user)
    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'Could not rename conversation: not found or unauthorized.' },
        { status: 403 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')
    let body: any = {}
    if (!id) {
      body = await request.json().catch(() => ({}))
      id = body.id
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Conversation id required' },
        { status: 400 }
      )
    }

    const user = extractSessionUser(request, body)
    const ok = await deleteConversation(id, user)
    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'Could not delete conversation: not found or unauthorized.' },
        { status: 403 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
