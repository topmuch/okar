/**
 * ================================================
 * OKAR Vehicle Search API - Recherche par Plaque
 * ================================================
 * 
 * Recherche publique de véhicules par plaque d'immatriculation.
 * Retourne des données "Teasing" (limitées) pour inciter au paiement.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Types
interface VehicleSearchResult {
  found: boolean;
  vehicle?: {
    id: string;
    reference: string;
    make: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
    licensePlate: string | null;
    mainPhoto: string | null;
    engineType: string | null;
    currentMileage: number;
    okarScore: number;
    okarBadge: string | null;
    vtEndDate: string | null;
    insuranceEndDate: string | null;
    activatedAt: string | null;
    garageId: string | null;
  };
  teasingData?: {
    score: number;
    scoreColor: string;
    scoreLabel: string;
    totalInterventions: number;
    validatedInterventions: number;
    lastMileage: number;
    ownerCount: number;
    hasAlerts: boolean;
    alertsList: string[];
  };
  garage?: {
    name: string;
    isCertified: boolean;
    logo: string | null;
  } | null;
}

// GET /api/vehicles/search?plate=DK-123-AB
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const plate = searchParams.get('plate');

    if (!plate) {
      return NextResponse.json(
        { error: 'Numéro de plaque requis' },
        { status: 400 }
      );
    }

    // Normaliser la plaque (majuscules, sans espaces)
    const normalizedPlate = plate.toUpperCase().replace(/\s+/g, '-').trim();
    
    // Rechercher le véhicule par plaque
    const vehicle = await db.vehicle.findFirst({
      where: {
        OR: [
          { licensePlate: normalizedPlate },
          { licensePlate: { contains: normalizedPlate.replace(/-/g, '') } },
          { reference: normalizedPlate },
        ],
        status: { not: 'deleted' },
      },
      include: {
        garage: {
          select: {
            name: true,
            isCertified: true,
            logo: true,
          },
        },
        maintenanceRecords: {
          where: {
            OR: [
              { status: 'VALIDATED' },
              { isLocked: true },
            ],
          },
          select: {
            id: true,
            category: true,
            mileage: true,
            interventionDate: true,
            status: true,
            ownerValidation: true,
            isLocked: true,
          },
          orderBy: { interventionDate: 'desc' },
          take: 50,
        },
        ownershipHistory: {
          select: { id: true },
        },
      },
    });

    // Véhicule non trouvé
    if (!vehicle) {
      return NextResponse.json<VehicleSearchResult>({
        found: false,
      });
    }

    // Calculer les données de teasing
    const totalInterventions = vehicle.maintenanceRecords.length;
    const validatedInterventions = vehicle.maintenanceRecords.filter(
      r => r.ownerValidation === 'VALIDATED' && r.isLocked
    ).length;

    // Calculer le score
    let score = vehicle.okarScore || 0;
    if (score === 0) {
      // Calculer le score si pas déjà fait
      const baseScore = 25;
      const interventionBonus = Math.min(validatedInterventions * 10, 50);
      const maintenanceBonus = totalInterventions > 0 ? 10 : 0;
      score = Math.min(baseScore + interventionBonus + maintenanceBonus, 100);
    }

    // Déterminer la couleur et le label du score
    let scoreColor = 'red';
    let scoreLabel = 'Insuffisant';
    if (score >= 80) {
      scoreColor = 'green';
      scoreLabel = 'Excellent';
    } else if (score >= 60) {
      scoreColor = 'blue';
      scoreLabel = 'Bon';
    } else if (score >= 40) {
      scoreColor = 'orange';
      scoreLabel = 'Moyen';
    }

    // Vérifier les alertes (VT et Assurance expirés)
    const now = new Date();
    const alertsList: string[] = [];
    
    if (vehicle.vtEndDate) {
      const vtExpiry = new Date(vehicle.vtEndDate);
      if (vtExpiry < now) {
        alertsList.push('⚠️ Visite Technique expirée');
      } else {
        const daysLeft = Math.ceil((vtExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 30) {
          alertsList.push(`⚠️ VT expire dans ${daysLeft} jours`);
        }
      }
    }

    if (vehicle.insuranceEndDate) {
      const insExpiry = new Date(vehicle.insuranceEndDate);
      if (insExpiry < now) {
        alertsList.push('⚠️ Assurance expirée');
      } else {
        const daysLeft = Math.ceil((insExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 30) {
          alertsList.push(`⚠️ Assurance expire dans ${daysLeft} jours`);
        }
      }
    }

    // Dernier kilométrage connu
    const lastMileageRecord = vehicle.maintenanceRecords.find(r => r.mileage);
    const lastMileage = lastMileageRecord?.mileage || vehicle.currentMileage || 0;

    // Construire la réponse
    const result: VehicleSearchResult = {
      found: true,
      vehicle: {
        id: vehicle.id,
        reference: vehicle.reference,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        licensePlate: vehicle.licensePlate,
        mainPhoto: vehicle.mainPhoto,
        engineType: vehicle.engineType,
        currentMileage: vehicle.currentMileage,
        okarScore: score,
        okarBadge: vehicle.okarBadge,
        vtEndDate: vehicle.vtEndDate?.toISOString() || null,
        insuranceEndDate: vehicle.insuranceEndDate?.toISOString() || null,
        activatedAt: vehicle.activatedAt?.toISOString() || null,
        garageId: vehicle.garageId,
      },
      teasingData: {
        score,
        scoreColor,
        scoreLabel,
        totalInterventions,
        validatedInterventions,
        lastMileage,
        ownerCount: vehicle.ownershipHistory.length || 1,
        hasAlerts: alertsList.length > 0,
        alertsList,
      },
      garage: vehicle.garage ? {
        name: vehicle.garage.name,
        isCertified: vehicle.garage.isCertified,
        logo: vehicle.garage.logo,
      } : null,
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Vehicle search error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    );
  }
}
