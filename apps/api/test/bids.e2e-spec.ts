import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const TEST_EMAIL_PREFIX = 'bids-e2e';
const TEST_PROJECT_PREFIX = 'BIDS E2E';

type UserRole = 'CUSTOMER' | 'CONTRACTOR';

describe('Bids e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function cleanupTestData() {
    await prisma.bid.deleteMany({
      where: {
        OR: [
          {
            project: {
              title: {
                startsWith: TEST_PROJECT_PREFIX,
              },
            },
          },
          {
            contractor: {
              email: {
                startsWith: TEST_EMAIL_PREFIX,
              },
            },
          },
        ],
      },
    });

    await prisma.project.deleteMany({
      where: {
        title: {
          startsWith: TEST_PROJECT_PREFIX,
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: TEST_EMAIL_PREFIX,
        },
      },
    });
  }

  function makeEmail(role: UserRole) {
    return `${TEST_EMAIL_PREFIX}-${role.toLowerCase()}-${randomUUID()}@example.com`;
  }

  async function registerUser(role: UserRole) {
    const email = makeEmail(role);

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: '12345678',
        name: `${role}-${randomUUID().slice(0, 8)}`,
        role,
      })
      .expect(201);

    return {
      email,
      token: response.body.accessToken,
      user: response.body.user,
      raw: response.body,
    };
  }

  async function createProject(
    customerToken: string,
    overrides: Record<string, unknown> = {},
  ) {
    const response = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        title: `${TEST_PROJECT_PREFIX} ${randomUUID().slice(0, 8)}`,
        description: 'Тестовый проект для e2e проверки bids',
        budgetMin: 50000,
        budgetMax: 150000,
        ...overrides,
      });

    return response;
  }

  async function createBid(
    contractorToken: string,
    projectId: string,
    overrides: Record<string, unknown> = {},
  ) {
    const response = await request(app.getHttpServer())
      .post(`/projects/${projectId}/bids`)
      .set('Authorization', `Bearer ${contractorToken}`)
      .send({
        price: 45000,
        durationDays: 10,
        coverLetter: 'Готов выполнить проект качественно и в срок',
        ...overrides,
      });

    return response;
  }

  it('POST /projects/:id/bids -> создаёт отклик', async () => {
    const customer = await registerUser('CUSTOMER');
    const contractor = await registerUser('CONTRACTOR');

    const projectResponse = await createProject(customer.token);
    expect(projectResponse.status).toBe(201);

    const projectId = projectResponse.body.id;

    const bidResponse = await createBid(contractor.token, projectId);
    expect(bidResponse.status).toBe(201);

    expect(bidResponse.body).toMatchObject({
      projectId,
      price: 45000,
      durationDays: 10,
      status: 'PENDING',
    });

    expect(bidResponse.body.coverLetter).toBe(
      'Готов выполнить проект качественно и в срок',
    );
  });

  it('POST /projects/:id/bids -> не даёт отправить повторный отклик', async () => {
    const customer = await registerUser('CUSTOMER');
    const contractor = await registerUser('CONTRACTOR');

    const projectResponse = await createProject(customer.token);
    const projectId = projectResponse.body.id;

    await createBid(contractor.token, projectId).then((res) => {
      expect(res.status).toBe(201);
    });

    const secondResponse = await createBid(contractor.token, projectId);

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.message).toBe(
      'Вы уже отправили отклик на этот проект',
    );
  });

  it('POST /projects/:id/bids -> customer не может отправить отклик', async () => {
    const customer = await registerUser('CUSTOMER');

    const projectResponse = await createProject(customer.token);
    const projectId = projectResponse.body.id;

    const response = await request(app.getHttpServer())
      .post(`/projects/${projectId}/bids`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({
        price: 45000,
        durationDays: 10,
        coverLetter: 'Попытка отклика от заказчика',
      });

    expect(response.status).toBe(403);
  });

  it('POST /projects/:id/bids -> валидирует тело запроса', async () => {
    const customer = await registerUser('CUSTOMER');
    const contractor = await registerUser('CONTRACTOR');

    const projectResponse = await createProject(customer.token);
    const projectId = projectResponse.body.id;

    const response = await createBid(contractor.token, projectId, {
      price: 0,
      durationDays: 0,
      coverLetter: '',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(
      expect.arrayContaining([
        expect.stringContaining('price'),
        expect.stringContaining('durationDays'),
        expect.stringContaining('coverLetter'),
      ]),
    );
  });

  it('POST /projects/:id/bids -> 404 для несуществующего проекта и 400 для невалидного uuid', async () => {
    const contractor = await registerUser('CONTRACTOR');

    const notFoundResponse = await createBid(contractor.token, randomUUID());
    expect(notFoundResponse.status).toBe(404);
    expect(notFoundResponse.body.message).toBe('Проект не найден');

    const invalidUuidResponse = await request(app.getHttpServer())
      .post('/projects/not-a-uuid/bids')
      .set('Authorization', `Bearer ${contractor.token}`)
      .send({
        price: 45000,
        durationDays: 10,
        coverLetter: 'Тест невалидного UUID',
      });

    expect(invalidUuidResponse.status).toBe(400);
    expect(invalidUuidResponse.body.message).toContain('uuid');
  });

  it('GET /projects/:id/bids -> владелец проекта видит отклики, чужой customer не видит', async () => {
    const ownerCustomer = await registerUser('CUSTOMER');
    const чужойCustomer = await registerUser('CUSTOMER');
    const contractor1 = await registerUser('CONTRACTOR');
    const contractor2 = await registerUser('CONTRACTOR');

    const projectResponse = await createProject(ownerCustomer.token);
    const projectId = projectResponse.body.id;

    const bid1 = await createBid(contractor1.token, projectId);
    const bid2 = await createBid(contractor2.token, projectId);

    expect(bid1.status).toBe(201);
    expect(bid2.status).toBe(201);

    const ownerResponse = await request(app.getHttpServer())
      .get(`/projects/${projectId}/bids`)
      .set('Authorization', `Bearer ${ownerCustomer.token}`);

    expect(ownerResponse.status).toBe(200);
    expect(Array.isArray(ownerResponse.body)).toBe(true);
    expect(ownerResponse.body).toHaveLength(2);

    const receivedIds = ownerResponse.body.map((item: any) => item.id);
    expect(receivedIds).toEqual(
      expect.arrayContaining([bid1.body.id, bid2.body.id]),
    );

    const forbiddenResponse = await request(app.getHttpServer())
      .get(`/projects/${projectId}/bids`)
      .set('Authorization', `Bearer ${чужойCustomer.token}`);

    expect(forbiddenResponse.status).toBe(403);
  });

  it('GET /bids/my -> исполнитель видит только свои отклики', async () => {
    const customer = await registerUser('CUSTOMER');
    const contractor1 = await registerUser('CONTRACTOR');
    const contractor2 = await registerUser('CONTRACTOR');

    const project1 = await createProject(customer.token);
    const project2 = await createProject(customer.token);

    const bid1 = await createBid(contractor1.token, project1.body.id);
    const bid2 = await createBid(contractor2.token, project2.body.id);

    expect(bid1.status).toBe(201);
    expect(bid2.status).toBe(201);

    const myBidsResponse = await request(app.getHttpServer())
      .get('/bids/my')
      .set('Authorization', `Bearer ${contractor1.token}`);

    expect(myBidsResponse.status).toBe(200);
    expect(Array.isArray(myBidsResponse.body)).toBe(true);
    expect(myBidsResponse.body.length).toBeGreaterThanOrEqual(1);

    const ids = myBidsResponse.body.map((item: any) => item.id);
    expect(ids).toContain(bid1.body.id);
    expect(ids).not.toContain(bid2.body.id);

    expect(myBidsResponse.body[0]).toHaveProperty('project');
  });

  it('POST /bids/:id/reject -> заказчик может отклонить pending bid', async () => {
    const customer = await registerUser('CUSTOMER');
    const contractor = await registerUser('CONTRACTOR');

    const projectResponse = await createProject(customer.token);
    const bidResponse = await createBid(
      contractor.token,
      projectResponse.body.id,
    );

    const rejectResponse = await request(app.getHttpServer())
      .post(`/bids/${bidResponse.body.id}/reject`)
      .set('Authorization', `Bearer ${customer.token}`);

    expect(rejectResponse.status).toBe(201);
    expect(rejectResponse.body.status).toBe('REJECTED');

    const secondRejectResponse = await request(app.getHttpServer())
      .post(`/bids/${bidResponse.body.id}/reject`)
      .set('Authorization', `Bearer ${customer.token}`);

    expect(secondRejectResponse.status).toBe(409);
  });

  it('POST /bids/:id/accept -> принимает один bid, остальные pending отклоняет, проект переводит в IN_WORK', async () => {
    const customer = await registerUser('CUSTOMER');
    const contractor1 = await registerUser('CONTRACTOR');
    const contractor2 = await registerUser('CONTRACTOR');

    const projectResponse = await createProject(customer.token);
    const projectId = projectResponse.body.id;

    const bid1 = await createBid(contractor1.token, projectId);
    const bid2 = await createBid(contractor2.token, projectId);

    expect(bid1.status).toBe(201);
    expect(bid2.status).toBe(201);

    const acceptResponse = await request(app.getHttpServer())
      .post(`/bids/${bid1.body.id}/accept`)
      .set('Authorization', `Bearer ${customer.token}`);

    expect(acceptResponse.status).toBe(201);
    expect(acceptResponse.body.message).toBe(
      'Исполнитель выбран, проект переведён в IN_WORK',
    );
    expect(acceptResponse.body.bid.status).toBe('ACCEPTED');
    expect(acceptResponse.body.project.status).toBe('IN_WORK');
    expect(acceptResponse.body.project.selectedContractorId).toBe(
      acceptResponse.body.bid.contractor.id,
    );

    const bidsAfterAccept = await request(app.getHttpServer())
      .get(`/projects/${projectId}/bids`)
      .set('Authorization', `Bearer ${customer.token}`);

    expect(bidsAfterAccept.status).toBe(200);

    const acceptedBid = bidsAfterAccept.body.find(
      (item: any) => item.id === bid1.body.id,
    );
    const rejectedBid = bidsAfterAccept.body.find(
      (item: any) => item.id === bid2.body.id,
    );

    expect(acceptedBid.status).toBe('ACCEPTED');
    expect(rejectedBid.status).toBe('REJECTED');

    const secondAcceptResponse = await request(app.getHttpServer())
      .post(`/bids/${bid2.body.id}/accept`)
      .set('Authorization', `Bearer ${customer.token}`);

    expect(secondAcceptResponse.status).toBe(409);
  });
});
