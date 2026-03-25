import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Trouver le véhicule
  const vehicle = await prisma.vehicle.findFirst({
    where: { licensePlate: 'DK-1234-AB' }
  });

  if (!vehicle) {
    console.log('❌ Véhicule non trouvé');
    return;
  }

  // Trouver le garage
  const garage = await prisma.garage.findFirst({
    where: { slug: 'auto-garage-test' }
  });

  if (!garage) {
    console.log('❌ Garage non trouvé');
    return;
  }

  // Vérifier s'il y a déjà une intervention carrosserie
  const existingCarrosserie = await prisma.maintenanceRecord.findFirst({
    where: { vehicleId: vehicle.id, category: 'carrosserie' }
  });

  if (existingCarrosserie) {
    console.log('✅ Intervention carrosserie existe déjà');
    return;
  }

  // Créer intervention carrosserie (Type C - Accident)
  const today = new Date();
  await prisma.maintenanceRecord.create({
    data: {
      id: uuidv4(),
      vehicleId: vehicle.id,
      garageId: garage.id,
      category: 'carrosserie',
      description: 'Réparation choc avant droit - redressage et peinture',
      mileage: 60000,
      isMajorRepair: true,
      affectedOrgans: JSON.stringify(['chassis']),
      partCondition: 'neuf_adaptable',
      accidentRelated: true,
      accidentDescription: 'Choc léger avant droit suite à accrochage. Redressage effectué, passage au marbre validé.',
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

  console.log('✅ Intervention carrosserie créée');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
