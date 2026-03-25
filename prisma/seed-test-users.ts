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
      isActive: true,
    },
  });
  console.log('✅ SuperAdmin créé:', superAdmin.email);

  // 2. Créer un utilisateur Garage
  const garageUserPassword = await bcrypt.hash('garage123', 10);
  const garageUser = await prisma.user.upsert({
    where: { email: 'garage@autopass.sn' },
    update: {},
    create: {
      email: 'garage@autopass.sn',
      name: 'Mamadou Diop - Garage AutoPro',
      phone: '+221 77 123 45 67',
      password: garageUserPassword,
      role: 'GARAGE',
      isActive: true,
    },
  });
  console.log('✅ Utilisateur Garage créé:', garageUser.email);

  // 3. Créer un Garage lié à l'utilisateur
  const garage = await prisma.garage.upsert({
    where: { userId: garageUser.id },
    update: {},
    create: {
      name: 'Garage AutoPro Dakar',
      address: 'Dakar, Sénégal',
      city: 'Dakar',
      phone: '+221 33 800 00 00',
      email: 'contact@autopro.sn',
      isActive: true,
      isVerified: true,
      userId: garageUser.id,
    },
  });
  console.log('✅ Garage créé:', garage.name);

  // 4. Créer un chauffeur de test
  const driverPassword = await bcrypt.hash('driver123', 10);
  const driver = await prisma.user.upsert({
    where: { email: 'driver@autopass.sn' },
    update: {},
    create: {
      email: 'driver@autopass.sn',
      name: 'Ibrahima Sow',
      phone: '+221 78 000 00 00',
      password: driverPassword,
      role: 'DRIVER',
      isActive: true,
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
