import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Creating demo users...');

  // Create superadmin user
  await prisma.user.upsert({
    where: { email: 'admin@okar.sn' },
    update: {
      password: await hashPassword('admin123'),
    },
    create: {
      email: 'admin@okar.sn',
      name: 'SuperAdmin',
      password: await hashPassword('admin123'),
      role: 'superadmin',
      emailVerified: true,
    },
  });
  console.log('✅ SuperAdmin created: admin@okar.sn / admin123');

  // Create a demo garage
  const garage = await prisma.garage.upsert({
    where: { slug: 'garage-demo' },
    update: {},
    create: {
      id: 'demo-garage-1',
      name: 'Garage Démo',
      slug: 'garage-demo',
      email: 'contact@garage-demo.sn',
      phone: '+221 78 000 00 00',
      address: 'Dakar, Sénégal',
      isCertified: true,
    },
  });

  // Create garage user
  await prisma.user.upsert({
    where: { email: 'garage@okar.sn' },
    update: {
      password: await hashPassword('garage123'),
    },
    create: {
      email: 'garage@okar.sn',
      name: 'Chef Garage',
      password: await hashPassword('garage123'),
      role: 'garage',
      garageId: garage.id,
      emailVerified: true,
    },
  });
  console.log('✅ Garage user created: garage@okar.sn / garage123');

  // Create driver user
  await prisma.user.upsert({
    where: { email: 'driver@okar.sn' },
    update: {
      password: await hashPassword('driver123'),
    },
    create: {
      email: 'driver@okar.sn',
      name: 'Chauffeur Démo',
      password: await hashPassword('driver123'),
      role: 'driver',
      emailVerified: true,
    },
  });
  console.log('✅ Driver user created: driver@okar.sn / driver123');

  console.log('\n📋 Identifiants de connexion:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 SuperAdmin : admin@okar.sn / admin123');
  console.log('🔧 Garage     : garage@okar.sn / garage123');
  console.log('🚗 Chauffeur  : driver@okar.sn / driver123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
