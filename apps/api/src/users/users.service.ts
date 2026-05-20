import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { safeUserSelect } from './types/safe-user.type';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: safeUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    await this.ensureExists(userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.about !== undefined ? { about: dto.about } : {}),
        ...(dto.skills !== undefined ? { skills: dto.skills } : {}),
      },
      select: safeUserSelect,
    });
  }

  async updateEmail(userId: string, dto: UpdateEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordOk = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!passwordOk) {
      this.logger.warn(`Update email failed: invalid password, userId=${userId}`);
      throw new UnauthorizedException('Неверный текущий пароль');
    }

    if (user.email === dto.newEmail) {
      return this.getMe(userId);
    }

    const occupied = await this.prisma.user.findUnique({
      where: { email: dto.newEmail },
      select: { id: true },
    });

    if (occupied) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { email: dto.newEmail },
      select: safeUserSelect,
    });

    this.logger.log(
      `Email updated: userId=${userId}, newEmail=${dto.newEmail}`,
    );

    return updated;
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordOk = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!passwordOk) {
      this.logger.warn(
        `Update password failed: invalid current password, userId=${userId}`,
      );
      throw new UnauthorizedException('Неверный текущий пароль');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new ConflictException(
        'Новый пароль должен отличаться от текущего',
      );
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    this.logger.log(`Password updated: userId=${userId}`);

    return { message: 'Пароль успешно изменён' };
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async ensureExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
