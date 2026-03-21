import { db } from './src/lib/db'
import { nanoid } from 'nanoid'

async function main() {
  console.log('🌱 Seeding database for OKAR Report Module...')

  // Create a test garage
  const garage = await db.garage.upsert({
    where: { slug: 'auto-plus-dakar' },
    update: {},
    create: {
      name: 'Auto Plus Dakar',
      slug: 'auto-plus-dakar',
      email: 'contact@autoplus.sn',
      phone: '+221 78 123 45 67',
      address: 'Medina, Dakar, Senegal',
      isCertified: true,
      latitude: 14.6934,
      longitude: -17.4478,
    }
  })

  console.log('✅ Garage created:', garage.name)

  // Create a second garage
  const garage2 = await db.garage.upsert({
    where: { slug: 'toyota-medina' },
    update: {},
    create: {
      name: 'Toyota Medina',
      slug: 'toyota-medina',
      email: 'service@toyota-medina.sn',
      phone: '+221 78 234 56 78',
      address: 'Medina, Dakar',
      isCertified: true,
      latitude: 14.6920,
      longitude: -17.4450,
    }
  })

  console.log('✅ Garage 2 created:', garage2.name)

  // Create test vehicle 1 - Toyota Corolla with good history
  const vehicle1 = await db.vehicle.upsert({
    where: { reference: 'OKAR-DEMO-001' },
    update: {},
    create: {
      reference: 'OKAR-DEMO-001',
      make: 'Toyota',
      model: 'Corolla',
      year: 2018,
      color: 'Blanc Perle',
      licensePlate: 'DK-123-AB',
      vin: 'JTDKN3DU5A0123456',
      engineType: 'essence',
      currentMileage: 87450,
      vtEndDate: new Date('2025-08-15'),
      insuranceEndDate: new Date('2025-09-20'),
      insuranceCompany: 'AXA Senegal',
      garageId: garage.id,
      okarScore: 88,
      status: 'active',
      activatedAt: new Date('2022-01-15'),
    }
  })

  console.log('✅ Vehicle 1 created:', vehicle1.make, vehicle1.model)

  // Create maintenance records for vehicle 1
  const maintenanceRecords = [
    {
      category: 'vidange',
      description: 'Vidange complete avec filtre a huile',
      mileage: 87450,
      partsCost: 25000,
      laborCost: 20000,
      totalCost: 45000,
      interventionDate: new Date('2024-01-12'),
      garageId: garage.id,
      vehicleId: vehicle1.id,
      status: 'VALIDATED',
      ownerValidation: 'VALIDATED',
    },
    {
      category: 'freins',
      description: 'Revision freins arrieres - plaquettes et disques',
      mileage: 82300,
      partsCost: 75000,
      laborCost: 45000,
      totalCost: 120000,
      interventionDate: new Date('2023-10-15'),
      garageId: garage2.id,
      vehicleId: vehicle1.id,
      status: 'VALIDATED',
      ownerValidation: 'VALIDATED',
    },
    {
      category: 'climatisation',
      description: 'Recharge climatisation + controle',
      mileage: 77100,
      partsCost: 15000,
      laborCost: 50000,
      totalCost: 65000,
      interventionDate: new Date('2023-07-22'),
      garageId: garage.id,
      vehicleId: vehicle1.id,
      status: 'VALIDATED',
      ownerValidation: 'VALIDATED',
    },
    {
      category: 'pneus',
      description: 'Remplacement 2 pneus avant Michelin',
      mileage: 70500,
      partsCost: 80000,
      laborCost: 15000,
      totalCost: 95000,
      interventionDate: new Date('2023-03-05'),
      garageId: garage.id,
      vehicleId: vehicle1.id,
      status: 'VALIDATED',
      ownerValidation: 'VALIDATED',
    },
    {
      category: 'moteur',
      description: 'Revision complete 60000 km',
      mileage: 60200,
      partsCost: 185000,
      laborCost: 100000,
      totalCost: 285000,
      interventionDate: new Date('2022-09-18'),
      garageId: garage2.id,
      vehicleId: vehicle1.id,
      status: 'VALIDATED',
      ownerValidation: 'VALIDATED',
    },
  ]

  for (const record of maintenanceRecords) {
    await db.maintenanceRecord.create({ data: record })
  }

  console.log('✅ Maintenance records created for Vehicle 1')

  // Create ownership history
  try {
    await db.ownershipHistory.create({
      data: {
        vehicleId: vehicle1.id,
        previousOwnerName: 'Mamadou D.',
        newOwnerName: 'Fatou N.',
        transferType: 'sale',
        transferDate: new Date('2022-06-15'),
        transferPrice: 7500000,
      }
    })
    await db.ownershipHistory.create({
      data: {
        vehicleId: vehicle1.id,
        previousOwnerName: 'First Owner',
        newOwnerName: 'Mamadou D.',
        transferType: 'sale',
        transferDate: new Date('2020-03-10'),
        transferPrice: 12000000,
      }
    })
    console.log('✅ Ownership history created')
  } catch (e) {
    console.log('ℹ️ Ownership history already exists')
  }

  // Create test vehicle 2 - Another one for testing
  const vehicle2 = await db.vehicle.upsert({
    where: { reference: 'OKAR-DEMO-002' },
    update: {},
    create: {
      reference: 'OKAR-DEMO-002',
      make: 'Peugeot',
      model: '308',
      year: 2019,
      color: 'Gris',
      licensePlate: 'AA-456-CD',
      vin: 'VF3LV8HZ12345678',
      engineType: 'diesel',
      currentMileage: 65000,
      vtEndDate: new Date('2024-12-01'), // Expired!
      insuranceEndDate: new Date('2025-03-01'), // Almost expired
      insuranceCompany: 'SUNU Assurances',
      garageId: garage.id,
      okarScore: 45,
      status: 'active',
      activatedAt: new Date('2023-05-20'),
    }
  })

  console.log('✅ Vehicle 2 created:', vehicle2.make, vehicle2.model)

  // Create maintenance records for vehicle 2 (less maintenance, lower score)
  try {
    await db.maintenanceRecord.create({
      data: {
        category: 'vidange',
        description: 'Vidange simple',
        mileage: 65000,
        partsCost: 15000,
        laborCost: 10000,
        totalCost: 25000,
        interventionDate: new Date('2023-11-20'),
        garageId: garage.id,
        vehicleId: vehicle2.id,
        status: 'VALIDATED',
        ownerValidation: 'VALIDATED',
      }
    })
    await db.maintenanceRecord.create({
      data: {
        category: 'autre',
        description: 'Controle general',
        mileage: 45000,
        partsCost: 0,
        laborCost: 20000,
        totalCost: 20000,
        interventionDate: new Date('2022-05-15'),
        garageId: garage.id,
        vehicleId: vehicle2.id,
        status: 'VALIDATED',
        ownerValidation: 'VALIDATED',
      }
    })
    console.log('✅ Maintenance records created for Vehicle 2')
  } catch (e) {
    console.log('ℹ️ Vehicle 2 maintenance records may already exist')
  }

  console.log('\n🎉 Seeding completed!')
  console.log('\nTest vehicles:')
  console.log('  - DK-123-AB (Toyota Corolla 2018) - Score: 88 - Good condition')
  console.log('  - AA-456-CD (Peugeot 308 2019) - Score: 45 - Has alerts')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
