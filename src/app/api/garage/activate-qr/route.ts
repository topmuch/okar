import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema
const activateQrSchema = z.object({
  garageId: z.string(),
  userId: z.string(),
})

// POST - Activate QR code for garage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validationResult = activateQrSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides' },
        { status: 400 }
      )
    }

    const { garageId, userId } = validationResult.data

    // Verify the garage belongs to the user
    const garage = await db.garage.findFirst({
      where: { 
        id: garageId,
        userId 
      }
    })

    if (!garage) {
      return NextResponse.json(
        { success: false, error: 'Garage non trouvé ou accès non autorisé' },
        { status: 404 }
      )
    }

    // Generate unique QR code identifier
    const qrCode = `OKAR-${garageId.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

    // Update garage with QR code
    const updatedGarage = await db.garage.update({
      where: { id: garageId },
      data: { 
        qrCode,
        isActive: true 
      }
    })

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: 'QR Code activé',
        message: `Le QR code pour ${garage.name} a été activé avec succès. Partagez-le avec vos clients.`,
        type: 'SUCCESS',
        actionUrl: '/dashboard',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'QR Code activé avec succès',
      data: {
        garage: updatedGarage,
        qrCode,
        qrUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/garage/${qrCode}`
      }
    })

  } catch (error) {
    console.error('Activate QR error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de l\'activation du QR code' },
      { status: 500 }
    )
  }
}

// GET - Get garage QR code info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const garageId = searchParams.get('garageId')
    const userId = searchParams.get('userId')

    if (!garageId || !userId) {
      return NextResponse.json(
        { success: false, error: 'GarageId et userId requis' },
        { status: 400 }
      )
    }

    const garage = await db.garage.findFirst({
      where: { 
        id: garageId,
        userId 
      }
    })

    if (!garage) {
      return NextResponse.json(
        { success: false, error: 'Garage non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        garage,
        qrUrl: garage.qrCode 
          ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/garage/${garage.qrCode}`
          : null
      }
    })

  } catch (error) {
    console.error('Get garage QR error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
