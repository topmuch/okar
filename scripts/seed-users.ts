import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Création des utilisateurs de test...');

  // Créer une agence de test
  const agency = await prisma.agency.upsert({
    where: { slug: 'test-agency' },
    update: {},
    create: {
      name: 'Agence Test Hajj',
      slug: 'test-agency',
      email: 'contact@test-agency.com',
      phone: '+33 1 23 45 67 89',
      address: 'Paris, France',
      active: true,
    },
  });

  console.log('✅ Agence créée:', agency.name);

  // Hasher les mots de passe
  const adminPassword = await bcrypt.hash('admin123', 10);
  const agencyPassword = await bcrypt.hash('agence123', 10);

  // Créer l'utilisateur SuperAdmin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@autopass.sn.com' },
    update: {
      password: adminPassword,
      role: 'superadmin',
    },
    create: {
      email: 'admin@autopass.sn.com',
      name: 'Super Admin',
      password: adminPassword,
      role: 'superadmin',
    },
  });

  console.log('✅ SuperAdmin créé:', admin.email);

  // Créer l'utilisateur Agence
  const agencyUser = await prisma.user.upsert({
    where: { email: 'agence@autopass.sn.com' },
    update: {
      password: agencyPassword,
      role: 'agency',
      agencyId: agency.id,
    },
    create: {
      email: 'agence@autopass.sn.com',
      name: 'Admin Agence Test',
      password: agencyPassword,
      role: 'agency',
      agencyId: agency.id,
    },
  });

  console.log('✅ Utilisateur Agence créé:', agencyUser.email);

  console.log('\n🎉 Comptes de test prêts !');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Admin: admin@autopass.sn.com / admin123');
  console.log('🏢 Agence: agence@autopass.sn.com / agence123');
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
