import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';

// GET - Get garage profile
export async function GET() {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get full garage data
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: { garage: true }
    });

    if (!fullUser || !fullUser.garage) {
      return NextResponse.json(
        { error: 'Garage non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      garage: fullUser.garage,
      user: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email
      }
    });
  } catch (error) {
    console.error('Error fetching garage profile:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    );
  }
}

// PUT - Update garage profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get user with garage
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: { garage: true }
    });

    if (!fullUser || !fullUser.garage) {
      return NextResponse.json(
        { error: 'Garage non trouvé' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, email, phone, address, city, description, logo, passwordChange } = body;

    // Update garage info
    const updateData: {
      name?: string;
      email?: string | null;
      phone?: string;
      address?: string;
      city?: string;
      description?: string | null;
      logo?: string | null;
    } = {};

    if (name) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || '';
    if (address !== undefined) updateData.address = address || '';
    if (city !== undefined) updateData.city = city || '';
    if (description !== undefined) updateData.description = description || null;
    if (logo !== undefined) updateData.logo = logo || null;

    // Update garage
    const updatedGarage = await db.garage.update({
      where: { id: fullUser.garage.id },
      data: updateData
    });

    // Handle password change if requested
    if (passwordChange && passwordChange.currentPassword && passwordChange.newPassword) {
      // Verify current password
      const isValidPassword = await bcrypt.compare(passwordChange.currentPassword, fullUser.password || '');
      
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Mot de passe actuel incorrect' },
          { status: 400 }
        );
      }

      // Validate new password
      if (passwordChange.newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' },
          { status: 400 }
        );
      }

      // Hash and update password
      const hashedPassword = await bcrypt.hash(passwordChange.newPassword, 10);
      await db.user.update({
        where: { id: fullUser.id },
        data: { password: hashedPassword }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      garage: updatedGarage
    });
  } catch (error) {
    console.error('Error updating garage profile:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}
