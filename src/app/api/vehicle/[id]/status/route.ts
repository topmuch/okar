import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH - Update vehicle status (backward compatible with baggage naming)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, qrStatus } = body;

    if (!status && !qrStatus) {
      return NextResponse.json(
        { error: 'Status or qrStatus is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending_activation', 'active', 'blocked'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
    }

    // Validate qrStatus if provided
    if (qrStatus) {
      const validQrStatuses = ['INACTIVE', 'ACTIVE', 'BLOCKED'];
      if (!validQrStatuses.includes(qrStatus)) {
        return NextResponse.json(
          { error: 'Invalid qrStatus' },
          { status: 400 }
        );
      }
    }

    // Build update query
    if (qrStatus === 'ACTIVE') {
      // When activating, also set activatedAt timestamp
      await db.$executeRaw`
        UPDATE Vehicle SET 
          status = ${status || 'active'}, 
          qrStatus = ${qrStatus}, 
          activatedAt = ${now},
          updatedAt = ${now}
        WHERE id = ${id}
      `;
    } else {
      await db.$executeRaw`
        UPDATE Vehicle SET 
          status = COALESCE(${status || null}, status),
          qrStatus = COALESCE(${qrStatus || null}, qrStatus),
          updatedAt = ${now}
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating vehicle status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
}
