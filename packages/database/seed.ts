import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed data for development — not for production
  const user = await prisma.user.upsert({
    where: { email: 'demo@bdgt.dev' },
    update: {},
    create: {
      email: 'demo@bdgt.dev',
      // bcrypt hash of "password123" — replace with a proper hash
      passwordHash: '$2b$10$placeholder.hash.replace.before.running',
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
