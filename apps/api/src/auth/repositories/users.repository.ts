import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateUserParams {
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { email },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  create(data: CreateUserParams): Promise<User> {
    return this.prismaService.user.create({
      data,
    });
  }

  unblock(id: string): Promise<User> {
    return this.prismaService.user.update({
      where: { id },
      data: { isBlocked: false, blockReason: null, blockedUntil: null },
    });
  }
}
