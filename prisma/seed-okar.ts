import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initialisation OKAR...');

  // Créer un garage de test
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
    update: { password: hashedPassword, role: 'superadmin' },
    create: {
      email: 'admin@autopass.sn',
      name: 'SuperAdmin',
      password: hashedPassword,
      role: 'superadmin',
    },
  });
  console.log('✅ SuperAdmin créé:', superAdmin.email);

  // Créer Admin Garage
  const garageAdmin = await prisma.user.upsert({
    where: { email: 'garage@autopass.sn' },
    update: { password: garagePassword, role: 'garage', garageId: garage.id },
    create: {
      email: 'garage@autopass.sn',
      name: 'Admin Garage',
      password: garagePassword,
      role: 'garage',
      garageId: garage.id,
    },
  });
  console.log('✅ Admin Garage créé:', garageAdmin.email);

  // Créer Conducteur
  const driver = await prisma.user.upsert({
    where: { email: 'driver@autopass.sn' },
    update: { password: driverPassword, role: 'driver' },
    create: {
      email: 'driver@autopass.sn',
      name: 'Conducteur Test',
      phone: '+221 77 123 45 67',
      password: driverPassword,
      role: 'driver',
    },
  });
  console.log('✅ Conducteur créé:', driver.email);

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
