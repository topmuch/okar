import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Starting seed...');

  // Create superadmin user
  console.log('Creating superadmin user...');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@okar.com' },
    update: {
      password: await hashPassword('admin123'),
    },
    create: {
      email: 'admin@okar.com',
      name: 'SuperAdmin',
      password: await hashPassword('admin123'),
      role: 'superadmin',
      isActive: true,
    },
  });
  console.log('✅ SuperAdmin créé:', superAdmin.email);

  // Create test driver
  console.log('Creating test driver...');
  const driver = await prisma.user.upsert({
    where: { email: 'driver@okar.com' },
    update: {
      password: await hashPassword('driver123'),
    },
    create: {
      email: 'driver@okar.com',
      name: 'Test Driver',
      password: await hashPassword('driver123'),
      role: 'DRIVER',
      isActive: true,
    },
  });
  console.log('✅ Driver créé:', driver.email);

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📋 Demo credentials:');
  console.log('  SuperAdmin: admin@okar.com / admin123');
  console.log('  Driver: driver@okar.com / driver123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
