import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparePassword } from '@/lib/utils'
import { createSession, logLoginAttempt } from '@/lib/session'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
  role: z.string().optional(), // Optional role check for admin login
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides' },
        { status: 400 }
      )
    }

    const { email, password, role } = validationResult.data

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        garage: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            logo: true,
            isVerified: true,
          }
        }
      }
    })

    if (!user) {
      await logLoginAttempt({ email, success: false, failureReason: 'User not found' })
      return NextResponse.json(
        { success: false, error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      await logLoginAttempt({ userId: user.id, email, success: false, failureReason: 'Account disabled' })
      return NextResponse.json(
        { success: false, error: 'Votre compte a été désactivé' },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      await logLoginAttempt({ userId: user.id, email, success: false, failureReason: 'Invalid password' })
      return NextResponse.json(
        { success: false, error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // If role is specified (admin login), check if user has correct role
    if (role === 'superadmin' && !['superadmin', 'admin', 'agent'].includes(user.role)) {
      await logLoginAttempt({ userId: user.id, email, success: false, failureReason: 'Insufficient privileges' })
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé. Vous n\'êtes pas administrateur.' },
        { status: 403 }
      )
    }

    // Create session (sets HTTP-only cookie)
    await createSession(user.id)

    // Log successful login
    await logLoginAttempt({ userId: user.id, email, success: true })

    // Return user data (without password) - use 'user' key for frontend compatibility
    const { password: _, ...userWithoutPassword } = user

    const userData = {
      ...userWithoutPassword,
      garageId: user.garageId,
      garage: user.garage,
    }

    return NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: userData,
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de la connexion' },
      { status: 500 }
    )
  }
}
