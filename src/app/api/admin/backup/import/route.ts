import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Import database from JSON file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const content = await file.text();
    const backup = JSON.parse(content);

    // Validate backup structure
    if (!backup.version || !backup.data) {
      return NextResponse.json(
        { error: 'Invalid backup file format' },
        { status: 400 }
      );
    }

    // Simple import for existing models
    let imported = {
      users: 0,
      garages: 0,
      vehicles: 0,
    };

    // Import users
    if (backup.data.users?.length > 0) {
      for (const user of backup.data.users) {
        try {
          await db.user.upsert({
            where: { id: user.id },
            create: user,
            update: user,
          });
          imported.users++;
        } catch (e) {
          console.error('User import error:', e);
        }
      }
    }

    // Import garages
    if (backup.data.garages?.length > 0) {
      for (const garage of backup.data.garages) {
        try {
          await db.garage.upsert({
            where: { id: garage.id },
            create: garage,
            update: garage,
          });
          imported.garages++;
        } catch (e) {
          console.error('Garage import error:', e);
        }
      }
    }

    // Import vehicles
    if (backup.data.vehicles?.length > 0) {
      for (const vehicle of backup.data.vehicles) {
        try {
          await db.vehicle.upsert({
            where: { id: vehicle.id },
            create: vehicle,
            update: vehicle,
          });
          imported.vehicles++;
        } catch (e) {
          console.error('Vehicle import error:', e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database imported successfully',
      imported,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import database' },
      { status: 500 }
    );
  }
}
