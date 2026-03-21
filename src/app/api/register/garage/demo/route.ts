import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { nanoid } from 'nanoid'

// Generate secure random password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(10)
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(bytes[i] % chars.length)
  }
  return password
}

// Generate slug from name
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30)
  const suffix = nanoid(4).toLowerCase()
  return `${base}-${suffix}`
}

// Generate unique garage email
function generateGarageEmail(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15)
  const suffix = nanoid(4).toLowerCase()
  return `${base}_${suffix}@okar.demo`
}

/**
 * POST /api/register/garage/demo
 * 
 * Quick registration for garages with demo mode
 * Creates: Garage (DEMO status) + User account + Demo data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, city } = body

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Le nom du garage doit contenir au moins 2 caractères'
      }, { status: 400 })
    }

    if (!phone || phone.replace(/\D/g, '').length < 9) {
      return NextResponse.json({
        success: false,
        error: 'Numéro de téléphone inval'
      }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\D/g, '')
    const formattedPhone = `+221 ${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 5)} ${cleanPhone.slice(5, 7)} ${cleanPhone.slice(7, 9)}`

    // Check if phone already exists
    const existingGarage = await db.garage.findFirst({
      where: {
        OR: [
          { phone: formattedPhone },
          { whatsappNumber: formattedPhone }
        ]
      }
    })

    if (existingGarage) {
      return NextResponse.json({
        success: false,
        error: 'Ce numéro est déjà associé à un garage'
      }, { status: 400 })
    }

    // Generate credentials
    const tempPassword = generateTempPassword()
    const hashedPassword = await bcrypt.hash(tempPassword, 12)
    const email = generateGarageEmail(name)
    const slug = generateSlug(name)
    const garageId = nanoid()

    // Create garage with DEMO status
    const garage = await db.garage.create({
      data: {
        id: garageId,
        name: name.trim(),
        slug,
        phone: formattedPhone,
        whatsappNumber: formattedPhone,
        address: city,
        isCertified: false,
        active: true,
        validationStatus: 'DEMO', // Special status for demo mode
        managerName: name.trim(),
        managerPhone: formattedPhone,
      }
    })

    // Create user account
    const user = await db.user.create({
      data: {
        email,
        name: name.trim(),
        phone: formattedPhone,
        password: hashedPassword,
        role: 'garage',
        garageId: garage.id,
        emailVerified: true, // Auto-verify for demo
      }
    })

    // Create demo QR lot (10 QR codes for testing)
    await db.qRCodeLot.create({
      data: {
        prefix: `DEMO-${nanoid(4).toUpperCase()}`,
        count: 10,
        status: 'ASSIGNED',
        assignedToId: garage.id,
      }
    })

    // Create demo profile
    await db.garageProfile.create({
      data: {
        garageId: garage.id,
        subscriptionTier: 'FREE',
        badgeVerified: false,
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'DEMO_REGISTRATION',
        entityType: 'GARAGE',
        entityId: garage.id,
        userId: user.id,
        userEmail: email,
        garageId: garage.id,
        details: JSON.stringify({
          garageName: name,
          phone: formattedPhone,
          city,
          mode: 'DEMO'
        })
      }
    })

    // Create notification for admin
    await db.notification.create({
      data: {
        type: 'NEW_DEMO_REGISTRATION',
        message: `Nouvelle inscription Démo: ${name} (${formattedPhone}) - ${city}`,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Compte démo créé avec succès',
      garage: {
        id: garage.id,
        name: garage.name,
        slug: garage.slug,
        validationStatus: garage.validationStatus
      },
      credentials: {
        email,
        tempPassword
      },
      info: 'Mode Démo activé. Validation sous 24-48h.'
    })

  } catch (error) {
    console.error('Demo registration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la création du compte'
    }, { status: 500 })
  }
}
