import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const plate = searchParams.get('plate')

    if (!plate) {
      return NextResponse.json(
        { success: false, error: 'Numéro d\'immatriculation requis' },
        { status: 400 }
      )
    }

    // Normaliser la plaque (majuscules, format)
    const normalizedPlate = plate.toUpperCase().trim()

    // Rechercher le véhicule
    const vehicle = await db.vehicle.findFirst({
      where: {
        OR: [
          { licensePlate: normalizedPlate },
          { licensePlate: { contains: normalizedPlate.replace(/[-\s]/g, '') } }
        ]
      },
      include: {
        garage: {
          select: {
            name: true,
            isCertified: true,
            slug: true
          }
        },
        maintenanceRecords: {
          where: { status: 'VALIDATED' },
          select: {
            id: true,
            category: true,
            interventionDate: true,
            mileage: true
          },
          orderBy: { interventionDate: 'desc' },
          take: 5
        },
        _count: {
          select: {
            maintenanceRecords: { where: { status: 'VALIDATED' } }
          }
        }
      }
    })

    if (!vehicle) {
      // Log de la recherche non fructueuse
      await db.searchLog?.create?.({
        data: {
          licensePlate: normalizedPlate,
          found: false
        }
      }).catch(() => {}) // Ignore si le modèle n'existe pas

      return NextResponse.json({
        success: true,
        found: false,
        message: 'Véhicule non trouvé dans notre base de données'
      })
    }

    // Calculer les alertes (VT expiré, assurance expirée, etc.)
    const now = new Date()
    const alerts = []

    if (vehicle.vtEndDate && new Date(vehicle.vtEndDate) < now) {
      alerts.push({ type: 'VT_EXPIRED', message: 'Visite technique expirée' })
    } else if (vehicle.vtEndDate) {
      const daysUntilExpiry = Math.ceil((new Date(vehicle.vtEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilExpiry <= 30) {
        alerts.push({ type: 'VT_EXPIRING', message: `VT expire dans ${daysUntilExpiry} jours` })
      }
    }

    if (vehicle.insuranceEndDate && new Date(vehicle.insuranceEndDate) < now) {
      alerts.push({ type: 'INSURANCE_EXPIRED', message: 'Assurance expirée' })
    } else if (vehicle.insuranceEndDate) {
      const daysUntilExpiry = Math.ceil((new Date(vehicle.insuranceEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilExpiry <= 30) {
        alerts.push({ type: 'INSURANCE_EXPIRING', message: `Assurance expire dans ${daysUntilExpiry} jours` })
      }
    }

    // Données de teasing (informations limitées)
    const teasingData = {
      found: true,
      vehicleId: vehicle.id,
      reference: vehicle.reference,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      // Score OKAR visible
      okarScore: vehicle.okarScore,
      okarBadge: vehicle.okarBadge,
      // Comptes seulement
      interventionCount: vehicle._count.maintenanceRecords,
      // Garage certifié ?
      hasCertifiedGarage: vehicle.garage?.isCertified || false,
      garageName: vehicle.garage?.name,
      // Alertes
      alerts,
      // Année d'activation
      activatedYear: vehicle.activatedAt?.getFullYear(),
      // Dernier kilométrage connu (année seulement)
      lastMileageYear: vehicle.mileageUpdatedAt?.getFullYear(),
    }

    return NextResponse.json({
      success: true,
      found: true,
      vehicleId: vehicle.id,
      ...teasingData
    })

  } catch (error) {
    console.error('Erreur recherche:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la recherche' },
      { status: 500 }
    )
  }
}
