import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/utils'
import { z } from 'zod'

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().optional().nullable(),
  role: z.enum(['DRIVER', 'OWNER', 'GARAGE']).default('DRIVER'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = registerSchema.safeParse(body)
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

    const { email, password, name, phone, role } = validationResult.data

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        phone: phone || null,
        role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    })

    // Create welcome notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Bienvenue sur OKAR !',
        message: `Bonjour ${name}, bienvenue sur OKAR. Commencez par ajouter votre premier véhicule.`,
        type: 'SUCCESS',
        actionUrl: '/dashboard',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      data: user,
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de l\'inscription' },
      { status: 500 }
    )
  }
}
