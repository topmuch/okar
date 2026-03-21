/**
 * ================================================
 * OKAR Report Download API - Téléchargement PDF
 * ================================================
 * 
 * Génère et télécharge le rapport PDF après paiement validé.
 * Vérifie que la transaction est associée à un paiement réussi.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prepareReportData, generateReportHtml } from '@/lib/pdf-report';

interface TransactionRow {
  id: string;
  status: string;
  type: string;
  metadata: string | null;
  amount: number;
  payerPhone: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface VehicleRow {
  id: string;
  reference: string;
  make: string | null;
  model: string | null;
  licensePlate: string | null;
}

// GET /api/reports/download/[code]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { error: 'Code de téléchargement requis' },
        { status: 400 }
      );
    }

    // Vérifier la transaction
    const transaction = await db.$queryRaw<TransactionRow[]>`
      SELECT id, status, type, metadata, amount, payerPhone, completedAt, createdAt
      FROM Transaction
      WHERE id = ${code}
    `;

    if (!transaction || transaction.length === 0) {
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      );
    }

    const tx = transaction[0];

    // Vérifier que c'est un paiement de rapport
    if (tx.type !== 'REPORT') {
      return NextResponse.json(
        { error: 'Type de transaction invalide' },
        { status: 400 }
      );
    }

    // Vérifier que le paiement est réussi
    if (tx.status !== 'SUCCESS') {
      return NextResponse.json(
        { error: 'Paiement non validé', status: tx.status },
        { status: 402 }
      );
    }

    // Extraire le vehicleId du metadata
    let vehicleId: string | null = null;
    if (tx.metadata) {
      try {
        const metadata = JSON.parse(tx.metadata);
        vehicleId = metadata.vehicleId;
      } catch {
        // Ignore parse errors
      }
    }

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Véhicule non associé à cette transaction' },
        { status: 400 }
      );
    }

    // Vérifier que le véhicule existe
    const vehicle = await db.$queryRaw<VehicleRow[]>`
      SELECT id, reference, make, model, licensePlate
      FROM Vehicle
      WHERE id = ${vehicleId}
    `;

    if (!vehicle || vehicle.length === 0) {
      return NextResponse.json(
        { error: 'Véhicule non trouvé' },
        { status: 404 }
      );
    }

    // Préparer les données du rapport
    const reportData = await prepareReportData(vehicleId);

    // Générer le HTML du rapport
    const htmlContent = generateReportHtml(reportData, 'PREMIUM');

    // Créer ou récupérer l'enregistrement PDF
    const existingReport = await db.$queryRaw<{ id: string; verificationCode: string }[]>`
      SELECT id, verificationCode
      FROM PdfReport
      WHERE transactionId = ${code}
    `;

    let verificationCode: string;

    if (existingReport && existingReport.length > 0) {
      verificationCode = existingReport[0].verificationCode;
    } else {
      // Générer un nouveau code de vérification
      const newCode = `OKAR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      await db.$executeRaw`
        INSERT INTO PdfReport (id, vehicleId, transactionId, reportType, fileName, fileUrl, verificationCode, certifiedAt, includePhotos, includeCharts, createdAt)
        VALUES (
          ${crypto.randomUUID()},
          ${vehicleId},
          ${code},
          'PREMIUM',
          ${`rapport-${vehicle[0].reference}-${Date.now()}.pdf`},
          ${`/api/reports/download/${code}`},
          ${newCode},
          ${new Date().toISOString()},
          1,
          1,
          ${new Date().toISOString()}
        )
      `;
      
      verificationCode = newCode;
    }

    // Retourner les informations de téléchargement
    return NextResponse.json({
      success: true,
      download: {
        transactionId: code,
        vehicleId,
        vehicle: vehicle[0],
        verificationCode,
        htmlContent,
        generatedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
      },
    });

  } catch (error) {
    console.error('Report download error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    );
  }
}
