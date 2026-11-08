import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.avatarConfig.deleteMany();
  await prisma.avatarConfig.createMany({
    data: [
      { gender: 'MALE', label: 'AI Assistant (Male presentation)', voiceId: 'mock-male', isActive: true },
      { gender: 'FEMALE', label: 'AI Assistant (Female presentation)', voiceId: 'mock-female', isActive: true },
    ],
  });

  await prisma.aiProviderConfig.upsert({
    where: { name: 'default' },
    create: {
      name: 'default',
      provider: process.env.AI_PROVIDER ?? 'mock',
      isActive: true,
      config: { mode: process.env.AI_PROVIDER ?? 'mock' } as object,
    },
    update: {
      provider: process.env.AI_PROVIDER ?? 'mock',
      isActive: true,
      config: { mode: process.env.AI_PROVIDER ?? 'mock' } as object,
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete (no real patient data).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
