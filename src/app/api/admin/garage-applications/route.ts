import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// GET all garage applications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where: Record<string, unknown> = {}
    if (status && ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status
    }

    const applications = await db.garageApplication.findMany({
      where,
      orderBy: { submittedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: applications,
    })

  } catch (error) {
    console.error('Get garage applications error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

// Schema for updating application status
const updateStatusSchema = z.object({
  applicationId: z.string(),
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']),
  adminNotes: z.string().optional(),
  reviewedBy: z.string().optional(),
})

// PUT to update application status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validationResult = updateStatusSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides' },
        { status: 400 }
      )
    }

    const { applicationId, status, adminNotes, reviewedBy } = validationResult.data

    // Update the application
    const application = await db.garageApplication.update({
      where: { id: applicationId },
      data: {
        status,
        adminNotes: adminNotes || null,
        reviewedBy,
        reviewedAt: new Date(),
      }
    })

    // If approved, create a garage and user account
    if (status === 'APPROVED') {
      // Create a user account for the garage
      const existingUser = await db.user.findUnique({
        where: { email: application.email.toLowerCase() }
      })

      let userId: string

      if (existingUser) {
        userId = existingUser.id
      } else {
        // Create a temporary password
        const tempPassword = Math.random().toString(36).substring(2, 15)
        const bcrypt = require('bcryptjs')
        const hashedPassword = await bcrypt.hash(tempPassword, 10)

        const newUser = await db.user.create({
          data: {
            email: application.email.toLowerCase(),
            password: hashedPassword,
            name: application.businessName,
            phone: application.phone,
            role: 'GARAGE',
            isActive: true,
          }
        })
        userId = newUser.id

        // In a real app, send an email with the temporary password
        console.log(`Created garage user account: ${application.email} with temp password`)
      }

      // Create the garage
      const garage = await db.garage.create({
        data: {
          name: application.businessName,
          address: application.address,
          city: application.city,
          phone: application.phone,
          email: application.email,
          description: application.description,
          userId: userId,
          isActive: true,
          isVerified: true,
        }
      })

      // Update application with garage ID
      await db.garageApplication.update({
        where: { id: applicationId },
        data: { garageId: garage.id }
      })

      // Create notification for the user
      await db.notification.create({
        data: {
          userId: userId,
          title: 'Votre garage est approuvé !',
          message: `Félicitations ! Votre garage "${application.businessName}" a été approuvé. Vous pouvez maintenant accéder à votre tableau de bord.`,
          type: 'SUCCESS',
          actionUrl: '/dashboard',
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: application,
    })

  } catch (error) {
    console.error('Update garage application error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de la mise à jour' },
      { status: 500 }
    )
  }
}
