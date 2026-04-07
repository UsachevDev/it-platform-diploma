import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BidStatus, ProjectStatus, UserRole } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('MVP flow (e2e)', () => {
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
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "Bid", "Project", "User" CASCADE;',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  const getAccessToken = (body: any): string => {
    return body.accessToken ?? body.token;
  };

  it('should complete full happy path: register -> login -> create project -> create bid -> accept bid -> done', async () => {
    const customerRegisterPayload = {
      name: 'Customer User',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    };

    const contractorRegisterPayload = {
      name: 'Contractor User',
      email: 'contractor@test.com',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
    };

    const customerRegisterRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(customerRegisterPayload)
      .expect(201);

    const contractorRegisterRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(contractorRegisterPayload)
      .expect(201);

    expect(customerRegisterRes.body.user.email).toBe('customer@test.com');
    expect(customerRegisterRes.body.user.role).toBe(UserRole.CUSTOMER);

    expect(contractorRegisterRes.body.user.email).toBe('contractor@test.com');
    expect(contractorRegisterRes.body.user.role).toBe(UserRole.CONTRACTOR);

    const customerLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'customer@test.com',
        password: 'Password123!',
      })
      .expect(201);

    const contractorLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'contractor@test.com',
        password: 'Password123!',
      })
      .expect(201);

    const customerToken = getAccessToken(customerLoginRes.body);
    const contractorToken = getAccessToken(contractorLoginRes.body);

    expect(customerToken).toBeDefined();
    expect(contractorToken).toBeDefined();

    const createProjectPayload = {
      title: 'Landing page for startup',
      description: 'Need responsive landing page with admin panel later',
      budgetMin: 50000,
      budgetMax: 80000,
    };

    const createProjectRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(createProjectPayload)
      .expect(201);

    const projectId = createProjectRes.body.id;

    expect(projectId).toBeDefined();
    expect(createProjectRes.body.title).toBe(createProjectPayload.title);
    expect(createProjectRes.body.status).toBe(ProjectStatus.OPEN);

    const createBidPayload = {
      price: 65000,
      durationDays: 14,
      coverLetter: 'Готов сделать качественно и в срок',
    };

    const createBidRes = await request(app.getHttpServer())
      .post(`/projects/${projectId}/bids`)
      .set('Authorization', `Bearer ${contractorToken}`)
      .send(createBidPayload)
      .expect(201);

    const bidId = createBidRes.body.id;

    expect(bidId).toBeDefined();
    expect(createBidRes.body.status).toBe(BidStatus.PENDING);
    expect(createBidRes.body.project.id).toBe(projectId);

    const projectBidsRes = await request(app.getHttpServer())
      .get(`/projects/${projectId}/bids`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(Array.isArray(projectBidsRes.body)).toBe(true);
    expect(projectBidsRes.body).toHaveLength(1);
    expect(projectBidsRes.body[0].id).toBe(bidId);

    const acceptBidRes = await request(app.getHttpServer())
      .post(`/bids/${bidId}/accept`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(201);

    expect(acceptBidRes.body.message).toBe(
      'Исполнитель выбран, проект переведён в IN_WORK',
    );
    expect(acceptBidRes.body.bid.status).toBe(BidStatus.ACCEPTED);
    expect(acceptBidRes.body.project.status).toBe(ProjectStatus.IN_WORK);

    const myBidsRes = await request(app.getHttpServer())
      .get('/bids/my')
      .set('Authorization', `Bearer ${contractorToken}`)
      .expect(200);

    expect(Array.isArray(myBidsRes.body)).toBe(true);
    expect(myBidsRes.body).toHaveLength(1);
    expect(myBidsRes.body[0].id).toBe(bidId);
    expect(myBidsRes.body[0].status).toBe(BidStatus.ACCEPTED);

    const markDoneRes = await request(app.getHttpServer())
      .post(`/projects/${projectId}/done`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(201);

    expect(markDoneRes.body.status).toBe(ProjectStatus.DONE);

    const projectRes = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(projectRes.body.id).toBe(projectId);
    expect(projectRes.body.status).toBe(ProjectStatus.DONE);
  });
});
