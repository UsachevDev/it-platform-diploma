import { INestApplication } from '@nestjs/common';
import { ProjectStatus, UserRole } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  acceptBid,
  clearDb,
  createBid,
  createProject,
  createTestApp,
  registerAndLogin,
} from './test-helpers';

describe('Projects (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await clearDb(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow customer to create project', async () => {
    const { accessToken } = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const res = await createProject(app, accessToken).expect(201);

    expect(res.body.title).toBe('Landing page development');
    expect(res.body.status).toBe(ProjectStatus.OPEN);
  });

  it('should forbid contractor from creating project', async () => {
    const { accessToken } = await registerAndLogin(app, {
      name: 'Contractor',
      email: 'contractor@test.com',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
    });

    await createProject(app, accessToken).expect(403);
  });

  it('should reject invalid project payload', async () => {
    const { accessToken } = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'a',
        description: 'short',
        budgetMin: -1,
        budgetMax: 10,
      })
      .expect(400);
  });

  it('should return projects list with pagination and search', async () => {
    const { accessToken } = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    await createProject(app, accessToken, {
      title: 'Landing page alpha',
      description: 'Marketing landing page for startup',
    }).expect(201);

    await createProject(app, accessToken, {
      title: 'CRM beta',
      description: 'Internal CRM system for sales department',
    }).expect(201);

    const res = await request(app.getHttpServer())
      .get('/projects?search=Landing&page=1&limit=10&status=OPEN')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Landing page alpha');
    expect(res.body.meta).toBeDefined();
  });

  it('should return project by id', async () => {
    const { accessToken } = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const createRes = await createProject(app, accessToken).expect(201);

    const res = await request(app.getHttpServer())
      .get(`/projects/${createRes.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.id).toBe(createRes.body.id);
  });

  it('should return 404 for missing project', async () => {
    const { accessToken } = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    await request(app.getHttpServer())
      .get('/projects/11111111-1111-1111-1111-111111111111')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('should allow owner to update OPEN project', async () => {
    const { accessToken } = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const createRes = await createProject(app, accessToken).expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/projects/${createRes.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Updated project title',
      })
      .expect(200);

    expect(res.body.title).toBe('Updated project title');
  });

  it('should forbid non-owner from updating project', async () => {
    const owner = await registerAndLogin(app, {
      name: 'Owner',
      email: 'owner@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const anotherCustomer = await registerAndLogin(app, {
      name: 'Another',
      email: 'another@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const createRes = await createProject(app, owner.accessToken).expect(201);

    await request(app.getHttpServer())
      .patch(`/projects/${createRes.body.id}`)
      .set('Authorization', `Bearer ${anotherCustomer.accessToken}`)
      .send({
        title: 'Illegal update',
      })
      .expect(403);
  });

  it('should reject update for non-OPEN project', async () => {
    const customer = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const contractor = await registerAndLogin(app, {
      name: 'Contractor',
      email: 'contractor@test.com',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
    });

    const projectRes = await createProject(app, customer.accessToken).expect(
      201,
    );
    const bidRes = await createBid(
      app,
      contractor.accessToken,
      projectRes.body.id,
    ).expect(201);

    await acceptBid(app, customer.accessToken, bidRes.body.id).expect(201);

    await request(app.getHttpServer())
      .patch(`/projects/${projectRes.body.id}`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({
        title: 'Should fail',
      })
      .expect(400);
  });

  it('should allow owner to cancel OPEN project', async () => {
    const customer = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const projectRes = await createProject(app, customer.accessToken).expect(
      201,
    );

    const res = await request(app.getHttpServer())
      .post(`/projects/${projectRes.body.id}/cancel`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(201);

    expect(res.body.status).toBe(ProjectStatus.CANCELED);
  });

  it('should forbid non-owner from canceling project', async () => {
    const owner = await registerAndLogin(app, {
      name: 'Owner',
      email: 'owner@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const anotherCustomer = await registerAndLogin(app, {
      name: 'Another',
      email: 'another@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const projectRes = await createProject(app, owner.accessToken).expect(201);

    await request(app.getHttpServer())
      .post(`/projects/${projectRes.body.id}/cancel`)
      .set('Authorization', `Bearer ${anotherCustomer.accessToken}`)
      .expect(403);
  });

  it('should reject cancel for non-OPEN project', async () => {
    const customer = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const contractor = await registerAndLogin(app, {
      name: 'Contractor',
      email: 'contractor@test.com',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
    });

    const projectRes = await createProject(app, customer.accessToken).expect(
      201,
    );
    const bidRes = await createBid(
      app,
      contractor.accessToken,
      projectRes.body.id,
    ).expect(201);

    await acceptBid(app, customer.accessToken, bidRes.body.id).expect(201);

    await request(app.getHttpServer())
      .post(`/projects/${projectRes.body.id}/cancel`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(400);
  });

  it('should allow owner to mark project DONE from IN_WORK', async () => {
    const customer = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const contractor = await registerAndLogin(app, {
      name: 'Contractor',
      email: 'contractor@test.com',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
    });

    const projectRes = await createProject(app, customer.accessToken).expect(
      201,
    );
    const bidRes = await createBid(
      app,
      contractor.accessToken,
      projectRes.body.id,
    ).expect(201);

    await acceptBid(app, customer.accessToken, bidRes.body.id).expect(201);

    const doneRes = await request(app.getHttpServer())
      .post(`/projects/${projectRes.body.id}/done`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(201);

    expect(doneRes.body.status).toBe(ProjectStatus.DONE);
  });

  it('should forbid non-owner from marking project DONE', async () => {
    const owner = await registerAndLogin(app, {
      name: 'Owner',
      email: 'owner@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const anotherCustomer = await registerAndLogin(app, {
      name: 'Another',
      email: 'another@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const contractor = await registerAndLogin(app, {
      name: 'Contractor',
      email: 'contractor@test.com',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
    });

    const projectRes = await createProject(app, owner.accessToken).expect(201);
    const bidRes = await createBid(
      app,
      contractor.accessToken,
      projectRes.body.id,
    ).expect(201);

    await acceptBid(app, owner.accessToken, bidRes.body.id).expect(201);

    await request(app.getHttpServer())
      .post(`/projects/${projectRes.body.id}/done`)
      .set('Authorization', `Bearer ${anotherCustomer.accessToken}`)
      .expect(403);
  });

  it('should reject markDone for project that is not IN_WORK', async () => {
    const customer = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const projectRes = await createProject(app, customer.accessToken).expect(
      201,
    );

    await request(app.getHttpServer())
      .post(`/projects/${projectRes.body.id}/done`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(400);
  });
});
