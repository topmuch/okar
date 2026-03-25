import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Initialize demo users for login
export async function GET() {
  try {
    // Check if superadmin exists
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@okar.sn' }
    });

    if (!existingAdmin) {
      // Hash passwords
      const adminPassword = await bcrypt.hash('Admin123!', 10);
      const garagePassword = await bcrypt.hash('Garage123!', 10);

      // Create superadmin user first
      const superAdmin = await db.user.create({
        data: {
          email: 'admin@okar.sn',
          name: 'Super Admin OKAR',
          phone: '+221 77 000 00 00',
          password: adminPassword,
          role: 'superadmin',
          emailVerified: new Date(),
        }
      });

      // Create demo garage user first
      const garageUser = await db.user.create({
        data: {
          email: 'garage@okar.sn',
          name: 'Garage Central Dakar',
          phone: '+221 33 800 00 00',
          password: garagePassword,
          role: 'garage',
          emailVerified: new Date(),
        }
      });

      // Create demo garage linked to user
      await db.garage.create({
        data: {
          name: 'Garage Central Dakar',
          email: 'garage@okar.sn',
          phone: '+221 33 800 00 00',
          address: 'Route de Rufisque, Dakar',
          city: 'Dakar',
          description: 'Garage certifié OKAR',
          isActive: true,
          isVerified: true,
          userId: garageUser.id,
        }
      });

      // Update garage user with garageId
      const garage = await db.garage.findFirst({
        where: { userId: garageUser.id }
      });

      if (garage) {
        await db.user.update({
          where: { id: garageUser.id },
          data: { garageId: garage.id }
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Demo users created successfully',
        users: [
          { email: 'admin@okar.sn', password: 'Admin123!', role: 'superadmin' },
          { email: 'garage@okar.sn', password: 'Garage123!', role: 'garage' }
        ]
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Demo users already exist',
      users: [
        { email: 'admin@okar.sn', password: 'Admin123!', role: 'superadmin' },
        { email: 'garage@okar.sn', password: 'Garage123!', role: 'garage' }
      ]
    });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize demo users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
