import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Starting OKAR seed...');

  // ==========================================
  // 1. SUPER ADMIN
  // ==========================================
  console.log('Creating SuperAdmin...');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@okar.sn' },
    update: {
      password: await hashPassword('Admin123!'),
      emailVerified: new Date(),
    },
    create: {
      email: 'admin@okar.sn',
      name: 'Super Admin OKAR',
      phone: '+221 77 000 00 00',
      password: await hashPassword('Admin123!'),
      role: 'superadmin',
      isActive: true,
      emailVerified: new Date(),
    },
  });
  console.log('✅ SuperAdmin created:', superAdmin.email);

  // ==========================================
  // 2. PROPRIÉTAIRE DE VÉHICULE
  // ==========================================
  console.log('Creating Propriétaire...');
  const owner = await prisma.user.upsert({
    where: { email: 'proprietaire@okar.sn' },
    update: {
      password: await hashPassword('Proprio123!'),
      emailVerified: new Date(),
    },
    create: {
      email: 'proprietaire@okar.sn',
      name: 'Amadou Diallo',
      phone: '+221 77 123 45 67',
      password: await hashPassword('Proprio123!'),
      role: 'driver',
      isActive: true,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Propriétaire created:', owner.email);

  // ==========================================
  // 3. GARAGE PARTENAIRE (avec user + garage)
  // ==========================================
  console.log('Creating Garage User...');
  const garageUser = await prisma.user.upsert({
    where: { email: 'garage@okar.sn' },
    update: {
      password: await hashPassword('Garage123!'),
      emailVerified: new Date(),
    },
    create: {
      email: 'garage@okar.sn',
      name: 'Garage Central Dakar',
      phone: '+221 33 800 00 00',
      password: await hashPassword('Garage123!'),
      role: 'garage',
      isActive: true,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Garage User created:', garageUser.email);

  // Create Garage entity
  console.log('Creating Garage entity...');
  const garage = await prisma.garage.upsert({
    where: { userId: garageUser.id },
    update: {
      name: 'Garage Central Dakar',
      address: 'Route de Rufisque, Dakar',
      city: 'Dakar',
      phone: '+221 33 800 00 00',
      email: 'garage@okar.sn',
      description: 'Garage certifié OKAR - Spécialiste mécanique auto',
      isActive: true,
      isVerified: true,
    },
    create: {
      name: 'Garage Central Dakar',
      address: 'Route de Rufisque, Dakar',
      city: 'Dakar',
      phone: '+221 33 800 00 00',
      email: 'garage@okar.sn',
      description: 'Garage certifié OKAR - Spécialiste mécanique auto',
      isActive: true,
      isVerified: true,
      subscriptionPlan: 'PREMIUM',
      userId: garageUser.id,
    },
  });
  console.log('✅ Garage created:', garage.name);

  // ==========================================
  // 4. VÉHICULE DE TEST
  // ==========================================
  console.log('Creating test vehicle...');
  const vehicle = await prisma.vehicle.upsert({
    where: { licensePlate: 'AA-123-AB' },
    update: {
      mileage: 85000,
    },
    create: {
      make: 'Toyota',
      model: 'Corolla',
      year: 2019,
      licensePlate: 'AA-123-AB',
      vin: 'JTDKN3DU5A0000001',
      color: 'Blanc',
      mileage: 85000,
      fuelType: 'DIESEL',
      transmission: 'MANUAL',
      status: 'ACTIVE',
      ownerId: owner.id,
      garageId: garage.id,
    },
  });
  console.log('✅ Vehicle created:', vehicle.licensePlate);

  // ==========================================
  // 5. ENREGISTREMENTS D'ENTRETIEN
  // ==========================================
  console.log('Creating maintenance records...');
  
  await prisma.maintenanceRecord.createMany({
    data: [
      {
        type: 'OIL_CHANGE',
        description: 'Vidange huile moteur 5W30 + Filtre à huile',
        cost: 35000,
        mileage: 80000,
        vehicleId: vehicle.id,
        garageId: garage.id,
        performedAt: new Date('2024-06-15'),
      },
      {
        type: 'INSPECTION',
        description: 'Contrôle technique annuel - OK',
        cost: 15000,
        mileage: 80000,
        vehicleId: vehicle.id,
        garageId: garage.id,
        performedAt: new Date('2024-06-15'),
      },
      {
        type: 'TIRE_CHANGE',
        description: 'Remplacement 4 pneus Michelin 195/65 R15',
        cost: 120000,
        mileage: 75000,
        vehicleId: vehicle.id,
        garageId: garage.id,
        performedAt: new Date('2024-03-20'),
      },
    ],
  });
  console.log('✅ Maintenance records created');

  // ==========================================
  // 6. NOTIFICATIONS DE TEST
  // ==========================================
  console.log('Creating notifications...');
  
  await prisma.notification.createMany({
    data: [
      {
        title: 'Bienvenue sur OKAR !',
        message: 'Votre compte a été créé avec succès. Commencez par ajouter votre véhicule.',
        type: 'SUCCESS',
        userId: owner.id,
      },
      {
        title: 'Certification Garage',
        message: 'Félicitations ! Votre garage est maintenant certifié OKAR.',
        type: 'SUCCESS',
        userId: garageUser.id,
      },
    ],
  });
  console.log('✅ Notifications created');

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ SEED COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('📋 IDENTIFIANTS DE TEST:');
  console.log('───────────────────────────────────────────────────────────');
  console.log('🔧 SUPER ADMIN:');
  console.log('   Email:    admin@okar.sn');
  console.log('   Password: Admin123!');
  console.log('   Rôle:     Administration complète');
  console.log('');
  console.log('🚗 PROPRIÉTAIRE:');
  console.log('   Email:    proprietaire@okar.sn');
  console.log('   Password: Proprio123!');
  console.log('   Rôle:     Gestion de ses véhicules');
  console.log('');
  console.log('🔧 GARAGE PARTENAIRE:');
  console.log('   Email:    garage@okar.sn');
  console.log('   Password: Garage123!');
  console.log('   Rôle:     Garage certifié');
  console.log('');
  console.log('🚙 VÉHICULE DE TEST:');
  console.log('   Plaque:   AA-123-AB');
  console.log('   Modèle:   Toyota Corolla 2019');
  console.log('───────────────────────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
