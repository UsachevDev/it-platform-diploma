import { INestApplication } from '@nestjs/common';
import { BidStatus, ProjectStatus, UserRole } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  acceptBid,
  clearDb,
  createBid,
  createProject,
  createTestApp,
  registerAndLogin,
  rejectBid,
} from './test-helpers';

describe('Bids (e2e)', () => {
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

  it('should create bid successfully', async () => {
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

    expect(bidRes.body.status).toBe(BidStatus.PENDING);
    expect(bidRes.body.project.id).toBe(projectRes.body.id);
  });

  it('should reject duplicate bid', async () => {
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

    await createBid(app, contractor.accessToken, projectRes.body.id).expect(
      201,
    );
    await createBid(app, contractor.accessToken, projectRes.body.id).expect(
      409,
    );
  });

  it('should reject bid for missing project', async () => {
    const contractor = await registerAndLogin(app, {
      name: 'Contractor',
      email: 'contractor@test.com',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
    });

    await createBid(
      app,
      contractor.accessToken,
      '11111111-1111-1111-1111-111111111111',
    ).expect(404);
  });

  it('should forbid customer from creating bid', async () => {
    const customer = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const owner = await registerAndLogin(app, {
      name: 'Owner',
      email: 'owner@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const projectRes = await createProject(app, owner.accessToken).expect(201);

    await createBid(app, customer.accessToken, projectRes.body.id).expect(403);
  });

  it.each([['CANCELED'], ['IN_WORK'], ['DONE']])(
    'should reject bid when project status is %s',
    async (targetStatus) => {
      const customer = await registerAndLogin(app, {
        name: 'Customer',
        email: 'customer@test.com',
        password: 'Password123!',
        role: UserRole.CUSTOMER,
      });

      const contractor1 = await registerAndLogin(app, {
        name: 'Contractor1',
        email: 'contractor1@test.com',
        password: 'Password123!',
        role: UserRole.CONTRACTOR,
      });

      const contractor2 = await registerAndLogin(app, {
        name: 'Contractor2',
        email: 'contractor2@test.com',
        password: 'Password123!',
        role: UserRole.CONTRACTOR,
      });

      const projectRes = await createProject(app, customer.accessToken).expect(
        201,
      );

      if (targetStatus === 'CANCELED') {
        await request(app.getHttpServer())
          .post(`/projects/${projectRes.body.id}/cancel`)
          .set('Authorization', `Bearer ${customer.accessToken}`)
          .expect(201);
      }

      if (targetStatus === 'IN_WORK' || targetStatus === 'DONE') {
        const firstBidRes = await createBid(
          app,
          contractor1.accessToken,
          projectRes.body.id,
        ).expect(201);

        await acceptBid(app, customer.accessToken, firstBidRes.body.id).expect(
          201,
        );

        if (targetStatus === 'DONE') {
          await request(app.getHttpServer())
            .post(`/projects/${projectRes.body.id}/done`)
            .set('Authorization', `Bearer ${customer.accessToken}`)
            .expect(201);
        }
      }

      await createBid(app, contractor2.accessToken, projectRes.body.id).expect(
        409,
      );
    },
  );

  it('should allow owner to get project bids', async () => {
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

    const res = await request(app.getHttpServer())
      .get(`/projects/${projectRes.body.id}/bids`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(bidRes.body.id);
  });

  it('should forbid foreign customer from getting project bids', async () => {
    const owner = await registerAndLogin(app, {
      name: 'Owner',
      email: 'owner@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const foreignCustomer = await registerAndLogin(app, {
      name: 'Foreign',
      email: 'foreign@test.com',
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
    await createBid(app, contractor.accessToken, projectRes.body.id).expect(
      201,
    );

    await request(app.getHttpServer())
      .get(`/projects/${projectRes.body.id}/bids`)
      .set('Authorization', `Bearer ${foreignCustomer.accessToken}`)
      .expect(403);
  });

  it('should forbid contractor from getting project bids', async () => {
    const owner = await registerAndLogin(app, {
      name: 'Owner',
      email: 'owner@test.com',
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

    await request(app.getHttpServer())
      .get(`/projects/${projectRes.body.id}/bids`)
      .set('Authorization', `Bearer ${contractor.accessToken}`)
      .expect(403);
  });

  it('should return my bids for contractor', async () => {
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

    const res = await request(app.getHttpServer())
      .get('/bids/my')
      .set('Authorization', `Bearer ${contractor.accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe(bidRes.body.id);
  });

  it('should forbid customer from getting my bids', async () => {
    const customer = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    await request(app.getHttpServer())
      .get('/bids/my')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(403);
  });

  it('should accept bid and reject other pending bids', async () => {
    const customer = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const contractor1 = await registerAndLogin(app, {
      name: 'Contractor1',
      email: 'contractor1@test.com',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
    });

    const contractor2 = await registerAndLogin(app, {
      name: 'Contractor2',
      email: 'contractor2@test.com',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
    });

    const projectRes = await createProject(app, customer.accessToken).expect(
      201,
    );

    const bid1Res = await createBid(
      app,
      contractor1.accessToken,
      projectRes.body.id,
    ).expect(201);

    const bid2Res = await createBid(
      app,
      contractor2.accessToken,
      projectRes.body.id,
    ).expect(201);

    const acceptRes = await acceptBid(
      app,
      customer.accessToken,
      bid1Res.body.id,
    ).expect(201);

    expect(acceptRes.body.bid.status).toBe(BidStatus.ACCEPTED);
    expect(acceptRes.body.project.status).toBe(ProjectStatus.IN_WORK);

    const bidsRes = await request(app.getHttpServer())
      .get(`/projects/${projectRes.body.id}/bids`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(200);

    const accepted = bidsRes.body.find((b: any) => b.id === bid1Res.body.id);
    const rejected = bidsRes.body.find((b: any) => b.id === bid2Res.body.id);

    expect(accepted.status).toBe(BidStatus.ACCEPTED);
    expect(rejected.status).toBe(BidStatus.REJECTED);
  });

  it('should forbid contractor from accepting bid', async () => {
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

    await acceptBid(app, contractor.accessToken, bidRes.body.id).expect(403);
  });

  it('should forbid foreign customer from accepting bid', async () => {
    const owner = await registerAndLogin(app, {
      name: 'Owner',
      email: 'owner@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const foreignCustomer = await registerAndLogin(app, {
      name: 'Foreign',
      email: 'foreign@test.com',
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

    await acceptBid(app, foreignCustomer.accessToken, bidRes.body.id).expect(
      403,
    );
  });

  it('should return 404 when accepting missing bid', async () => {
    const customer = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    await acceptBid(
      app,
      customer.accessToken,
      '11111111-1111-1111-1111-111111111111',
    ).expect(404);
  });

  it('should reject accept for invalid bid status', async () => {
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

    await rejectBid(app, customer.accessToken, bidRes.body.id).expect(201);
    await acceptBid(app, customer.accessToken, bidRes.body.id).expect(409);
  });

  it('should reject accept for invalid project status', async () => {
    const customer = await registerAndLogin(app, {
      name: 'Customer',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const contractor1 = await registerAndLogin(app, {
      name: 'Contractor1',
      email: 'contractor1@test.com',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
    });

    const contractor2 = await registerAndLogin(app, {
      name: 'Contractor2',
      email: 'contractor2@test.com',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
    });

    const projectRes = await createProject(app, customer.accessToken).expect(
      201,
    );
    const bid1Res = await createBid(
      app,
      contractor1.accessToken,
      projectRes.body.id,
    ).expect(201);

    const bid2Res = await createBid(
      app,
      contractor2.accessToken,
      projectRes.body.id,
    ).expect(201);

    await acceptBid(app, customer.accessToken, bid1Res.body.id).expect(201);
    await acceptBid(app, customer.accessToken, bid2Res.body.id).expect(409);
  });

  it('should reject bid successfully', async () => {
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

    const rejectRes = await rejectBid(
      app,
      customer.accessToken,
      bidRes.body.id,
    ).expect(201);

    expect(rejectRes.body.status).toBe(BidStatus.REJECTED);
  });

  it('should forbid foreign customer from rejecting bid', async () => {
    const owner = await registerAndLogin(app, {
      name: 'Owner',
      email: 'owner@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const foreignCustomer = await registerAndLogin(app, {
      name: 'Foreign',
      email: 'foreign@test.com',
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

    await rejectBid(app, foreignCustomer.accessToken, bidRes.body.id).expect(
      403,
    );
  });

  it('should reject second reject for same bid', async () => {
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

    await rejectBid(app, customer.accessToken, bidRes.body.id).expect(201);
    await rejectBid(app, customer.accessToken, bidRes.body.id).expect(409);
  });

  it('should reject bid when project status is not OPEN', async () => {
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
    await rejectBid(app, customer.accessToken, bidRes.body.id).expect(409);
  });
});
