import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Default credentials - will be created automatically if no superadmin exists
const DEFAULT_SUPERADMIN = {
  email: 'superadmin@okar.sn',
  password: 'SuperAdmin123!',
  name: 'SuperAdmin',
};

const DEFAULT_ADMIN = {
  email: 'admin@okar.sn',
  password: 'Admin123!',
  name: 'Admin',
};

const DEFAULT_GARAGE = {
  email: 'garage@okar.sn',
  password: 'Garage123!',
  name: 'Garage Test',
};

// Default intervention categories
const DEFAULT_CATEGORIES = [
  { name: 'Vidange', icon: '🛢️', color: '#3B82F6' },
  { name: 'Freins', icon: '🛑', color: '#EF4444' },
  { name: 'Pneumatique', icon: '🛞', color: '#10B981' },
  { name: 'Batterie', icon: '🔋', color: '#F59E0B' },
  { name: 'Climatisation', icon: '❄️', color: '#06B6D4' },
  { name: 'Électricité', icon: '⚡', color: '#8B5CF6' },
  { name: 'Moteur', icon: '🔧', color: '#EC4899' },
  { name: 'Transmission', icon: '⚙️', color: '#6366F1' },
  { name: 'Suspension', icon: '🚗', color: '#14B8A6' },
  { name: 'Échappement', icon: '💨', color: '#6B7280' },
];

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-');
}

