import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersRepository } from './repositories/users.repository';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const usersRepositoryMock = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  const makeUser = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      role: UserRole.CUSTOMER,
      name: 'Test User',
      about: null,
      skills: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AuthService(
      usersRepositoryMock as unknown as UsersRepository,
      jwtServiceMock as unknown as JwtService,
    );
  });

  it('should register user successfully', async () => {
    const createdUser = makeUser({
      email: 'new@example.com',
      role: UserRole.CONTRACTOR,
      name: 'New User',
    });

    usersRepositoryMock.findByEmail.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    usersRepositoryMock.create.mockResolvedValue(createdUser);
    jwtServiceMock.signAsync.mockResolvedValue('jwt-token');

    const result = await service.register({
      email: ' New@Example.com ',
      password: 'Password123!',
      role: UserRole.CONTRACTOR,
      name: ' New User ',
    });

    expect(usersRepositoryMock.findByEmail).toHaveBeenCalledWith(
      'new@example.com',
    );

    expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);

    expect(usersRepositoryMock.create).toHaveBeenCalledWith({
      email: 'new@example.com',
      passwordHash: 'hashed-password',
      role: UserRole.CONTRACTOR,
      name: 'New User',
    });

    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'new@example.com',
      role: UserRole.CONTRACTOR,
    });

    expect(result).toEqual({
      accessToken: 'jwt-token',
      user: expect.objectContaining({
        id: 'user-1',
        email: 'new@example.com',
        role: UserRole.CONTRACTOR,
        name: 'New User',
      }),
    });

    expect(result.user.passwordHash).toBeUndefined();
  });

  it('should throw ConflictException for duplicate email on register', async () => {
    usersRepositoryMock.findByEmail.mockResolvedValue(makeUser());

    await expect(
      service.register({
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.CUSTOMER,
        name: 'User',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should login successfully', async () => {
    const user = makeUser({
      email: 'login@example.com',
      role: UserRole.CUSTOMER,
    });

    usersRepositoryMock.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtServiceMock.signAsync.mockResolvedValue('jwt-token');

    const result = await service.login({
      email: ' Login@Example.com ',
      password: 'Password123!',
    });

    expect(usersRepositoryMock.findByEmail).toHaveBeenCalledWith(
      'login@example.com',
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'Password123!',
      'hashed-password',
    );
    expect(result.accessToken).toBe('jwt-token');
    expect(result.user.passwordHash).toBeUndefined();
  });

  it('should throw UnauthorizedException if login email does not exist', async () => {
    usersRepositoryMock.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if password is invalid', async () => {
    usersRepositoryMock.findByEmail.mockResolvedValue(makeUser());
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'WrongPassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return current user in getMe', async () => {
    const user = makeUser();
    usersRepositoryMock.findById.mockResolvedValue(user);

    const result = await service.getMe('user-1');

    expect(usersRepositoryMock.findById).toHaveBeenCalledWith('user-1');
    expect(result.passwordHash).toBeUndefined();
    expect(result.id).toBe('user-1');
  });

  it('should throw UnauthorizedException if getMe user not found', async () => {
    usersRepositoryMock.findById.mockResolvedValue(null);

    await expect(service.getMe('missing-user')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
