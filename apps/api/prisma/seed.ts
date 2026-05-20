import {
  PrismaClient,
  UserRole,
  ProjectStatus,
  BidStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashSync } from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

function skillsConnect(names: string[]) {
  return {
    userSkills: {
      create: names.map((name) => ({
        skill: {
          connectOrCreate: {
            where: { name },
            create: { name },
          },
        },
      })),
    },
  };
}

async function main() {
  await prisma.bid.deleteMany();
  await prisma.project.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = hashSync('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash,
      role: UserRole.ADMIN,
      name: 'Demo Admin',
      about: 'Администратор платформы',
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      passwordHash,
      role: UserRole.CUSTOMER,
      name: 'Demo Customer',
      about: 'Заказчик IT-проектов',
    },
  });

  const contractor1 = await prisma.user.create({
    data: {
      email: 'contractor1@example.com',
      passwordHash,
      role: UserRole.CONTRACTOR,
      name: 'Demo Contractor 1',
      about: 'Frontend developer',
      ...skillsConnect(['Next.js', 'TypeScript', 'React']),
    },
  });

  const contractor2 = await prisma.user.create({
    data: {
      email: 'contractor2@example.com',
      passwordHash,
      role: UserRole.CONTRACTOR,
      name: 'Demo Contractor 2',
      about: 'Backend developer',
      ...skillsConnect(['NestJS', 'Prisma', 'PostgreSQL']),
    },
  });

  const openProject1 = await prisma.project.create({
    data: {
      customerId: customer.id,
      title: 'Разработка MVP платформы',
      description: 'Нужен исполнитель для разработки первой версии сервиса.',
      budgetMin: 50000,
      budgetMax: 90000,
      status: ProjectStatus.OPEN,
    },
  });

  const openProject2 = await prisma.project.create({
    data: {
      customerId: customer.id,
      title: 'Создание адаптивного интерфейса',
      description: 'Требуется сверстать и подключить frontend для платформы.',
      budgetMin: 30000,
      budgetMax: 60000,
      status: ProjectStatus.OPEN,
    },
  });

  const inWorkProject = await prisma.project.create({
    data: {
      customerId: customer.id,
      title: 'Доработка backend API',
      description: 'Нужно расширить API и подготовить документацию.',
      budgetMin: 40000,
      budgetMax: 70000,
      status: ProjectStatus.IN_WORK,
      selectedContractorId: contractor2.id,
    },
  });

  await prisma.bid.create({
    data: {
      projectId: openProject1.id,
      contractorId: contractor1.id,
      price: 70000,
      durationDays: 14,
      coverLetter: 'Готов реализовать frontend и интеграцию API.',
      status: BidStatus.PENDING,
    },
  });

  await prisma.bid.create({
    data: {
      projectId: openProject1.id,
      contractorId: contractor2.id,
      price: 65000,
      durationDays: 12,
      coverLetter: 'Могу взять backend и БД.',
      status: BidStatus.PENDING,
    },
  });

  await prisma.bid.create({
    data: {
      projectId: inWorkProject.id,
      contractorId: contractor2.id,
      price: 55000,
      durationDays: 10,
      coverLetter: 'Приступлю сразу после согласования.',
      status: BidStatus.ACCEPTED,
    },
  });

  console.log('Seed completed successfully');
  console.log({
    adminId: admin.id,
    customerId: customer.id,
    contractor1Id: contractor1.id,
    contractor2Id: contractor2.id,
    openProject1Id: openProject1.id,
    openProject2Id: openProject2.id,
    inWorkProjectId: inWorkProject.id,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
