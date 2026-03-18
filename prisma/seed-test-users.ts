import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Création des utilisateurs de test...\n');

  // 1. Créer le SuperAdmin
  const superAdminPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@autopass.sn' },
    update: {},
    create: {
      email: 'admin@autopass.sn',
      name: 'Super Admin AutoPass',
      phone: '+221 77 000 00 00',
      password: superAdminPassword,
      role: 'superadmin',
    },
  });
  console.log('✅ SuperAdmin créé:', superAdmin.email);

  // 2. Créer un Garage de test
  const garage = await prisma.garage.upsert({
    where: { slug: 'garage-autopro-dakar' },
    update: {},
    create: {
      id: 'garage-test-001',
      name: 'Garage AutoPro Dakar',
      slug: 'garage-autopro-dakar',
      address: 'Dakar, Sénégal',
      phone: '+221 33 800 00 00',
      email: 'contact@autopro.sn',
      active: true,
      isCertified: true,
    },
  });
  console.log('✅ Garage créé:', garage.name);

  // 3. Créer un utilisateur Garage
  const garageUserPassword = await bcrypt.hash('garage123', 10);
  const garageUser = await prisma.user.upsert({
    where: { email: 'garage@autopass.sn' },
    update: {},
    create: {
      email: 'garage@autopass.sn',
      name: 'Mamadou Diop - Garage AutoPro',
      phone: '+221 77 123 45 67',
      password: garageUserPassword,
      role: 'garage',
      garageId: garage.id,
    },
  });
  console.log('✅ Utilisateur Garage créé:', garageUser.email);

  // 4. Créer un lot de QR codes de test pour le garage
  const existingLot = await prisma.qRCodeLot.findFirst({
    where: { assignedToId: garage.id }
  });

  if (!existingLot) {
    const lot = await prisma.qRCodeLot.create({
      data: {
        prefix: 'AUTO24',
        count: 50,
        status: 'ASSIGNED',
        assignedToId: garage.id,
      },
    });
    console.log('✅ Lot QR créé:', lot.prefix, '-', lot.count, 'codes');
  }

  // 5. Créer un chauffeur de test
  const driverPassword = await bcrypt.hash('driver123', 10);
  const driver = await prisma.user.upsert({
    where: { email: 'driver@autopass.sn' },
    update: {},
    create: {
      email: 'driver@autopass.sn',
      name: 'Ibrahima Sow',
      phone: '+221 78 000 00 00',
      password: driverPassword,
      role: 'driver',
    },
  });
  console.log('✅ Chauffeur créé:', driver.email);

  console.log('\n═══════════════════════════════════════════');
  console.log('📋 IDENTIFIANTS DE CONNEXION:');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('🔑 SUPER ADMIN:');
  console.log('   Email: admin@autopass.sn');
  console.log('   Mot de passe: admin123');
  console.log('');
  console.log('🔧 GARAGE:');
  console.log('   Email: garage@autopass.sn');
  console.log('   Mot de passe: garage123');
  console.log('');
  console.log('🚗 CHAUFFEUR:');
  console.log('   Email: driver@autopass.sn');
  console.log('   Mot de passe: driver123');
  console.log('');
  console.log('═══════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
