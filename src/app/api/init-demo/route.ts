import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Initialize demo users for login
export async function GET() {
  try {
    // Check if superadmin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@autopass.sn' }
    });

    if (!existingAdmin) {
      // Hash passwords
      const adminPassword = await bcrypt.hash('admin123', 10);
      const garagePassword = await bcrypt.hash('garage123', 10);

      // Create superadmin user
      await prisma.user.create({
        data: {
          email: 'admin@autopass.sn',
          name: 'Super Admin',
          password: adminPassword,
          role: 'superadmin',
        }
      });

      // Create demo garage first
      const demoGarage = await prisma.garage.create({
        data: {
          name: 'GARAGE AUTO PLUS',
          slug: 'garage-auto-plus',
          email: 'contact@garage-auto-plus.sn',
          phone: '+221 77 123 45 67',
          address: 'Dakar, Sénégal',
          active: true,
        }
      });

      // Create demo garage user
      await prisma.user.create({
        data: {
          email: 'garage@autopass.sn',
          name: 'GARAGE AUTO PLUS',
          password: garagePassword,
          role: 'garage',
          garageId: demoGarage.id,
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Demo users created successfully',
        users: [
          { email: 'admin@autopass.sn', password: 'admin123', role: 'superadmin' },
          { email: 'garage@autopass.sn', password: 'garage123', role: 'garage' }
        ]
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Demo users already exist',
      users: [
        { email: 'admin@autopass.sn', password: 'admin123', role: 'superadmin' },
        { email: 'garage@autopass.sn', password: 'garage123', role: 'garage' }
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
