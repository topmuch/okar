import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// POST - Upload vehicle image
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const vehicleId = formData.get('vehicleId') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'VehicleId requis' },
        { status: 400 }
      )
    }

    // Verify vehicle exists
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId }
    })

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Véhicule non trouvé' },
        { status: 404 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Type de fichier non autorisé. Utilisez JPEG, PNG, WebP ou GIF.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Le fichier est trop volumineux. Maximum 5MB.' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'vehicles')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${vehicleId}-${Date.now()}.${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Generate public URL
    const imageUrl = `/uploads/vehicles/${fileName}`

    // Update vehicle with image URL
    const updatedVehicle = await db.vehicle.update({
      where: { id: vehicleId },
      data: { image: imageUrl }
    })

    return NextResponse.json({
      success: true,
      message: 'Image uploadée avec succès',
      data: {
        imageUrl,
        vehicle: updatedVehicle
      }
    })

  } catch (error) {
    console.error('Upload vehicle image error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de l\'upload' },
      { status: 500 }
    )
  }
}
