import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// This endpoint updates the superadmin credentials
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email invalide' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    const now = new Date();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if a superadmin already exists
    const existingSuperAdmin = await db.user.findFirst({
      where: { role: 'superadmin' }
    });

    if (existingSuperAdmin) {
      // Update existing superadmin
      const updatedUser = await db.user.update({
        where: { id: existingSuperAdmin.id },
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name || existingSuperAdmin.name,
          emailVerified: true,
          updatedAt: now,
        }
      });

      return NextResponse.json({
        success: true,
        message: '✅ SuperAdmin mis à jour avec succès!',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        }
      });
    } else {
      // Create new superadmin
      const newUser = await db.user.create({
        data: {
          id: `user-superadmin-${Date.now()}`,
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name || 'SuperAdmin',
          role: 'superadmin',
          emailVerified: true,
          updatedAt: now,
        }
      });

      return NextResponse.json({
        success: true,
        message: '✅ SuperAdmin créé avec succès!',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      });
    }

  } catch (error) {
    console.error('Update superadmin error:', error);
    return NextResponse.json(
      { error: 'Erreur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
