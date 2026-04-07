import { INestApplication } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { clearDb, createTestApp, registerAndLogin } from './test-helpers';

describe('Users (e2e)', () => {
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

  it('should return current user profile', async () => {
    const { accessToken, user } = await registerAndLogin(app, {
      name: 'Customer User',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.id).toBe(user.id);
    expect(res.body.email).toBe('customer@test.com');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('should reject /users/me without token', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('should update current user profile', async () => {
    const { accessToken } = await registerAndLogin(app, {
      name: 'Customer User',
      email: 'customer@test.com',
      password: 'Password123!',
      role: UserRole.CUSTOMER,
    });

    const res = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated Name',
        about: 'Backend developer',
      })
      .expect(200);

    expect(res.body.name).toBe('Updated Name');
    expect(res.body.about).toBe('Backend developer');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('should reject /users/me update without token', async () => {
    await request(app.getHttpServer())
      .patch('/users/me')
      .send({
        name: 'Updated Name',
      })
      .expect(401);
  });

  it('should return public profile by id', async () => {
    const { user } = await registerAndLogin(app, {
      name: 'Public User',
      email: 'public@test.com',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
    });

    const res = await request(app.getHttpServer())
      .get(`/users/${user.id}`)
      .expect(200);

    expect(res.body.id).toBe(user.id);
    expect(res.body.name).toBe('Public User');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('should return 404 for missing public profile', async () => {
    await request(app.getHttpServer())
      .get('/users/11111111-1111-1111-1111-111111111111')
      .expect(404);
  });
});