// This endpoint initializes the database with default users and data
// It will only work if no superadmin exists yet (security measure)
export async function POST(request: NextRequest) {
  try {
    // Check if any superadmin already exists
    const existingSuperAdmin = await db.user.findFirst({
      where: { role: 'superadmin' }
    });

    if (existingSuperAdmin) {
      return NextResponse.json(
        { 
          error: 'Un SuperAdmin existe déjà. Initialisation non autorisée.',
          existingEmail: existingSuperAdmin.email
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const customEmail = body.email;
    const customPassword = body.password;
    const customName = body.name;

    const now = new Date();

    // Create superadmin (use custom credentials if provided, otherwise defaults)
    const hashedSuperAdminPassword = await bcrypt.hash(customPassword || DEFAULT_SUPERADMIN.password, 10);
    const superAdmin = await db.user.create({
      data: {
        id: `user-superadmin-${Date.now()}`,
        email: (customEmail || DEFAULT_SUPERADMIN.email).toLowerCase(),
        name: customName || DEFAULT_SUPERADMIN.name,
        password: hashedSuperAdminPassword,
        role: 'superadmin',
        emailVerified: true,
        updatedAt: now,
      }
    });

    // Create default admin
    const hashedAdminPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
    await db.user.create({
      data: {
        id: `user-admin-${Date.now()}`,
        email: DEFAULT_ADMIN.email,
        name: DEFAULT_ADMIN.name,
        password: hashedAdminPassword,
        role: 'admin',
        emailVerified: true,
        updatedAt: now,
      }
    });

    // Create default test garage
    const garageId = `garage-${Date.now()}`;
    await db.garage.create({
      data: {
        id: garageId,
        name: 'Garage Test OKAR',
        slug: 'garage-test-okar',
        email: 'contact@garage-test.sn',
        phone: '+221 77 123 45 67',
        address: 'Dakar, Sénégal',
        managerName: 'Mamadou Diop',
        managerPhone: '+221 77 987 65 43',
        isCertified: true,
        validationStatus: 'APPROVED',
        active: true,
        updatedAt: now,
      }
    });

    // Create garage user
    const hashedGaragePassword = await bcrypt.hash(DEFAULT_GARAGE.password, 10);
    await db.user.create({
      data: {
        id: `user-garage-${Date.now()}`,
        email: DEFAULT_GARAGE.email,
        name: DEFAULT_GARAGE.name,
        password: hashedGaragePassword,
        role: 'garage',
        garageId: garageId,
        emailVerified: true,
        updatedAt: now,
      }
    });

    // Create intervention categories
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const cat = DEFAULT_CATEGORIES[i];
      await db.interventionCategory.create({
        data: {
          id: `cat-${Date.now()}-${i}`,
          name: cat.name,
          slug: slugify(cat.name),
          icon: cat.icon,
          color: cat.color,
          isActive: true,
          sortOrder: i,
          updatedAt: now,
        }
      });
    }

    // Create default settings
    const defaultSettings = [
      { id: `setting-${Date.now()}-1`, key: 'company_name', value: 'OKAR', updatedAt: now },
      { id: `setting-${Date.now()}-2`, key: 'company_address', value: 'Dakar, Sénégal', updatedAt: now },
      { id: `setting-${Date.now()}-3`, key: 'company_phone', value: '+221 77 000 00 00', updatedAt: now },
      { id: `setting-${Date.now()}-4`, key: 'company_email', value: 'contact@okar.sn', updatedAt: now },
      { id: `setting-${Date.now()}-5`, key: 'seo_title', value: 'OKAR - Passeport Automobile', updatedAt: now },
      { id: `setting-${Date.now()}-6`, key: 'seo_description', value: 'Le passeport automobile digital au Sénégal', updatedAt: now },
      { id: `setting-${Date.now()}-7`, key: 'languages', value: 'fr,en,ar', updatedAt: now },
      { id: `setting-${Date.now()}-8`, key: 'default_language', value: 'fr', updatedAt: now },
      { id: `setting-${Date.now()}-9`, key: 'currency', value: 'XOF', updatedAt: now },
    ];

    for (const setting of defaultSettings) {
      await db.setting.create({ data: setting });
    }

    // Create feature flags
    const features = [
      { id: `flag-${Date.now()}-1`, key: 'qr_code_generation', label: 'Génération QR', description: 'Permettre la génération de QR codes', enabled: true, category: 'general', updatedAt: now },
      { id: `flag-${Date.now()}-2`, key: 'vehicle_transfer', label: 'Transfert véhicule', description: 'Permettre le transfert de véhicules', enabled: true, category: 'general', updatedAt: now },
      { id: `flag-${Date.now()}-3`, key: 'maintenance_tracking', label: 'Suivi maintenance', description: 'Activer le suivi des maintenances', enabled: true, category: 'general', updatedAt: now },
      { id: `flag-${Date.now()}-4`, key: 'notification_sms', label: 'Notifications SMS', description: 'Envoyer des notifications par SMS', enabled: false, category: 'communication', updatedAt: now },
      { id: `flag-${Date.now()}-5`, key: 'notification_whatsapp', label: 'Notifications WhatsApp', description: 'Envoyer des notifications par WhatsApp', enabled: true, category: 'communication', updatedAt: now },
    ];

    for (const feature of features) {
      await db.featureFlag.create({ data: feature });
    }

    return NextResponse.json({
      success: true,
      message: '🎉 Base de données initialisée avec succès!',
      credentials: {
        superadmin: {
          email: superAdmin.email,
          password: customPassword ? '***' : DEFAULT_SUPERADMIN.password,
        },
        admin: {
          email: DEFAULT_ADMIN.email,
          password: DEFAULT_ADMIN.password,
        },
        garage: {
          email: DEFAULT_GARAGE.email,
          password: DEFAULT_GARAGE.password,
        },
      },
      stats: {
        usersCreated: 3,
        categoriesCreated: DEFAULT_CATEGORIES.length,
        settingsCreated: defaultSettings.length,
        featuresCreated: features.length,
      }
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// GET - Check if setup is needed and return default credentials info
export async function GET() {
  try {
    const superAdminCount = await db.user.count({
      where: { role: 'superadmin' }
    });

    const needsSetup = superAdminCount === 0;

    return NextResponse.json({
      needsSetup,
      superAdminCount,
      message: needsSetup 
        ? '⚠️ Aucun SuperAdmin trouvé. Appelez POST /api/setup/init pour initialiser.'
        : '✅ Un SuperAdmin existe déjà.',
      defaultCredentials: needsSetup ? {
        superadmin: { email: DEFAULT_SUPERADMIN.email, password: DEFAULT_SUPERADMIN.password },
        admin: { email: DEFAULT_ADMIN.email, password: DEFAULT_ADMIN.password },
        garage: { email: DEFAULT_GARAGE.email, password: DEFAULT_GARAGE.password },
      } : null,
    });
  } catch (error) {
    console.error('Check setup error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
