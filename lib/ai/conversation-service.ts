/**
 * Sky Ariana AI Operations Assistant - Conversation Persistence Service
 * Stores and manages long-lived conversations, search indexes, and message threads.
 * Uses atomic file operations (.tmp -> rename) to protect business continuity.
 * Strictly enforces user and workspace isolation.
 */

import { readJsonFile, mutateJsonFile } from '@/lib/services/blob-db'
import { getDataPath } from '@/lib/server-paths'
import { AIConversation, AIChatMessage, AIUserSessionContext } from '@/lib/types/ai-assistant'

const CONVERSATIONS_FILE = getDataPath('.local-ai-conversations.json')

function isPrivilegedUser(user?: string | AIUserSessionContext): boolean {
  if (!user || typeof user === 'string') return false
  const role = String(user.role || '').toLowerCase()
  return role === 'superadmin' || role === 'admin'
}

function getUserId(user?: string | AIUserSessionContext): string | undefined {
  if (!user) return undefined
  if (typeof user === 'string') return user
  return user.userId
}

export async function listConversations(user?: string | AIUserSessionContext): Promise<AIConversation[]> {
  const all = await readJsonFile<AIConversation[]>(CONVERSATIONS_FILE, [])
  const userId = getUserId(user)
  const isPrivileged = isPrivilegedUser(user)

  let filtered = all
  if (userId && !isPrivileged) {
    filtered = all.filter((c) => !c.userId || c.userId === userId || c.userId === 'all')
  }

  // Sort descending by updatedAt
  return filtered.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export async function getConversation(
  id: string,
  user?: string | AIUserSessionContext
): Promise<AIConversation | null> {
  const all = await readJsonFile<AIConversation[]>(CONVERSATIONS_FILE, [])
  const convo = all.find((c) => c.id === id) || null
  if (!convo) return null

  const userId = getUserId(user)
  const isPrivileged = isPrivilegedUser(user)

  if (userId && !isPrivileged && convo.userId && convo.userId !== userId && convo.userId !== 'all') {
    // User does not own this conversation
    return null
  }

  return convo
}

export async function saveConversation(
  conversation: AIConversation,
  user?: string | AIUserSessionContext
): Promise<AIConversation> {
  const now = new Date().toISOString()
  const userId = getUserId(user) || conversation.userId

  const updatedConvo: AIConversation = {
    ...conversation,
    userId: userId || conversation.userId,
    updatedAt: now,
    messageCount: conversation.messages.length,
    lastPreview:
      conversation.messages.length > 0
        ? conversation.messages[conversation.messages.length - 1].content.slice(0, 100)
        : '',
  }

  await mutateJsonFile<AIConversation[]>(CONVERSATIONS_FILE, [], (list) => {
    const idx = list.findIndex((c) => c.id === updatedConvo.id)
    if (idx >= 0) {
      list[idx] = updatedConvo
    } else {
      list.unshift(updatedConvo)
    }
    return list
  })

  return updatedConvo
}

export async function renameConversation(
  id: string,
  newTitle: string,
  user?: string | AIUserSessionContext
): Promise<boolean> {
  const convo = await getConversation(id, user)
  if (!convo) return false

  let found = false
  await mutateJsonFile<AIConversation[]>(CONVERSATIONS_FILE, [], (list) => {
    const item = list.find((c) => c.id === id)
    if (item) {
      item.title = newTitle.trim() || item.title
      item.updatedAt = new Date().toISOString()
      found = true
    }
    return list
  })
  return found
}

export async function deleteConversation(
  id: string,
  user?: string | AIUserSessionContext
): Promise<boolean> {
  const convo = await getConversation(id, user)
  if (!convo) return false

  let removed = false
  await mutateJsonFile<AIConversation[]>(CONVERSATIONS_FILE, [], (list) => {
    const initLen = list.length
    const remaining = list.filter((c) => c.id !== id)
    removed = remaining.length < initLen
    return remaining
  })
  return removed
}

export async function searchConversations(
  query: string,
  user?: string | AIUserSessionContext
): Promise<AIConversation[]> {
  const accessible = await listConversations(user)
  const q = query.trim().toLowerCase()
  if (!q) return accessible

  return accessible.filter((c) => {
    if (c.title.toLowerCase().includes(q)) return true
    return c.messages.some((m) => m.content.toLowerCase().includes(q))
  })
}
