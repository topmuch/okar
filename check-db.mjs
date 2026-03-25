import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, isActive: true }
  });
  console.log('Users in database:');
  users.forEach(u => console.log(`  ${u.email} - role: ${u.role} - active: ${u.isActive}`));
  
  const garages = await prisma.garage.findMany({
    select: { name: true, isVerified: true, userId: true }
  });
  console.log('\nGarages:');
  garages.forEach(g => console.log(`  ${g.name} - verified: ${g.isVerified}`));

  const sessions = await prisma.session.findMany({
    select: { id: true, userId: true }
  });
  console.log('\nActive sessions:', sessions.length);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
