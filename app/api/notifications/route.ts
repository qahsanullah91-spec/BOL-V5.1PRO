import { NextRequest, NextResponse } from 'next/server'
import {
  getNotificationsForUser,
  getNotificationMetricsForUser,
  markDeliveryAsRead,
  markAllDeliveriesAsRead,
  acknowledgeDelivery,
  snoozeDelivery,
  pinDelivery,
  createOrUpdateNotificationEvent,
  NotificationFilter,
} from '@/lib/notifications/notification-service'
import { runNotificationEvaluationPass } from '@/lib/notifications/notification-evaluator'
import { User, UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

function extractUserFromRequest(req: NextRequest): User {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('user') || req.headers.get('x-user-name') || 'admin'
  const role = (searchParams.get('role') || req.headers.get('x-user-role') || 'admin') as UserRole
  const clientId = searchParams.get('clientId') || undefined
  const clientName = searchParams.get('clientName') || undefined

  return {
    id: username,
    username,
    name: username,
    role,
    clientId,
    clientName,
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req)
    const { searchParams } = new URL(req.url)

    const category = (searchParams.get('category') as any) || undefined
    const severity = (searchParams.get('severity') as any) || undefined
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const criticalOnly = searchParams.get('criticalOnly') === 'true'
    const activeOnly = searchParams.get('activeOnly') !== 'false' // default active
    const search = searchParams.get('search') || undefined

    const filter: NotificationFilter = {
      category,
      severity,
      unreadOnly,
      criticalOnly,
      activeOnly,
      search,
    }

    const [notifications, metrics] = await Promise.all([
      getNotificationsForUser(user, filter),
      getNotificationMetricsForUser(user),
    ])

    return NextResponse.json({
      success: true,
      notifications,
      metrics,
    })
  } catch (error: any) {
    console.error('[API Notifications] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req)
    const body = await req.json()
    const { action, deliveryId, untilISO, pinned } = body

    if (action === 'markRead' && deliveryId) {
      const ok = await markDeliveryAsRead(deliveryId, user.username)
      return NextResponse.json({ success: ok })
    }

    if (action === 'markAllRead') {
      const count = await markAllDeliveriesAsRead(user.username)
      return NextResponse.json({ success: true, count })
    }

    if (action === 'acknowledge' && deliveryId) {
      const ok = await acknowledgeDelivery(deliveryId, user.username)
      return NextResponse.json({ success: ok })
    }

    if (action === 'snooze' && deliveryId && untilISO) {
      const ok = await snoozeDelivery(deliveryId, user.username, untilISO)
      return NextResponse.json({ success: ok })
    }

    if (action === 'pin' && deliveryId) {
      const ok = await pinDelivery(deliveryId, user.username, !!pinned)
      return NextResponse.json({ success: ok })
    }

    return NextResponse.json({ success: false, error: 'Invalid notification action' }, { status: 400 })
  } catch (error: any) {
    console.error('[API Notifications] PATCH error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Evaluation trigger
    if (body.action === 'evaluate') {
      const result = await runNotificationEvaluationPass()
      return NextResponse.json({ success: true, result })
    }

    // Manual or rule creation
    const { event } = body
    if (!event || !event.title) {
      return NextResponse.json({ success: false, error: 'Notification title is required' }, { status: 400 })
    }

    const res = await createOrUpdateNotificationEvent(event)
    return NextResponse.json({ success: true, event: res.event, created: res.created })
  } catch (error: any) {
    console.error('[API Notifications] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
