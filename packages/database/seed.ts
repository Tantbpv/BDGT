import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }) });

async function main() {
  console.log('Seeding database...');
  const passwordHash = await hash('demo@bdgt.dev', 12);
  // Seed data for development — not for production
  const user = await prisma.user.upsert({
    where: { email: 'demo@bdgt.dev' },
    update: {},
    create: {
      email: 'demo@bdgt.dev',
      passwordHash,
      name: 'Demo User',
    },
  });

  console.log('Created user:', user.email);

  const account = await prisma.account.upsert({
    where: { id: 'seed-account-id' },
    update: {},
    create: { id: 'seed-account-id', name: 'Personal' },
  });

  await prisma.userAccount.upsert({
    where: { userId_accountId: { userId: user.id, accountId: account.id } },
    update: {},
    create: { userId: user.id, accountId: account.id },
  });

  console.log('Created account:', account.name);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
