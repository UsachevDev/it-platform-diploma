import { INestApplication } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  clearDb,
  createTestApp,
  registerAndLogin,
  registerUser,
} from './test-helpers';

describe('Auth (e2e)', () => {
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

  it('should register successfully', async () => {
    const res = await registerUser(app, {
      name: 'Customer User',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    }).expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('customer@test.com');
    expect(res.body.user.role).toBe(UserRole.CUSTOMER);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('should reject duplicate email on register', async () => {
    await registerUser(app, {
      name: 'Customer User',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    }).expect(201);

    await registerUser(app, {
      name: 'Another User',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
    }).expect(409);
  });

  it('should reject invalid register payload', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'A',
        email: 'not-an-email',
        password: '123',
        role: 'WRONG_ROLE',
      })
      .expect(400);
  });

  it('should login successfully', async () => {
    await registerUser(app, {
      name: 'Customer User',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    }).expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'customer@test.com',
        password: 'Password123!',
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('customer@test.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('should reject login with unknown email', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'missing@test.com',
        password: 'Password123!',
      })
      .expect(401);
  });

  it('should reject login with wrong password', async () => {
    await registerUser(app, {
      name: 'Customer User',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    }).expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'customer@test.com',
        password: 'WrongPassword123!',
      })
      .expect(401);
  });

  it('should return current user in /auth/me', async () => {
    const { accessToken } = await registerAndLogin(app, {
      name: 'Customer User',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.email).toBe('customer@test.com');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('should reject /auth/me without token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('should reject /auth/me with invalid token', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('should allow customer to access /auth/customer-only', async () => {
    const { accessToken } = await registerAndLogin(app, {
      name: 'Customer User',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    await request(app.getHttpServer())
      .get('/auth/customer-only')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('should forbid contractor from /auth/customer-only', async () => {
    const { accessToken } = await registerAndLogin(app, {
      name: 'Contractor User',
      email: 'contractor@test.com',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
    });

    await request(app.getHttpServer())
      .get('/auth/customer-only')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });
});
