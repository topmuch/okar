import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initialisation OKAR...');

  // Créer un garage de test
  const now = new Date();
  const garage = await prisma.garage.upsert({
    where: { slug: 'auto-service-dakar' },
    update: {},
    create: {
      id: 'garage-test-1',
      name: 'Auto Service Dakar',
      slug: 'auto-service-dakar',
      email: 'contact@autodakar.sn',
      phone: '+221 33 123 45 67',
      address: 'Dakar, Sénégal',
      isCertified: true,
      validationStatus: 'APPROVED',
      active: true,
      updatedAt: now,
    },
  });

  console.log('✅ Garage créé:', garage.name);

  // Hasher les mots de passe
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const garagePassword = await bcrypt.hash('garage123', 10);
  const driverPassword = await bcrypt.hash('driver123', 10);

  // Créer SuperAdmin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@autopass.sn' },
    update: { password: hashedPassword, role: 'superadmin', updatedAt: now },
    create: {
      id: 'user-superadmin-1',
      email: 'admin@autopass.sn',
      name: 'SuperAdmin',
      password: hashedPassword,
      role: 'superadmin',
      emailVerified: true,
      updatedAt: now,
    },
  });
  console.log('✅ SuperAdmin créé:', superAdmin.email);

  // Créer Admin Garage
  const garageAdmin = await prisma.user.upsert({
    where: { email: 'garage@autopass.sn' },
    update: { password: garagePassword, role: 'garage', garageId: garage.id, updatedAt: now },
    create: {
      id: 'user-garage-1',
      email: 'garage@autopass.sn',
      name: 'Admin Garage',
      password: garagePassword,
      role: 'garage',
      garageId: garage.id,
      emailVerified: true,
      updatedAt: now,
    },
  });
  console.log('✅ Admin Garage créé:', garageAdmin.email);

  // Créer Conducteur
  const driver = await prisma.user.upsert({
    where: { email: 'driver@autopass.sn' },
    update: { password: driverPassword, role: 'driver', updatedAt: now },
    create: {
      id: 'user-driver-1',
      email: 'driver@autopass.sn',
      name: 'Conducteur Test',
      phone: '+221 77 123 45 67',
      password: driverPassword,
      role: 'driver',
      emailVerified: true,
      updatedAt: now,
    },
  });
  console.log('✅ Conducteur créé:', driver.email);

  // Créer un lot de QR codes pour les particuliers
  const qrLot = await prisma.qRCodeLot.create({
    data: {
      id: 'lot-particulier-1',
      prefix: 'OKAR',
      count: 10,
      status: 'CREATED',
      createdAt: now,
    },
  });

  // Créer les QR codes
  for (let i = 1; i <= 10; i++) {
    const shortCode = i < 10 ? `OKAR00${i}` : `OKAR0${i}`;
    await prisma.qRCodeStock.create({
      data: {
        id: `qr-${shortCode}-1`,
        codeUnique: `${shortCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        shortCode,
        lotId: qrLot.id,
        status: 'STOCK',
        updatedAt: now,
      },
    });
  }
  console.log('✅ 10 QR codes créés (OKAR001 à OKAR010)');

  console.log('\n🎉 Comptes de test OKAR prêts !');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 SuperAdmin: admin@autopass.sn / admin123');
  console.log('🔧 Garage: garage@autopass.sn / garage123');
  console.log('🚗 Conducteur: driver@autopass.sn / driver123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
