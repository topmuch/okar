import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Update admin role to superadmin
  const result = await prisma.user.update({
    where: { email: 'admin@okar.sn' },
    data: { role: 'superadmin' }
  });
  console.log('✅ Updated user:', result.email, '→ role:', result.role);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
