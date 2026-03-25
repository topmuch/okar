import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'UserId requis' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { userId }
    if (unreadOnly) {
      where.isRead = false
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = await db.notification.count({
      where: { userId, isRead: false }
    })

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    })

  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

// Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, userId } = body

    if (!notificationId || !userId) {
      return NextResponse.json(
        { success: false, error: 'NotificationId et userId requis' },
        { status: 400 }
      )
    }

    const notification = await db.notification.update({
      where: { 
        id: notificationId,
        userId // Ensure the notification belongs to the user
      },
      data: {
        isRead: true,
        readAt: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Notification marquée comme lue',
      data: notification,
    })

  } catch (error) {
    console.error('Mark notification read error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

// Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'UserId requis' },
        { status: 400 }
      )
    }

    await db.notification.updateMany({
      where: { 
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues',
    })

  } catch (error) {
    console.error('Mark all notifications read error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
