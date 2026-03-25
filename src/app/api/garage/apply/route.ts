import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for garage application
const garageApplicationSchema = z.object({
  businessName: z.string().min(2, 'Le nom du garage doit contenir au moins 2 caractères'),
  address: z.string().min(5, 'Adresse invalide'),
  city: z.string().min(2, 'Ville invalide'),
  phone: z.string().min(10, 'Numéro de téléphone invalide'),
  email: z.string().email('Email invalide'),
  description: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = garageApplicationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides', 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const { businessName, address, city, phone, email, description, contactName, contactPhone } = validationResult.data

    // Check if a pending application already exists for this email
    const existingApplication = await db.garageApplication.findFirst({
      where: {
        email: email.toLowerCase(),
        status: { in: ['PENDING', 'UNDER_REVIEW'] }
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Une demande est déjà en cours pour cet email. Veuillez attendre la réponse de notre équipe.' 
        },
        { status: 409 }
      )
    }

    // Create garage application
    const application = await db.garageApplication.create({
      data: {
        businessName,
        address,
        city,
        phone,
        email: email.toLowerCase(),
        description: description || null,
        status: 'PENDING',
        // Store additional contact info in documents field as JSON
        documents: contactName ? JSON.stringify({ contactName, contactPhone }) : null,
      }
    })

    // Create notification for admin (in a real app, this would notify admins)
    // For now, we'll just log it
    console.log(`New garage application: ${application.id} - ${businessName}`)

    return NextResponse.json({
      success: true,
      message: 'Votre demande a été envoyée avec succès',
      data: application,
    }, { status: 201 })

  } catch (error) {
    console.error('Garage application error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de l\'envoi de votre demande' },
      { status: 500 }
    )
  }
}

// GET endpoint to check application status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requis' },
        { status: 400 }
      )
    }

    const application = await db.garageApplication.findFirst({
      where: { email: email.toLowerCase() },
      orderBy: { submittedAt: 'desc' }
    })

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Aucune demande trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: application,
    })

  } catch (error) {
    console.error('Get application status error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
