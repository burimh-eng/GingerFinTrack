import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedUsers() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const [burimi, skenderi] = await Promise.all([
    prisma.user.upsert({
      where: { username: 'Burim' },
      update: {},
      create: {
        username: 'Burim',
        password: hashedPassword,
        role: 'ADMIN',
        email: 'burim@example.com',
        fullName: 'Burimi',
      },
    }),
    prisma.user.upsert({
      where: { username: 'Skender' },
      update: {},
      create: {
        username: 'Skender',
        password: hashedPassword,
        role: 'VIEWER',
        email: 'skenderi@example.com',
        fullName: 'Skenderi',
      },
    }),
  ]);

  console.log('Users seeded successfully');
  return [burimi, skenderi];
}

async function main() {
  console.info('🌱 Seeding database...');

  const [burimi, skenderi] = await seedUsers();

  const accounts = await prisma.$transaction([
    prisma.account.upsert({
      where: { name: 'Cash' },
      update: {},
      create: { name: 'Cash' },
    }),
    prisma.account.upsert({
      where: { name: 'Bank' },
      update: {},
      create: { name: 'Bank' },
    }),
    prisma.account.upsert({
      where: { name: 'POS' },
      update: {},
      create: { name: 'POS' },
    }),
    prisma.account.upsert({
      where: { name: 'Divident' },
      update: {},
      create: { name: 'Divident' },
    }),
  ]);

  const categories = await prisma.$transaction([
    prisma.category.upsert({
      where: { name: 'Te Hyra' },
      update: {},
      create: { name: 'Te Hyra' },
    }),
    prisma.category.upsert({
      where: { name: 'Shpenzime' },
      update: {},
      create: { name: 'Shpenzime' },
    }),
    prisma.category.upsert({
      where: { name: 'Transfere' },
      update: {},
      create: { name: 'Transfere' },
    }),
  ]);

  const [teHyra, shpenzime] = categories;

  const [gingerExpense, posIncome, rrogaExpense] = await prisma.$transaction([
    prisma.subcategory.upsert({
      where: { categoryId_name: { categoryId: shpenzime.id, name: 'GINGER' } },
      update: {},
      create: { name: 'GINGER', categoryId: shpenzime.id },
    }),
    prisma.subcategory.upsert({
      where: { categoryId_name: { categoryId: teHyra.id, name: 'POS' } },
      update: {},
      create: { name: 'POS', categoryId: teHyra.id },
    }),
    prisma.subcategory.upsert({
      where: { categoryId_name: { categoryId: shpenzime.id, name: 'Rroga' } },
      update: {},
      create: { name: 'Rroga', categoryId: shpenzime.id },
    }),
  ]);

  const gingerProject = await prisma.project.upsert({
    where: { userId_name: { userId: burimi.id, name: 'Ginger HQ' } },
    update: {},
    create: {
      name: 'Ginger HQ',
      description: 'Primary operations',
      userId: burimi.id,
    },
  });

  const posProject = await prisma.project.upsert({
    where: { userId_name: { userId: skenderi.id, name: 'POS Upgrade' } },
    update: {},
    create: {
      name: 'POS Upgrade',
      description: 'POS network rollout',
      userId: skenderi.id,
    },
  });

  const rentTask = await prisma.task.create({
    data: {
      projectId: gingerProject.id,
      assignedTo: burimi.id,
      title: 'Monthly Rent Payment',
      status: 'done',
    },
  });

  const posTask = await prisma.task.create({
    data: {
      projectId: posProject.id,
      assignedTo: skenderi.id,
      title: 'POS Terminal Setup',
      status: 'in_progress',
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        projectId: gingerProject.id,
        taskId: rentTask.id,
        userId: burimi.id,
        accountId: accounts[0].id,
        subcategoryId: gingerExpense.id,
        txnDate: new Date('2025-01-02'),
        notes: 'Qiraja A',
        amount: -3304,
        counterparty: 'Skenderi',
        description: 'Qiraja Albi',
      },
      {
        projectId: gingerProject.id,
        userId: burimi.id,
        accountId: accounts[0].id,
        subcategoryId: posIncome.id,
        txnDate: new Date('2025-01-02'),
        notes: 'POS income',
        amount: 809,
        counterparty: 'Skenderi',
        description: 'Daily POS',
      },
      {
        projectId: posProject.id,
        taskId: posTask.id,
        userId: skenderi.id,
        accountId: accounts[1].id,
        subcategoryId: rrogaExpense.id,
        txnDate: new Date('2025-01-03'),
        notes: 'Paga te R',
        amount: -3183,
        counterparty: 'Skenderi',
        description: 'Paga te Dhjetorit',
      },
    ],
  });

  console.info('✅ Seed completed');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
