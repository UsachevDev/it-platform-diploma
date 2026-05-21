import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();

  return {
    app,
    prisma: app.get(PrismaService),
  };
}

export async function clearDb(prisma: PrismaService) {
  await prisma.bid.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

export function registerUser(
  app: INestApplication,
  payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  },
) {
  return request(app.getHttpServer()).post('/auth/register').send(payload);
}

export function loginUser(
  app: INestApplication,
  payload: {
    email: string;
    password: string;
  },
) {
  return request(app.getHttpServer()).post('/auth/login').send(payload);
}

export async function registerAndLogin(
  app: INestApplication,
  payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  },
) {
  const registerRes = await registerUser(app, payload).expect(201);

  const loginRes = await loginUser(app, {
    email: payload.email,
    password: payload.password,
  }).expect(201);

  return {
    user: registerRes.body.user,
    accessToken: loginRes.body.accessToken ?? loginRes.body.token,
  };
}

export function createProject(
  app: INestApplication,
  accessToken: string,
  overrides?: Partial<{
    title: string;
    description: string;
    budgetMin: number;
    budgetMax: number;
  }>,
) {
  return request(app.getHttpServer())
    .post('/projects')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      title: 'Landing page development',
      description: 'Need responsive landing page for startup',
      budgetMin: 50000,
      budgetMax: 90000,
      ...overrides,
    });
}

export function createBid(
  app: INestApplication,
  accessToken: string,
  projectId: string,
  overrides?: Partial<{
    price: number;
    durationDays: number;
    coverLetter: string;
  }>,
) {
  return request(app.getHttpServer())
    .post(`/projects/${projectId}/bids`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      price: 65000,
      durationDays: 14,
      coverLetter: 'Готов выполнить проект качественно и в срок',
      ...overrides,
    });
}

export function acceptBid(
  app: INestApplication,
  accessToken: string,
  bidId: string,
) {
  return request(app.getHttpServer())
    .post(`/bids/${bidId}/accept`)
    .set('Authorization', `Bearer ${accessToken}`);
}

export function rejectBid(
  app: INestApplication,
  accessToken: string,
  bidId: string,
) {
  return request(app.getHttpServer())
    .post(`/bids/${bidId}/reject`)
    .set('Authorization', `Bearer ${accessToken}`);
}
