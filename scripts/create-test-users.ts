import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Création des identifiants de test...\n');

  // 1. Créer un Garage de test
  const garageId = uuidv4();
  const garage = await prisma.garage.upsert({
    where: { slug: 'auto-garage-test' },
    update: {},
    create: {
      id: garageId,
      name: 'Auto Garage Test',
      slug: 'auto-garage-test',
      email: 'garage@test.com',
      phone: '77 123 45 67',
      address: 'Dakar, Sénégal',
      isCertified: true,
      validationStatus: 'VALIDATED',
      accountStatus: 'ACTIVE',
      subscriptionPlan: 'premium',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ Garage créé:', garage.name, `(ID: ${garage.id})`);

  // 2. Créer un utilisateur Garage
  const garageUserId = uuidv4();
  const hashedPassword = await bcrypt.hash('Test1234!', 10);
  
  const garageUser = await prisma.user.upsert({
    where: { email: 'garage@test.com' },
    update: {},
    create: {
      id: garageUserId,
      email: 'garage@test.com',
      name: 'Mamadou Diop',
      phone: '77 123 45 67',
      password: hashedPassword,
      role: 'garage',
      garageId: garage.id,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ Utilisateur Garage créé:', garageUser.email);

  // 3. Créer un Admin
  const adminId = uuidv4();
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@okar.sn' },
    update: {},
    create: {
      id: adminId,
      email: 'admin@okar.sn',
      name: 'Admin OKAR',
      phone: '78 000 00 00',
      password: hashedPassword,
      role: 'admin',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ Admin créé:', adminUser.email);

  // 4. Chercher un véhicule existant ou créer
  let vehicle = await prisma.vehicle.findFirst({
    where: { licensePlate: 'DK-1234-AB' }
  });

  if (!vehicle) {
    // Chercher un lot QR existant
    let lot = await prisma.qRCodeLot.findFirst({
      where: { status: 'ASSIGNED' }
    });

    if (!lot) {
      const lotId = uuidv4();
      lot = await prisma.qRCodeLot.create({
        data: {
          id: lotId,
          prefix: 'OKAR',
          count: 100,
          status: 'ASSIGNED',
          assignedToId: garage.id,
          assignedAt: new Date(),
          createdAt: new Date(),
        },
      });
    }

    // Chercher un QR code disponible
    let qrCode = await prisma.qRCodeStock.findFirst({
      where: { status: 'STOCK' }
    });

    if (!qrCode) {
      const qrCodeId = uuidv4();
      const uniqueCode = `OKAR-${Date.now()}`;
      qrCode = await prisma.qRCodeStock.create({
        data: {
          id: qrCodeId,
          codeUnique: uniqueCode,
          shortCode: `TST${Date.now().toString().slice(-6)}`,
          lotId: lot.id,
          status: 'LINKED',
          assignedGarageId: garage.id,
          activationDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.qRCodeStock.update({
        where: { id: qrCode.id },
        data: {
          status: 'LINKED',
          assignedGarageId: garage.id,
          activationDate: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    vehicle = await prisma.vehicle.create({
      data: {
        id: uuidv4(),
        reference: qrCode.codeUnique,
        type: 'voiture',
        make: 'Toyota',
        model: 'Corolla',
        year: 2018,
        color: 'Blanc',
        licensePlate: 'DK-1234-AB',
        engineType: 'essence',
        currentMileage: 85000,
        ownerName: 'Ibrahima Sow',
        ownerPhone: '77 987 65 43',
        garageId: garage.id,
        lotId: lot.id,
        qrStatus: 'ACTIVE',
        status: 'active',
        okarScore: 75,
        okarBadge: 'SILVER',
        activatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Véhicule créé:', vehicle.make, vehicle.model, `- ${vehicle.licensePlate}`);
  } else {
    console.log('✅ Véhicule existant:', vehicle.make, vehicle.model, `- ${vehicle.licensePlate}`);
  }

  // 5. Créer quelques interventions de test si elles n'existent pas
  const existingRecords = await prisma.maintenanceRecord.count({
    where: { vehicleId: vehicle.id }
  });

  if (existingRecords === 0) {
    const today = new Date();
    
    // Vidange (Type A)
    await prisma.maintenanceRecord.create({
      data: {
        id: uuidv4(),
        vehicleId: vehicle.id,
        garageId: garage.id,
        category: 'vidange',
        description: 'Vidange complète avec filtre à huile',
        mileage: 82000,
        maintenanceDetails: JSON.stringify({
          oilViscosity: '5W30',
          oilBrand: 'TotalEnergies',
          oilType: 'synthetic',
          oilQuantity: 4.5,
          oilFilterChanged: true,
          oilFilterReference: 'TOY-123',
        }),
        partsCost: 25000,
        laborCost: 10000,
        totalCost: 35000,
        status: 'VALIDATED',
        ownerValidation: 'VALIDATED',
        source: 'OKAR',
        isVerified: true,
        interventionDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Distribution (Type B)
    await prisma.maintenanceRecord.create({
      data: {
        id: uuidv4(),
        vehicleId: vehicle.id,
        garageId: garage.id,
        category: 'distribution',
        description: 'Remplacement kit de distribution complet',
        mileage: 75000,
        isMajorRepair: true,
        affectedOrgans: JSON.stringify(['distribution']),
        partCondition: 'neuf_origine',
        accidentRelated: false,
        repairPhotos: JSON.stringify([]),
        partsCost: 150000,
        laborCost: 50000,
        totalCost: 200000,
        status: 'VALIDATED',
        ownerValidation: 'VALIDATED',
        source: 'OKAR',
        isVerified: true,
        interventionDate: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Carrosserie (Type C - Accident)
    await prisma.maintenanceRecord.create({
      data: {
        id: uuidv4(),
        vehicleId: vehicle.id,
        garageId: garage.id,
        category: 'carrosserie',
        description: 'Réparation choc avant droit',
        mileage: 60000,
        isMajorRepair: true,
        affectedOrgans: JSON.stringify(['chassis']),
        partCondition: 'neuf_adaptable',
        accidentRelated: true,
        accidentDescription: 'Choc léger avant droit suite à accrochage, redressage effectué. Gravité: modéré',
        repairPhotos: JSON.stringify([]),
        partsCost: 80000,
        laborCost: 40000,
        totalCost: 120000,
        status: 'VALIDATED',
        ownerValidation: 'VALIDATED',
        source: 'OKAR',
        isVerified: true,
        interventionDate: new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ 3 interventions de test créées (Vidange, Distribution, Carrosserie)');
  } else {
    console.log(`✅ ${existingRecords} intervention(s) existante(s) pour ce véhicule`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 IDENTIFIANTS DE TEST');
  console.log('='.repeat(60));
  console.log('\n👤 GARAGE:');
  console.log('   Email: garage@test.com');
  console.log('   Mot de passe: Test1234!');
  console.log('\n👤 ADMIN:');
  console.log('   Email: admin@okar.sn');
  console.log('   Mot de passe: Test1234!');
  console.log('\n🚗 VÉHICULE TEST:');
  console.log('   Référence:', vehicle.reference);
  console.log('   Plaque: DK-1234-AB');
  console.log('   URL: http://localhost:3000/scan/' + vehicle.reference);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
