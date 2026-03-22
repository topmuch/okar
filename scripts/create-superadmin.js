const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Vérifier si un superadmin existe déjà
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'superadmin' }
    });

    if (existingAdmin) {
      console.log('✅ Un Superadmin existe déjà:');
      console.log('   Email:', existingAdmin.email);
      console.log('   ID:', existingAdmin.id);
      return;
    }

    // Créer le superadmin
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        id: 'superadmin-' + Date.now(),
        email: 'admin@okar.sn',
        name: 'Super Admin OKAR',
        phone: '+221770000000',
        password: hashedPassword,
        role: 'superadmin',
        emailVerified: true,
        phoneVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('🎉 Superadmin créé avec succès !');
    console.log('');
    console.log('📋 Identifiants de connexion:');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Email:    admin@okar.sn');
    console.log('   Password: Admin123!');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🌐 URL de connexion:');
    console.log('   http://localhost:3001/admin/connexion');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
