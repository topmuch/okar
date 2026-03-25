import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for vehicle
const vehicleSchema = z.object({
  make: z.string().min(1, 'Marque requise'),
  model: z.string().min(1, 'Modèle requis'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  licensePlate: z.string().min(1, 'Immatriculation requise'),
  vin: z.string().optional(),
  color: z.string().optional(),
  mileage: z.number().int().min(0).optional(),
  fuelType: z.enum(['DIESEL', 'GASOLINE', 'ELECTRIC', 'HYBRID']).optional(),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']).optional(),
  ownerId: z.string(),
  image: z.string().optional(), // Base64 or URL
})

// GET vehicles for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const vehicleId = searchParams.get('vehicleId')

    if (vehicleId) {
      const vehicle = await db.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          documents: true,
          maintenanceRecords: { orderBy: { performedAt: 'desc' } }
        }
      })

      if (!vehicle) {
        return NextResponse.json(
          { success: false, error: 'Véhicule non trouvé' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: vehicle,
      })
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'UserId requis' },
        { status: 400 }
      )
    }

    const vehicles = await db.vehicle.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: vehicles,
    })

  } catch (error) {
    console.error('Get vehicles error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

// POST create a new vehicle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validationResult = vehicleSchema.safeParse(body)
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

    const { ownerId, licensePlate, vin, image, ...vehicleData } = validationResult.data

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: ownerId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Check if license plate already exists
    const existingVehicle = await db.vehicle.findUnique({
      where: { licensePlate: licensePlate.toUpperCase() }
    })

    if (existingVehicle) {
      return NextResponse.json(
        { success: false, error: 'Un véhicule avec cette immatriculation existe déjà' },
        { status: 409 }
      )
    }

    // Check VIN if provided
    if (vin) {
      const existingVin = await db.vehicle.findUnique({
        where: { vin }
      })

      if (existingVin) {
        return NextResponse.json(
          { success: false, error: 'Un véhicule avec ce VIN existe déjà' },
          { status: 409 }
        )
      }
    }

    // Process image if provided (base64)
    let imageUrl = null
    if (image && image.startsWith('data:image')) {
      // In a real app, you would upload to a storage service
      // For now, we'll store a placeholder URL
      imageUrl = `/uploads/vehicles/${Date.now()}-vehicle.jpg`
      
      // In production, use something like:
      // const uploadedUrl = await uploadToStorage(image)
      // imageUrl = uploadedUrl
    } else if (image) {
      imageUrl = image
    }

    // Create vehicle
    const vehicle = await db.vehicle.create({
      data: {
        ...vehicleData,
        licensePlate: licensePlate.toUpperCase(),
        vin: vin?.toUpperCase() || null,
        image: imageUrl,
        ownerId,
      }
    })

    // Create notification for the user
    await db.notification.create({
      data: {
        userId: ownerId,
        title: 'Nouveau véhicule ajouté',
        message: `Votre ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate}) a été ajouté avec succès.`,
        type: 'SUCCESS',
        actionUrl: `/dashboard/vehicles/${vehicle.id}`,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Véhicule créé avec succès',
      data: vehicle,
    }, { status: 201 })

  } catch (error) {
    console.error('Create vehicle error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de la création du véhicule' },
      { status: 500 }
    )
  }
}

// PUT update a vehicle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleId, image, ...updateData } = body

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'VehicleId requis' },
        { status: 400 }
      )
    }

    // Process image if provided
    let imageUrl = undefined
    if (image && image.startsWith('data:image')) {
      imageUrl = `/uploads/vehicles/${Date.now()}-vehicle.jpg`
    } else if (image) {
      imageUrl = image
    }

    const vehicle = await db.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...updateData,
        ...(imageUrl && { image: imageUrl }),
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Véhicule mis à jour avec succès',
      data: vehicle,
    })

  } catch (error) {
    console.error('Update vehicle error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de la mise à jour' },
      { status: 500 }
    )
  }
}

// DELETE a vehicle
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'VehicleId requis' },
        { status: 400 }
      )
    }

    await db.vehicle.delete({
      where: { id: vehicleId }
    })

    return NextResponse.json({
      success: true,
      message: 'Véhicule supprimé avec succès',
    })

  } catch (error) {
    console.error('Delete vehicle error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de la suppression' },
      { status: 500 }
    )
  }
}
